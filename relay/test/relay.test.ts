import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { Bindings } from "../src/index";
import { createApp } from "../src/index";
import { providers } from "../src/providers";
import { fakeProvider } from "./fake-provider";

const validBody = {
	client_id: "client-123",
	code_challenge: "challenge-abc",
	code_challenge_method: "S256",
};

const allowLimiter: RateLimit = {
	limit: async () => ({ success: true }),
};

function request(
	app: ReturnType<typeof createApp>,
	path: string,
	init?: RequestInit,
	extraEnv?: Partial<Bindings>,
) {
	return app.request(path, init, {
		SESSIONS: env.SESSIONS,
		SESSION_LIMITER: allowLimiter,
		...extraEnv,
	});
}

async function createSession(
	app: ReturnType<typeof createApp>,
	body: Record<string, unknown> = validBody,
) {
	const res = await request(app, "/api/session", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	const json = await res.json<{
		session_id: string;
		install_url: string;
		expires_in: number;
	}>();
	return { res, json };
}

describe("POST /api/session", () => {
	const app = createApp(providers);

	it("creates a pending session and returns 201 with install_url and expires_in", async () => {
		const { res, json } = await createSession(app);
		expect(res.status).toBe(201);
		expect(json.expires_in).toBe(900);
		expect(json.session_id).toBeTruthy();
		expect(json.install_url).toContain(`/install/${json.session_id}`);
	});

	it("defaults provider to linear when omitted", async () => {
		const { res } = await createSession(app, {
			client_id: "c",
			code_challenge: "x",
			code_challenge_method: "S256",
		});
		expect(res.status).toBe(201);
	});

	it("rejects an unknown provider with 400", async () => {
		const { res } = await createSession(app, {
			...validBody,
			provider: "jira",
		});
		expect(res.status).toBe(400);
	});

	it.each(["toString", "constructor", "__proto__"])(
		"rejects inherited Object.prototype key %s as a provider with 400",
		async (provider) => {
			const { res } = await createSession(app, { ...validBody, provider });
			expect(res.status).toBe(400);
		},
	);

	it("rejects a non-S256 code_challenge_method with 400", async () => {
		const { res } = await createSession(app, {
			...validBody,
			code_challenge_method: "plain",
		});
		expect(res.status).toBe(400);
	});

	it("rejects missing client_id with 400", async () => {
		const { res } = await createSession(app, {
			code_challenge: "x",
			code_challenge_method: "S256",
		});
		expect(res.status).toBe(400);
	});

	it("rejects missing code_challenge with 400", async () => {
		const { res } = await createSession(app, {
			client_id: "c",
			code_challenge_method: "S256",
		});
		expect(res.status).toBe(400);
	});

	it("rejects non-string fields with 400", async () => {
		const { res } = await createSession(app, { ...validBody, client_id: 123 });
		expect(res.status).toBe(400);
	});

	it("rejects invalid JSON with 400", async () => {
		const res = await request(app, "/api/session", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{not json",
		});
		expect(res.status).toBe(400);
	});

	it("sets Cache-Control: no-store", async () => {
		const { res } = await createSession(app);
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});

describe("GET /install/:id", () => {
	const app = createApp(providers);

	it("renders the Linear authorize URL with state, challenge, actor=app and team guidance", async () => {
		const { json } = await createSession(app);
		const res = await request(app, `/install/${json.session_id}`);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("actor=app");
		expect(html).toContain(`state=${json.session_id}`);
		expect(html).toContain(encodeURIComponent(validBody.code_challenge));
		expect(html).toContain("Only select teams");
		expect(html).toContain("Approve in Linear");
	});

	it("renders the expired page with 404 for an unknown session", async () => {
		const res = await request(app, "/install/does-not-exist");
		expect(res.status).toBe(404);
		const html = await res.text();
		expect(html).toContain("expired or is invalid");
	});

	it("renders the already-handled page for a non-pending session", async () => {
		const { json } = await createSession(app);
		await request(app, `/callback?code=abc&state=${json.session_id}`);
		const res = await request(app, `/install/${json.session_id}`);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("already been used");
	});

	it("sets Cache-Control: no-store", async () => {
		const { json } = await createSession(app);
		const res = await request(app, `/install/${json.session_id}`);
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});

describe("GET /api/session/:id", () => {
	const app = createApp(providers);

	it("returns pending for a fresh session", async () => {
		const { json } = await createSession(app);
		const res = await request(app, `/api/session/${json.session_id}`);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "pending" });
	});

	it("returns 404 expired for an unknown session", async () => {
		const res = await request(app, "/api/session/does-not-exist");
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ status: "expired" });
	});

	it("sets Cache-Control: no-store", async () => {
		const { json } = await createSession(app);
		const res = await request(app, `/api/session/${json.session_id}`);
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});

describe("GET /callback", () => {
	const app = createApp(providers);

	it("approves on a successful callback and the code is retrievable once via polling", async () => {
		const { json } = await createSession(app);
		const callbackRes = await request(
			app,
			`/callback?code=auth-code-1&state=${json.session_id}`,
			{ redirect: "manual" },
		);
		expect(callbackRes.status).toBe(303);
		expect(callbackRes.headers.get("location")).toBe("/done?result=approved");

		const doneRes = await request(app, "/done?result=approved");
		expect(doneRes.status).toBe(200);
		expect(await doneRes.text()).toContain("authorized");

		const poll1 = await request(app, `/api/session/${json.session_id}`);
		expect(poll1.status).toBe(200);
		expect(await poll1.json()).toEqual({
			status: "approved",
			code: "auth-code-1",
		});

		const poll2 = await request(app, `/api/session/${json.session_id}`);
		expect(poll2.status).toBe(404);
		expect(await poll2.json()).toEqual({ status: "expired" });
	});

	it("rejects on error=access_denied", async () => {
		const { json } = await createSession(app);
		const res = await request(
			app,
			`/callback?error=access_denied&state=${json.session_id}`,
			{ redirect: "manual" },
		);
		expect(res.status).toBe(303);
		expect(res.headers.get("location")).toBe("/done?result=rejected");

		const doneRes = await request(app, "/done?result=rejected");
		expect(await doneRes.text()).toContain("cancelled");

		const poll = await request(app, `/api/session/${json.session_id}`);
		expect(await poll.json()).toEqual({
			status: "rejected",
			error: "access_denied",
		});
	});

	it("redirects to expired for an unknown state", async () => {
		const res = await request(app, "/callback?code=abc&state=does-not-exist", {
			redirect: "manual",
		});
		expect(res.status).toBe(303);
		expect(res.headers.get("location")).toBe("/done?result=expired");
	});

	it("redirects to expired when state is missing", async () => {
		const res = await request(app, "/callback?code=abc", {
			redirect: "manual",
		});
		expect(res.status).toBe(303);
		expect(res.headers.get("location")).toBe("/done?result=expired");
	});

	it("does not overwrite an already-approved session on replay", async () => {
		const { json } = await createSession(app);
		await request(app, `/callback?code=first-code&state=${json.session_id}`, {
			redirect: "manual",
		});
		const replay = await request(
			app,
			`/callback?code=second-code&state=${json.session_id}`,
			{ redirect: "manual" },
		);
		expect(replay.status).toBe(303);
		expect(replay.headers.get("location")).toBe("/done?result=handled");

		const doneRes = await request(app, "/done?result=handled");
		expect(await doneRes.text()).toContain("already been used");

		const poll = await request(app, `/api/session/${json.session_id}`);
		expect(await poll.json()).toEqual({
			status: "approved",
			code: "first-code",
		});
	});

	it("never includes the code in the redirect Location", async () => {
		const { json } = await createSession(app);
		const res = await request(
			app,
			`/callback?code=super-secret-code&state=${json.session_id}`,
			{ redirect: "manual" },
		);
		const location = res.headers.get("location");
		expect(location).not.toContain("super-secret-code");
	});

	it("sets Cache-Control: no-store", async () => {
		const { json } = await createSession(app);
		const res = await request(
			app,
			`/callback?code=abc&state=${json.session_id}`,
			{ redirect: "manual" },
		);
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});

describe("GET /done", () => {
	const app = createApp(providers);

	it("renders SuccessPage 200 for result=approved", async () => {
		const res = await request(app, "/done?result=approved");
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("authorized");
	});

	it("renders RejectedPage 200 for result=rejected", async () => {
		const res = await request(app, "/done?result=rejected");
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("cancelled");
	});

	it("renders HandledPage 200 for result=handled", async () => {
		const res = await request(app, "/done?result=handled");
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("already been used");
	});

	it("renders ExpiredPage 404 for result=expired", async () => {
		const res = await request(app, "/done?result=expired");
		expect(res.status).toBe(404);
		expect(await res.text()).toContain("expired or is invalid");
	});

	it("renders ExpiredPage 404 for a missing result", async () => {
		const res = await request(app, "/done");
		expect(res.status).toBe(404);
		expect(await res.text()).toContain("expired or is invalid");
	});

	it("renders ExpiredPage 404 for an unknown result value", async () => {
		const res = await request(app, "/done?result=bogus");
		expect(res.status).toBe(404);
		expect(await res.text()).toContain("expired or is invalid");
	});

	it("sets Cache-Control: no-store", async () => {
		const res = await request(app, "/done?result=approved");
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});

describe("security headers", () => {
	const app = createApp(providers);

	const expectedHeaders = {
		"content-security-policy":
			"default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
		"referrer-policy": "no-referrer",
		"x-content-type-options": "nosniff",
		"strict-transport-security": "max-age=31536000",
	};

	it("sets security headers on an HTML route", async () => {
		const { json } = await createSession(app);
		const res = await request(app, `/install/${json.session_id}`);
		for (const [name, value] of Object.entries(expectedHeaders)) {
			expect(res.headers.get(name)).toBe(value);
		}
	});

	it("sets security headers on /done", async () => {
		const res = await request(app, "/done?result=approved");
		for (const [name, value] of Object.entries(expectedHeaders)) {
			expect(res.headers.get(name)).toBe(value);
		}
	});

	it("sets security headers on a JSON route", async () => {
		const { res } = await createSession(app);
		for (const [name, value] of Object.entries(expectedHeaders)) {
			expect(res.headers.get(name)).toBe(value);
		}
	});

	it("sets security headers on the 404 expired page", async () => {
		const res = await request(app, "/install/does-not-exist");
		expect(res.status).toBe(404);
		for (const [name, value] of Object.entries(expectedHeaders)) {
			expect(res.headers.get(name)).toBe(value);
		}
	});

	it("does not set includeSubDomains on Strict-Transport-Security", async () => {
		const res = await request(app, "/done?result=approved");
		expect(res.headers.get("strict-transport-security")).not.toContain(
			"includeSubDomains",
		);
	});
});

describe("POST /api/session rate limiting", () => {
	const app = createApp(providers);

	it("returns 429 with Retry-After and no-store when the limiter denies, and writes no session", async () => {
		const denyLimiter: RateLimit = { limit: async () => ({ success: false }) };
		const before = await env.SESSIONS.list({ prefix: "session:" });

		const res = await request(
			app,
			"/api/session",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(validBody),
			},
			{ SESSION_LIMITER: denyLimiter },
		);

		expect(res.status).toBe(429);
		expect(await res.json()).toEqual({ error: "rate_limited" });
		expect(res.headers.get("retry-after")).toBe("60");
		expect(res.headers.get("cache-control")).toBe("no-store");

		const after = await env.SESSIONS.list({ prefix: "session:" });
		expect(after.keys.length).toBe(before.keys.length);
	});

	it("denies before body validation: an invalid JSON body still yields 429, not 400", async () => {
		const denyLimiter: RateLimit = { limit: async () => ({ success: false }) };

		const res = await request(
			app,
			"/api/session",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{not json",
			},
			{ SESSION_LIMITER: denyLimiter },
		);

		expect(res.status).toBe(429);
	});

	it("calls the limiter with the cf-connecting-ip header value as the key", async () => {
		let capturedKey: string | undefined;
		const recordingLimiter: RateLimit = {
			limit: async (options) => {
				capturedKey = options.key;
				return { success: true };
			},
		};

		await request(
			app,
			"/api/session",
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					"cf-connecting-ip": "203.0.113.7",
				},
				body: JSON.stringify(validBody),
			},
			{ SESSION_LIMITER: recordingLimiter },
		);

		expect(capturedKey).toBe("203.0.113.7");
	});

	it("calls the limiter with key 'unknown' when cf-connecting-ip is absent", async () => {
		let capturedKey: string | undefined;
		const recordingLimiter: RateLimit = {
			limit: async (options) => {
				capturedKey = options.key;
				return { success: true };
			},
		};

		await request(
			app,
			"/api/session",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(validBody),
			},
			{ SESSION_LIMITER: recordingLimiter },
		);

		expect(capturedKey).toBe("unknown");
	});
});

describe("POST /api/session KV failures", () => {
	const app = createApp(providers);

	it("returns 503 with no-store when the KV write throws", async () => {
		const failingSessions: KVNamespace = {
			...env.SESSIONS,
			put: async () => {
				throw new Error("KV daily write quota exceeded");
			},
		};

		const res = await request(
			app,
			"/api/session",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(validBody),
			},
			{ SESSIONS: failingSessions },
		);

		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ error: "relay_unavailable" });
		expect(res.headers.get("cache-control")).toBe("no-store");
	});
});

describe("fake provider round trip", () => {
	it("goes through the same routes as production providers", async () => {
		const app = createApp({ fake: fakeProvider });
		const { json } = await createSession(app, {
			client_id: "c",
			code_challenge: "x",
			code_challenge_method: "S256",
			provider: "fake",
		});
		expect(json.session_id).toBeTruthy();

		const installRes = await request(app, `/install/${json.session_id}`);
		expect(installRes.status).toBe(200);
		const html = await installRes.text();
		expect(html).toContain("fake-tracker.example");

		await request(app, `/callback?code=fake-code&state=${json.session_id}`);
		const poll = await request(app, `/api/session/${json.session_id}`);
		expect(await poll.json()).toEqual({
			status: "approved",
			code: "fake-code",
		});
	});
});
