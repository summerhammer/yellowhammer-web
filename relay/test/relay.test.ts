import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/index";
import { providers } from "../src/providers";
import { fakeProvider } from "./fake-provider";

const validBody = {
	client_id: "client-123",
	code_challenge: "challenge-abc",
	code_challenge_method: "S256",
};

function request(
	app: ReturnType<typeof createApp>,
	path: string,
	init?: RequestInit,
) {
	return app.request(path, init, { SESSIONS: env.SESSIONS });
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
		);
		expect(callbackRes.status).toBe(200);
		expect(await callbackRes.text()).toContain("authorized");

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
		);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("cancelled");

		const poll = await request(app, `/api/session/${json.session_id}`);
		expect(await poll.json()).toEqual({
			status: "rejected",
			error: "access_denied",
		});
	});

	it("returns 404 for an unknown state", async () => {
		const res = await request(app, "/callback?code=abc&state=does-not-exist");
		expect(res.status).toBe(404);
	});

	it("returns 404 when state is missing", async () => {
		const res = await request(app, "/callback?code=abc");
		expect(res.status).toBe(404);
	});

	it("does not overwrite an already-approved session on replay", async () => {
		const { json } = await createSession(app);
		await request(app, `/callback?code=first-code&state=${json.session_id}`);
		const replay = await request(
			app,
			`/callback?code=second-code&state=${json.session_id}`,
		);
		expect(replay.status).toBe(200);
		expect(await replay.text()).toContain("already been used");

		const poll = await request(app, `/api/session/${json.session_id}`);
		expect(await poll.json()).toEqual({
			status: "approved",
			code: "first-code",
		});
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
