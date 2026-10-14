# landing

The marketing Landing site for Yellowhammer. Astro + Tailwind, static output, deployed to Cloudflare Pages (Direct Upload) by the Deploy workflow on merge to `main`, with a preview deployment for every PR (see [Previews](#previews)). It contains no auth logic.

The shipped single-page landing site presents the product narrative specified in `yellowhammer-spec` (`docs/brand/messaging.md`):
- **Hero**: Tagline ("Wake up to pull requests."), supporting value proposition, macOS 26 requirement, the trust line ("Your code, credentials and models stay on your Mac."), and the primary download CTA alongside the GitHub repository link.
- **Showcase**: An authentic preview of the Yellowhammer night run UI (Pulse view) showing overnight work cards and morning pull requests.
- **Never Band ("What it never does")**: Three non-negotiable boundaries—no code written by itself, no auto-merge to main, and no cloud execution.
- **Tools**: Prerequisites and integrations (Orca ADE worktrees, Linear board, GitHub pull requests, and agent CLIs like Claude Code and Codex).
- **How It Works**: The four acts of an overnight Shift (select, build, land, verdict).
- **Footer**: Appearance theme selector (System, Light, Dark), navigation links, and MIT licence notice.

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

## Release check and download verification

The primary CTA points to the unversioned asset URL:
`https://github.com/summerhammer/yellowhammer/releases/latest/download/Yellowhammer.dmg`

Per `yellowhammer-spec` (`docs/brand/messaging.md`), this URL serves as the launch gate: the landing page could not launch or become indexable until the release pipeline published this unversioned asset and it resolved to a usable DMG.

The asset was verified prior to lifting the production indexing gate:
- **Resolution**: The unversioned URL resolves via HTTP 302 to GitHub release asset storage, returning HTTP 200 with `Content-Disposition: attachment; filename=Yellowhammer.dmg` (~16 MB).
- **Disk image integrity**: Verified with `file` and `hdiutil imageinfo` as a valid UDIF zlib-compressed disk image (`UDZO`) formatted with a GUID partition table and an Apple APFS filesystem.
- **Payload verification**: Mounted read-only and confirmed to contain `Yellowhammer.app` and the `/Applications` symlink, passing CRC32 checksum verification and detaching cleanly.

## Previews

The Preview workflow (`.github/workflows/preview.yml`) builds every PR from this repository and
deploys it with `--branch=pr-<number>`. Any branch other than the production branch `main` is a
Pages preview deployment, so production is untouched. The PR gets a GitHub Deployment linking to
the preview, and the stable alias `https://pr-<number>.yellowhammer-landing.pages.dev` always
serves the PR's latest push.
PRs from forks are skipped because they get no secrets.

Cloudflare Pages automatically serves all preview deployments with `X-Robots-Tag: noindex`, ensuring preview deployments remain unindexed.

On production (`main`), the placeholder `<meta name="robots" content="noindex">` directive in `src/layouts/Layout.astro` was removed upon verifying the release DMG, making the production landing page indexable while preview deployments retain their `X-Robots-Tag: noindex` protection.
