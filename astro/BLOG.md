# Writing for the Yellowhammer blog

The blog lives at https://yellowhammer.dev/blog and ships with the landing page on Cloudflare Pages. Posts are local Markdown (`.md`) or MDX (`.mdx`) files in `src/content/blog`. Copy `example-post.mdx` to start a post.

```yaml
---
title: A concrete title
description: A short summary used in listings, search, and social previews.
author: Yellowhammer
pubDate: 2026-11-10
draft: true
tags: [Engineering]
# updatedDate: 2026-11-11
# cover:
#   src: /blog/my-post/cover.png
#   alt: A meaningful description of the cover
---
```

`title`, `description`, and `pubDate` are required. The author defaults to Yellowhammer, tags to an empty list, and `draft` to true. Dates are interpreted in UTC; a date without a time becomes midnight UTC. Use a full ISO timestamp with a timezone when timing matters.

## Preview and publish

Run `pnpm --filter landing dev`, then visit `/blog`. Drafts and future-dated posts are excluded everywhere, including development and PR previews. To preview a draft article, temporarily set `draft: false` and use a past/current publication date on your local or preview branch. Restore the draft flag before merging if it should remain unpublished. PR preview deployments are public; do not use them for confidential content.

To publish, set `draft: false`, choose a publication date no later than the build time, and merge the PR. Existing GitHub Actions builds the site and deploys `astro/dist` to the `yellowhammer-landing` Pages project. No additional Cloudflare configuration, DNS record, secret, server, or database is required.

Future dates do not trigger deployment. A future-dated post first appears on the next build after its publication time. There is no scheduled publishing workflow. To unpublish a post, set `draft: true` and merge.

Filenames determine URLs: `my-post.md` becomes `/blog/my-post`. Keep lowercase, hyphenated filenames stable after publication; renaming a file changes its public URL. Posts are listed newest first. Tags are metadata, with no separate archive pages.

## Images, formatting, and MDX

Put images under `astro/public/blog/my-post/` and reference them as `/blog/my-post/image.png`, with useful alt text. Cover paths must be local, begin with `/`, and include an alt description. Without a cover, social previews use Yellowhammer's existing branded image. Images stored in `public` retain their original dimensions and file size; resize and compress them before committing.

Use Markdown headings starting at level two (the article title supplies the first heading), lists, blockquotes, tables, and fenced code. Code blocks use plain styling to comply with the site's strict Content Security Policy. MDX supports static expressions and imported components, but keep blog content static: no inline styles, scripts, event handlers, remote images, embeds, or components requiring browser JavaScript. The publishing verification checks generated HTML for inline scripts/styles and event attributes.

The RSS feed is `/blog/rss.xml`; the sitemap is `/sitemap.xml`. Both share the same publication filter as article pages and always use production URLs. The sitemap covers Astro pages; Mintlify manages documentation separately.

## Verify

Run `pnpm --filter landing check`, `pnpm --filter landing build`, and `pnpm --filter landing test:blog`. The last command builds isolated temporary fixtures and checks publishing rules, Markdown/MDX, metadata, feed, sitemap, and CSP without adding public test posts. CI runs these checks with the existing lint and relay tests.
