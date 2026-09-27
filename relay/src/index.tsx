import { Hono } from "hono";
import {
	approveSession,
	consumeApprovedSession,
	createSession,
	getSession,
	rejectSession,
	SESSION_TTL,
} from "./kv";
import {
	getProvider,
	type ProviderRegistry,
	providers as productionProviders,
} from "./providers";
import { ExpiredPage } from "./views/expired";
import { HandledPage } from "./views/handled";
import { InstallPage } from "./views/install";
import { RejectedPage } from "./views/rejected";
import { SuccessPage } from "./views/success";

export interface Bindings {
	SESSIONS: KVNamespace;
	SESSION_LIMITER: RateLimit;
}

interface CreateSessionBody {
	provider?: unknown;
	client_id?: unknown;
	code_challenge?: unknown;
	code_challenge_method?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

export function createApp(registry: ProviderRegistry) {
	const app = new Hono<{ Bindings: Bindings }>();

	app.post("/api/session", async (c) => {
		c.header("Cache-Control", "no-store");

		// Per-IP cap, checked before any body parsing/validation, to protect the KV daily
		// write quota from a flood of requests regardless of payload shape.
		const rateLimitKey = c.req.header("cf-connecting-ip") ?? "unknown";
		const { success } = await c.env.SESSION_LIMITER.limit({
			key: rateLimitKey,
		});
		if (!success) {
			c.header("Retry-After", "60");
			return c.json({ error: "rate_limited" }, 429);
		}

		let body: CreateSessionBody;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: "invalid_json" }, 400);
		}

		const providerId = body.provider === undefined ? "linear" : body.provider;
		if (!isNonEmptyString(providerId)) {
			return c.json({ error: "invalid_provider" }, 400);
		}
		const provider = getProvider(registry, providerId);
		if (!provider) {
			return c.json({ error: "unknown_provider" }, 400);
		}

		if (body.code_challenge_method !== "S256") {
			return c.json({ error: "unsupported_code_challenge_method" }, 400);
		}
		if (
			!isNonEmptyString(body.client_id) ||
			!isNonEmptyString(body.code_challenge)
		) {
			return c.json({ error: "missing_fields" }, 400);
		}

		const sessionId = crypto.randomUUID();
		try {
			await createSession(c.env.SESSIONS, sessionId, {
				provider: provider.id,
				client_id: body.client_id,
				code_challenge: body.code_challenge,
			});
		} catch {
			// KV throws when the daily write quota is exhausted. 503 lets the Mac fall back
			// to local admin sign-in instead of surfacing a bare 500.
			return c.json({ error: "relay_unavailable" }, 503);
		}

		const installUrl = new URL(`/install/${sessionId}`, c.req.url).toString();
		return c.json(
			{
				session_id: sessionId,
				install_url: installUrl,
				expires_in: SESSION_TTL,
			},
			201,
		);
	});

	app.get("/install/:id", async (c) => {
		const sessionId = c.req.param("id");
		const session = await getSession(c.env.SESSIONS, sessionId);
		if (!session) {
			return c.html(<ExpiredPage />, 404);
		}
		if (session.status !== "pending") {
			return c.html(<HandledPage />);
		}
		const provider = getProvider(registry, session.provider);
		if (!provider) {
			return c.html(<ExpiredPage />, 404);
		}

		const redirectUri = new URL("/callback", c.req.url).toString();
		const authorizeUrl = provider.authorizeUrl(
			{
				session_id: sessionId,
				provider: session.provider,
				client_id: session.client_id,
				code_challenge: session.code_challenge,
			},
			redirectUri,
		);

		return c.html(
			<InstallPage provider={provider} authorizeUrl={authorizeUrl} />,
		);
	});

	app.get("/callback", async (c) => {
		const sessionId = c.req.query("state");
		if (!isNonEmptyString(sessionId)) {
			return c.html(<ExpiredPage />, 404);
		}
		const session = await getSession(c.env.SESSIONS, sessionId);
		if (!session) {
			return c.html(<ExpiredPage />, 404);
		}
		if (session.status !== "pending") {
			// Already approved/rejected: never re-process a replayed callback, and never write to KV.
			return c.html(<HandledPage />);
		}
		const provider = getProvider(registry, session.provider);
		if (!provider) {
			return c.html(<ExpiredPage />, 404);
		}

		const query = new URL(c.req.url).searchParams;
		const parsed = provider.parseCallback(query);

		if ("error" in parsed) {
			await rejectSession(c.env.SESSIONS, sessionId, session, parsed.error);
			return c.html(<RejectedPage />);
		}

		await approveSession(c.env.SESSIONS, sessionId, session, parsed.code);
		return c.html(<SuccessPage />);
	});

	app.get("/api/session/:id", async (c) => {
		c.header("Cache-Control", "no-store");
		const sessionId = c.req.param("id");
		const session = await getSession(c.env.SESSIONS, sessionId);
		if (!session) {
			return c.json({ status: "expired" }, 404);
		}
		if (session.status === "pending") {
			return c.json({ status: "pending" });
		}
		if (session.status === "rejected") {
			return c.json({ status: "rejected", error: session.error });
		}

		// Approved: delete-on-read so the code can only be collected once. Best-effort single use —
		// see the consistency note in kv.ts — the PKCE verifier is the real backstop.
		const consumed = await consumeApprovedSession(c.env.SESSIONS, sessionId);
		if (!consumed) {
			return c.json({ status: "expired" }, 404);
		}
		return c.json({ status: "approved", code: consumed.code });
	});

	return app;
}

export default createApp(productionProviders);
