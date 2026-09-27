import type { ParsedCallback, Provider, Session } from "../src/providers/types";

/** Minimal PKCE-S256 adapter used only in tests to prove the provider seam works for a
 * second, non-Linear tracker without touching the production registry. */
export const fakeProvider: Provider = {
	id: "fake",
	displayName: "Fake Tracker",
	pkce: "S256",
	clientIds: ["fake-client-id"],
	authorizeUrl(session: Session, redirectUri: string): string {
		const url = new URL("https://fake-tracker.example/oauth/authorize");
		url.searchParams.set("client_id", session.client_id);
		url.searchParams.set("redirect_uri", redirectUri);
		url.searchParams.set("state", session.session_id);
		url.searchParams.set("code_challenge", session.code_challenge);
		url.searchParams.set("code_challenge_method", "S256");
		return url.toString();
	},
	parseCallback(query: URLSearchParams): ParsedCallback {
		const error = query.get("error");
		if (error) return { error };
		const code = query.get("code");
		if (!code) return { error: "missing_code" };
		return { code };
	},
	Guidance() {
		return <p>Fake tracker guidance for tests.</p>;
	},
};
