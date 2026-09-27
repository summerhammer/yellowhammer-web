# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Part of the Yellowhammer multi-repo product (siblings under `../`). It hosts two Cloudflare apps:

- **Relay** (`relay/`): Cloudflare Workers + Static Assets + Workers KV, built with Hono (TypeScript + JSX, server-rendered) + Tailwind. It is the "Code Relay" for issue-tracker auth, and only Linear is supported. Served at `app.yellowhammer.dev`.
- **Landing** (`astro/`): the marketing site, built with Astro + Tailwind and deployed to Cloudflare Pages. It contains no auth logic.

Stay on the Cloudflare **Free Tier**. KV allows 1,000 writes/day, so be careful with anything that writes per request.

## Spec is authoritative

- The spec lives in `../yellowhammer-spec`. Read it there, using the spec's `spec-lookup` / `spec-implement` skills or the `spec` MCP server. Never copy spec content into this repo and never edit the spec from here.
- ADR status matters. An `accepted` ADR is binding. **`proposed` is not binding**, so flag it before building on one.
  - Relay design: `docs/tech/decisions/006-remote-admin-approval-code-relay.md`. It is **proposed** and waits on probes L8–L11.
  - Protocol detail: `docs/tech/investigations/2026-09-27-linear-remote-auth-relay.md`.
  - Linear auth basis: ADR-005. It is accepted: a shared public OAuth app, PKCE, `actor=app`, and no client secret.
- Use glossary terms verbatim (`docs/glossary.md`), e.g. "Code Relay".
- Brand (`docs/brand/*`) is unfilled. Don't invent colours, fonts or tone.

## Relay security invariants

- The relay never sees the PKCE `code_verifier`, a client secret, or any access/refresh token. The token exchange happens on the Mac. The relay only holds the short-lived authorization code.
- It stores no user or workspace data. KV holds only `session:<id>` records with a TTL.
- An approved code is **deleted on read** from `GET /api/session/:id`, so it can be used once.
- There are no secret env vars. `client_id` is public.

## Tooling

- Use pnpm workspaces. Don't use npm or yarn. Run package scripts with `pnpm --filter <pkg> <script>`.
- Tests use Vitest with `@cloudflare/vitest-pool-workers`, so relay tests run in the Workers runtime rather than Node.
- Biome handles both lint and format. Don't add ESLint or Prettier.
- **Never run `wrangler deploy` or `wrangler pages deploy`.** A Wrangler GitHub Action deploys on merge. `wrangler dev` is fine for local runs.

## Git conventions

- Use Conventional Commits: `type(scope): subject`, with scope `relay` or `landing`.
- PRs titled `feat`/`fix`/`perf`/`revert` carry `Spec: <epic>/<story> @ <spec sha>` or `Spec-Exempt: <reason>`. The Relay's story is `board-projection/authorize-linear-via-remote-approval`.
- `main` is trunk. Multi-step work ships as stacked PRs via `gh stack`.

## Decided — do not reopen without the user

- Rate limiting: `SESSION_LIMITER` binding (5/60s per IP) plus one zone WAF rule (3/10s per IP on `/api/session`). KV write failure returns 503.
- No CORS: the only API client is the Mac.
- Security headers: strict CSP, `no-referrer`, `nosniff`, HSTS without `includeSubDomains`, `no-store` on HTML routes.
- `/callback` 303s to `/done?result=…`; a replayed callback writes nothing and shows "already handled"; an expired or unknown session gets a 404 page.
- KV binding `SESSIONS`, one environment, custom domain `app.yellowhammer.dev`.
- `client_id` allowlisted per provider (Linear: Yellowhammer's public app id); `code_challenge` must be 43 base64url chars.

- Distributed abuse exhausting the 1,000 KV writes/day across many IPs is an **accepted risk**. Per-IP limits only, and no storage change.

## Still open — raise them, do not invent them

- Environments beyond production, landing domain, licence.
