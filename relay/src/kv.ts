/**
 * Session helpers over Workers KV.
 *
 * Consistency note (be honest about this, don't claim atomicity we don't have): Workers KV is
 * eventually consistent across Cloudflare's edge locations (propagation can take up to ~60s), and
 * `consume` below (get-then-delete) is best-effort single use — two reads racing from different
 * PoPs in that window could both observe the code before the delete propagates everywhere. That
 * is why the relay is not the security boundary: an intercepted code is still useless without the
 * PKCE `code_verifier`, which never reaches the relay. KV is a convenience relay, not a lock.
 */

/** How long a session stays "pending" before an unopened install link goes stale. */
export const SESSION_TTL = 900;

/** How long an authorization code lives once approved/rejected, before it must be collected. */
export const CODE_TTL = 180;

export type SessionStatus = "pending" | "approved" | "rejected";

export interface PendingSession {
	status: "pending";
	provider: string;
	client_id: string;
	code_challenge: string;
	created_at: number;
}

export interface ApprovedSession {
	status: "approved";
	provider: string;
	client_id: string;
	code_challenge: string;
	created_at: number;
	code: string;
}

export interface RejectedSession {
	status: "rejected";
	provider: string;
	client_id: string;
	code_challenge: string;
	created_at: number;
	error: string;
}

export type SessionRecord = PendingSession | ApprovedSession | RejectedSession;

function key(sessionId: string): string {
	return `session:${sessionId}`;
}

export async function createSession(
	kv: KVNamespace,
	sessionId: string,
	data: { provider: string; client_id: string; code_challenge: string },
): Promise<void> {
	const record: PendingSession = {
		status: "pending",
		provider: data.provider,
		client_id: data.client_id,
		code_challenge: data.code_challenge,
		created_at: Date.now(),
	};
	await kv.put(key(sessionId), JSON.stringify(record), {
		expirationTtl: SESSION_TTL,
	});
}

export async function getSession(
	kv: KVNamespace,
	sessionId: string,
): Promise<SessionRecord | undefined> {
	const raw = await kv.get(key(sessionId));
	if (!raw) return undefined;
	return JSON.parse(raw) as SessionRecord;
}

export async function approveSession(
	kv: KVNamespace,
	sessionId: string,
	pending: PendingSession,
	code: string,
): Promise<void> {
	const record: ApprovedSession = {
		status: "approved",
		provider: pending.provider,
		client_id: pending.client_id,
		code_challenge: pending.code_challenge,
		created_at: pending.created_at,
		code,
	};
	await kv.put(key(sessionId), JSON.stringify(record), {
		expirationTtl: CODE_TTL,
	});
}

export async function rejectSession(
	kv: KVNamespace,
	sessionId: string,
	pending: PendingSession,
	error: string,
): Promise<void> {
	const record: RejectedSession = {
		status: "rejected",
		provider: pending.provider,
		client_id: pending.client_id,
		code_challenge: pending.code_challenge,
		created_at: pending.created_at,
		error,
	};
	await kv.put(key(sessionId), JSON.stringify(record), {
		expirationTtl: CODE_TTL,
	});
}

/** Reads an approved session's code and deletes the key, so it can only be served once. */
export async function consumeApprovedSession(
	kv: KVNamespace,
	sessionId: string,
): Promise<ApprovedSession | undefined> {
	const record = await getSession(kv, sessionId);
	if (record?.status !== "approved") return undefined;
	await kv.delete(key(sessionId));
	return record;
}
