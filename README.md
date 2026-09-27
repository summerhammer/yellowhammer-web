# yellowhammer-web

Web surface of [Yellowhammer](https://yellowhammer.dev). Two Cloudflare apps in one pnpm workspace:

- **`relay/`** — Code Relay (Cloudflare Workers + Assets + KV, Hono). Relays short-lived OAuth authorization codes from issue trackers (currently Linear) to the Yellowhammer Mac app. Holds no tokens or user data. Served at `app.yellowhammer.dev`.
- **`astro/`** — Marketing landing page (Astro, Cloudflare Pages).

Specification lives in [`yellowhammer-spec`](../yellowhammer-spec).

## Development

```sh
pnpm install
pnpm --filter relay dev   # wrangler dev
pnpm test
```

Deploys run from GitHub Actions on merge to `main`.
