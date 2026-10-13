# landing

The marketing Landing site for Yellowhammer. Astro + Tailwind, static output, deployed to Cloudflare Pages (Direct Upload) by the Deploy workflow on merge to `main`. It contains no auth logic. Currently a placeholder page.

## Development

```sh
pnpm --filter landing dev
pnpm --filter landing build
pnpm --filter landing preview
pnpm --filter landing check
```

## CSP

`astro.config.mjs` sets `build.inlineStylesheets: "never"` so CSS is emitted as an external file. `public/_headers` sets a strict CSP (`style-src 'self'`, no scripts), and inline `<style>` tags would be blocked by it. Keep pages free of inline styles and scripts.

## One-time setup

Create the Pages project once (this is not done by CI):

```sh
pnpm --filter landing exec wrangler pages project create yellowhammer-landing --production-branch main
```

The `CLOUDFLARE_API_TOKEN` repository secret needs the "Cloudflare Pages: Edit" permission.

The custom domain is undecided, so the site is served at `*.pages.dev` until then. While it is a
placeholder, `src/layouts/Layout.astro` sets `<meta name="robots" content="noindex">` on every page;
remove it at launch.
