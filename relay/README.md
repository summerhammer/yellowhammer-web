# Code Relay

A Cloudflare Worker (Hono + JSX, Workers KV, Static Assets) that relays a short-lived OAuth
authorization code from an issue-tracker admin's browser to the Yellowhammer Operator's Mac. See
the spec's "Code Relay" investigation for the full protocol; this is the implementation summary.

## Routes

| Route | Purpose |
|---|---|
| `POST /api/session` | Mac → relay. Body `{client_id, code_challenge, code_challenge_method, provider?}` (`provider` defaults to `"linear"`). Creates a pending session, returns `{session_id, install_url, expires_in}`. Rate limited (see below); returns `429 {error: "rate_limited"}` with `Retry-After: 60` when the limiter denies, or `503 {error: "relay_unavailable"}` if the KV write throws (e.g. the daily write quota is exhausted). Both responses are `Cache-Control: no-store`. |
| `GET /install/:id` | Admin's browser. Read-only. Renders the provider's guidance and an "Approve in <Provider>" link. 404 if the session is missing/expired; an "already handled" page if it's no longer pending. |
| `GET /callback` | Issue tracker → relay redirect target for all providers. Validates `state` against the session, records `approved` (with the code) or `rejected` (with the error), then responds `303 See Other` to `/done?result=<outcome>` — the auth code never appears in a URL the admin's browser keeps in history. A replayed callback on a non-pending session redirects to `result=handled` and writes nothing; a missing/unknown `state` or provider redirects to `result=expired`. |
| `GET /done` | Renders the outcome page for `/callback`, from the `result` query param only (no KV read — see below). `approved` → confirmation (200), `rejected` → cancelled (200), `handled` → already-used (200), `expired`/missing/unknown → expired (404). |
| `GET /api/session/:id` | Mac polls this. `pending` / `rejected` / `approved` (code is deleted from KV on this read, so it's single-use) / 404 `expired`. All responses are `Cache-Control: no-store`. |

## Provider seam

`src/providers/types.ts` defines the `Provider` port: an `id`, `displayName`, the literal
`pkce: "S256"`, `authorizeUrl(session, redirectUri)`, `parseCallback(query)`, and a `Guidance` JSX
component for the install page. `pkce` is mandatory because the relay's core security property —
a relayed code is useless without the `code_verifier`, which never reaches the relay — only holds
for PKCE/S256 flows; an adapter that can't claim that literal can't be registered.

To add a tracker: implement `Provider` in `src/providers/<name>.tsx`, and add it to the registry in
`src/providers/index.ts`. Routes are provider-agnostic; `src/index.tsx` exports `createApp(registry)`
so tests can inject a fake provider (`test/fake-provider.tsx`) without touching the production
registry, which currently contains only Linear.

## Rate limiting

`POST /api/session` is guarded by the `SESSION_LIMITER` Workers Rate Limiting binding: 5 requests
per 60 seconds, keyed on the `cf-connecting-ip` header (falling back to `"unknown"` when absent).
The check runs before any body parsing/validation. Rate limit counters are per Cloudflare
location, so this is an approximate, per-IP-per-PoP cap, not a global one — it stops a single
noisy client but not a distributed flood spread across many IPs/locations, which could still
exhaust the daily KV write quota. Fixing that would need a different storage strategy for session
creation; see ADR-006 (proposed).

## KV budget & consistency

Per install: 2 writes (create session, then approve/reject on callback) and at most 1 delete (code
consumed on poll). Install page views, pending polls, and callback replays never write. This
comfortably fits Cloudflare's free tier (1,000 KV writes/day).

Workers KV is eventually consistent across edge locations (propagation can take up to ~60s), and
the delete-on-read in `consumeApprovedSession` is best-effort single use, not a lock — a read
racing from a different PoP within that window could theoretically see the code before the delete
propagates. This is why the relay isn't the security boundary: the PKCE `code_verifier` (never
sent to the relay) is what actually makes an intercepted or double-read code useless.

## Security headers

Every response carries a fixed set of headers via app-wide middleware: a `Content-Security-Policy`
that allows only a same-origin stylesheet and blocks everything else (scripts, frames, forms,
inline styles), `Referrer-Policy: no-referrer` (both `/callback` and `/install` URLs carry
sensitive query params — the auth code and the session id, respectively — that must never leak via
a `Referer` header), `X-Content-Type-Options: nosniff`, and
`Strict-Transport-Security: max-age=31536000` (deliberately without `includeSubDomains`, since
other `yellowhammer.dev` subdomains aren't committed to HTTPS). `/install/:id`, `/callback`, and
`/done` are also `Cache-Control: no-store`, matching the API routes.

`/done` renders purely from its `result` query param, with no KV read: reading the session there
would show "expired" once the Mac has already consumed the code via polling, and KV's eventual
consistency could show a stale "pending" state right after approval or rejection.

## Open items (not implemented here)

- Distributed abuse of `POST /api/session` across many IPs/locations can still exhaust the daily
  KV write quota; per-IP rate limiting (above) doesn't cover that case.
- CORS.
- `client_id` allowlisting and `code_challenge` shape validation.
