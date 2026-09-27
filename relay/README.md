# Code Relay

A Cloudflare Worker (Hono + JSX, Workers KV, Static Assets) that relays a short-lived OAuth
authorization code from an issue-tracker admin's browser to the Yellowhammer Operator's Mac. See
the spec's "Code Relay" investigation for the full protocol; this is the implementation summary.

## Routes

| Route | Purpose |
|---|---|
| `POST /api/session` | Mac → relay. Body `{client_id, code_challenge, code_challenge_method, provider?}` (`provider` defaults to `"linear"`). Creates a pending session, returns `{session_id, install_url, expires_in}`. |
| `GET /install/:id` | Admin's browser. Read-only. Renders the provider's guidance and an "Approve in <Provider>" link. 404 if the session is missing/expired; an "already handled" page if it's no longer pending. |
| `GET /callback` | Issue tracker → relay redirect target for all providers. Validates `state` against the session, records `approved` (with the code) or `rejected` (with the error), and renders a confirmation page. A replayed callback on a non-pending session renders "already handled" and writes nothing. |
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

## KV budget & consistency

Per install: 2 writes (create session, then approve/reject on callback) and at most 1 delete (code
consumed on poll). Install page views, pending polls, and callback replays never write. This
comfortably fits Cloudflare's free tier (1,000 KV writes/day).

Workers KV is eventually consistent across edge locations (propagation can take up to ~60s), and
the delete-on-read in `consumeApprovedSession` is best-effort single use, not a lock — a read
racing from a different PoP within that window could theoretically see the code before the delete
propagates. This is why the relay isn't the security boundary: the PKCE `code_verifier` (never
sent to the relay) is what actually makes an intercepted or double-read code useless.

## Open items (not implemented here)

- Rate limiting / abuse protection on `POST /api/session`.
- CORS, CSP, and other security headers.
- `client_id` allowlisting and `code_challenge` shape validation.
