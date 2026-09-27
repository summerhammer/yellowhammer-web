import type { FC } from "hono/jsx";

/** A session record as read by a provider adapter (see `../kv.ts` for the full shape). */
export interface Session {
	session_id: string;
	provider: string;
	client_id: string;
	code_challenge: string;
}

export type ParsedCallback = { code: string } | { error: string };

/**
 * Port for one issue-tracker's OAuth handshake.
 *
 * The relay's core security property — an authorization code is useless without the PKCE
 * `code_verifier`, which never leaves the Operator's Mac — only holds for providers that use
 * PKCE with S256. That is why `pkce` is a mandatory literal type rather than a free-form string:
 * an adapter that can't say "S256" here cannot be registered, so the relay can't accidentally
 * relay a code for a flow where that guarantee doesn't apply.
 */
export interface Provider {
	/** Registry key, e.g. "linear". Also used as the `provider` field on a session. */
	id: string;
	/** Human-readable name shown in copy, e.g. "Linear". */
	displayName: string;
	/** Literal marker: this adapter authenticates using PKCE with S256. */
	pkce: "S256";
	/** Build the provider's OAuth authorize URL for this session. */
	authorizeUrl(session: Session, redirectUri: string): string;
	/** Parse the provider's redirect back to `/callback` into a code or an error. */
	parseCallback(query: URLSearchParams): ParsedCallback;
	/** Provider-specific guidance body rendered on the install page. */
	Guidance: FC;
}
