# Yellowhammer documentation authoring guide

This folder contains internal templates and is excluded from Mintlify publication and indexing by `docs/.mintignore`.

## Choose a template

- **Overview** — orient readers, show a recommended path, link to child pages with native Mintlify cards, and connect the topic to related concepts.
- **Tutorial** — teach a complete outcome in sequence. State prerequisites, stages, checkpoints, expected result, and the next task.
- **Task** — help a reader complete one focused job. Use Goal, Before you begin, Steps, Confirm it worked, Common problems, and Next steps.
- **Concept** — explain a model with a definition, relationships, a grounded example, implications, and related tasks.
- **Reference** — provide a stable lookup page with scope, entries, verified examples, and related pages.
- **Troubleshooting** — organize by symptom. For each, explain checks, a verified remedy, confirmation, and further diagnostics.

## Canonical homes and navigation

The public sidebar is defined in `docs.json`; keep it to six groups with section/page depth. Put each page in its canonical directory: `start/`, `setup/`, `run/`, `review/`, `concepts/`, or `reference/`. The root `index.mdx` is the Start here introduction; `/quickstart` is Your first Night. Overview pages double as section landing pages and should link to their pages with native CardGroup/Card components.

The 30 current public pages are listed in `docs.json`. `_authoring/` is intentionally not part of that count.

## Shared requirements for every public page

Use title and one-sentence description frontmatter. Place snippet imports immediately after frontmatter. Open the rendered content with a one-sentence purpose statement, then render `DocumentationOutline`. Its notice identifies unfinished content briefs. Do not present unverified UI labels, procedures, defaults, command syntax, compatibility, or results as fact. Use a footer with a recommended next task and related concept or reference, using native links or cards.

Link key terms when they first appear to their canonical page, normally `/reference/statuses-and-glossary#term`. Keep terminology aligned with the sibling spec's `docs/glossary.md`; do not invent alternate names. Check product behavior against current app stories and release details before upgrading a content brief into instructions.

Use **Acme Checkout** as the illustrative product when an example helps. Make clear which details are illustrative and verify all expected behavior before publishing them as steps.

## Visual placeholders

Import `VisualPlaceholder` from `/snippets/documentation.jsx`. Every planned screenshot, workflow, or relationship diagram must be a semantic figure with visible accessible text and a stable, unique `id`:

```mdx
<VisualPlaceholder
  id="setup-project-relationship"
  type="relationship diagram"
  title="What belongs to one Project"
  purpose="Show the product, its repositories, Linear project, and specification as one Project."
  caption="Planned visual: one Project connects these four inputs before a Night begins."
/>
```

Use a unique ID per visual across the site. Replace `replace-me-` template IDs before publishing. `purpose` describes what readers should learn; `caption` describes the intended visual contents. Do not leave an empty box or use an unlabelled image. The shared styling lives in `style.css` and supports light and dark themes.

## Current content status

All pages in the initial public structure are **outlines/content briefs**, not complete instructions. Overview paths and product explanations describe the intended learning architecture. Connection steps, settings, exact control names, command examples, defaults, status displays, and diagnostic remedies remain to be verified against the current app. Replace the notice only when a page's specific content has been checked. Do not infer behavior from this guide.
