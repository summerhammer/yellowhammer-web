# landing

The marketing Landing site for Yellowhammer. Astro + Tailwind, static output, deployed to Cloudflare Pages (Direct Upload) by the Deploy workflow on merge to `main`, with a preview deployment for every PR (see [Previews](#previews)). It contains no auth logic. Currently a placeholder page.

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

## Domain

Served at `https://yellowhammer.dev`, a custom domain on the `yellowhammer-landing` Pages project
(`site` in `astro.config.mjs` matches it). `www.yellowhammer.dev` 301s to the apex through a zone
Redirect Rule. Both are configured in the Cloudflare dashboard, not in this repo. The
`yellowhammer-landing.pages.dev` URL stays reachable.

## Previews

The Preview workflow (`.github/workflows/preview.yml`) builds every PR from this repository and
deploys it with `--branch=pr-<number>`. Any branch other than the production branch `main` is a
Pages preview deployment, so production is untouched. The PR gets a GitHub Deployment linking to
the preview, and the stable alias `https://pr-<number>.yellowhammer-landing.pages.dev` always
serves the PR's latest push.
PRs from forks are skipped because they get no secrets. Pages serves preview deployments with
`X-Robots-Tag: noindex`.

While the site is a placeholder, `src/layouts/Layout.astro` sets
`<meta name="robots" content="noindex">` on every page; remove it at launch.
