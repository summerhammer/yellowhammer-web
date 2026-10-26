# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Part of the Yellowhammer multi-repo product (siblings of the main checkout). It hosts two Cloudflare apps:

- **Relay** (`relay/`): Cloudflare Workers + Static Assets + Workers KV, built with Hono (TypeScript + JSX, server-rendered) + Tailwind. It is the "Code Relay" for issue-tracker auth, and only Linear is supported. Served at `app.yellowhammer.dev`.
- **Landing** (`astro/`): the marketing site, built with Astro + Tailwind and deployed to Cloudflare Pages. It contains no auth logic. Served at `yellowhammer.dev`.

Stay on the Cloudflare **Free Tier**. KV allows 1,000 writes/day, so be careful with anything that writes per request.

## Spec is authoritative

The authoritative product spec is the `yellowhammer-spec` repo, a sibling of this repo's
**main checkout** — not of the directory you are in. From an Orca ADE Worktree (or any
`git worktree`), `..` is the Worktree's parent, so `../yellowhammer-spec` does not
resolve there. Resolve it the way `.mcp.json` does, honoring `$SPEC_DIR` when it is set:

```sh
SPEC_DIR="${SPEC_DIR:-$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/../yellowhammer-spec}"
```

Paths written `$SPEC_DIR/...` in this file are in that checkout. Read `$SPEC_DIR/skill.md`
before working on spec'd behavior — it explains how to find, read, and correctly apply
it. Prefer the `spec` MCP server (`spec_search`, `spec_read`, `spec_grep`, `spec_list`,
`spec_glossary`): it already resolves the spec this way, from a Worktree too.

**Never search the filesystem for the spec** — no `find ~`, no `find /`, no walking
`~/orca` or any other directory outside the Worktree. Under a Night, the worker runs
with `yh` as its responsible process, so a touch of a macOS-protected folder (Music,
Photos, Desktop, Documents, Downloads) is charged to Yellowhammer.app and blocks on a
privacy prompt nobody answers; the pass times out and the Attempt is spent (issue #482).
If `$SPEC_DIR` does not resolve, stop: leave the `Spec:` trailer out rather than guess a
sha, and say the spec could not be resolved in your summary or reply. When it does
resolve — it does from an Orca ADE Worktree — write the trailer as usual. A worker never
needs the spec itself to do its Card: what the Card needs from the spec is in its
Architectural Brief and its Definition of Done's citations.

**Do not copy spec content into this repo.** Anything pasted here stops tracking the
spec the moment it lands, and nothing detects the drift. Read it from the spec repo at
commit HEAD; never edit the spec from here.

- ADR status matters. An `accepted` ADR is binding. **`proposed` is not binding**, so flag it before building on one.
  - Relay design: ADR-006, `$SPEC_DIR/docs/tech/decisions/006-remote-admin-approval-code-relay.md`. It is accepted: probes L9 and L10 passed, and L8 and L11 were ruled non-blocking.
  - Protocol detail: `$SPEC_DIR/docs/tech/investigations/2026-09-27-linear-remote-auth-relay.md`.
  - Linear auth basis: ADR-005. It is accepted: a shared public OAuth app, PKCE, `actor=app`, and no client secret.
- Use glossary terms verbatim (`$SPEC_DIR/docs/glossary.md`), e.g. "Code Relay".
- Brand (`$SPEC_DIR/docs/brand/*`: colours, typography, personality and tone of voice) is a **draft**. Follow it as direction, not a contract. Don't invent colours, fonts or tone beyond it.

## Artwork

- Logos, favicons, app icons and app screenshots live in the sibling repo `../yellowhammer-artwork`. Figma is their source of truth and that repo holds the exports. Don't redraw, re-export or hand-edit them here.
  - `logos/`: `yellowhammer-mark.svg`, `yellowhammer-mark-monochrome.svg`, `yellowhammer-mark-monochrome-white.svg`.
  - `icons/favicon/`: `favicon.svg`, `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`.
  - `icons/app-icon/` and `icons/app-icon-dark/`: the macOS app icon, light and dark, as SVG and PNG sizes.
  - `screenshots/`: app screenshots, e.g. `pulse-001.png`.
- Copy what a page needs, unchanged, into `astro/public/` (Landing) or `relay/public/` (Relay). If an asset is missing, ask for it. New artwork is made in the artwork repo, not here.

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
- Landing domain: the apex `yellowhammer.dev`, a custom domain on the Pages project `yellowhammer-landing`. `www.yellowhammer.dev` 301s to the apex, keeping path and query, through one zone Redirect Rule (dashboard-only, not in this repo).
- `client_id` allowlisted per provider (Linear: Yellowhammer's public app id); `code_challenge` must be 43 base64url chars.
- Landing install link: `https://github.com/summerhammer/yellowhammer/releases/latest/download/Yellowhammer.dmg`, an unversioned asset name. The app's release pipeline is being changed to publish it. Until then it 404s, which is expected. Don't link a versioned DMG or the releases page instead. The secondary link is the app repo, `https://github.com/summerhammer/yellowhammer` (MIT, open source). The app requires macOS 26.
- PR previews: Landing only. Every same-repo PR gets a Pages preview deployment at `pr-<number>.yellowhammer-landing.pages.dev` (`.github/workflows/preview.yml`). The relay has no preview: one would share the production `SESSIONS` KV and its daily write quota.

- Social accounts: the handle is `yellowhammerapp` on X, Bluesky, YouTube, Instagram and TikTok (registered 2026-10-26). The governing home is `$SPEC_DIR/docs/brand/channels.md`. Landing links to none of them: Messaging allows only the download and GitHub CTAs.

- Distributed abuse exhausting the 1,000 KV writes/day across many IPs is an **accepted risk**. Per-IP limits only, and no storage change.

## Still open — raise them, do not invent them

- Relay environments beyond production, licence.
