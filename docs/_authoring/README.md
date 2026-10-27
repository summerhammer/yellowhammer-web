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

Use title and one-sentence description frontmatter. Place snippet imports immediately after frontmatter. Open the rendered content with a purpose statement. Completed pages must not render `DocumentationOutline`; that component is reserved for the unused starter templates. Do not present unverified UI labels, procedures, defaults, command syntax, compatibility, or results as fact. Use a footer with a recommended next task and related concept or reference, using native links or cards.

Link key terms when they first appear to their canonical page, normally `/reference/statuses-and-glossary#term`. Keep terminology aligned with the sibling spec's `docs/glossary.md`; do not invent alternate names. Verify product behavior against the current local app views, Engine commands, configuration, and relevant tests. The specification describes intended behavior; an unchecked requirement is not evidence of an implemented capability.

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

Follow every screenshot placeholder with visible **Screenshot instructions:** describing what the capture should show, how to navigate to that screen, and how to prepare the necessary selection, sample data, or run state. Use non-sensitive example names and hide credentials. If the required state is not implemented, mark the capture TBD. Creating screenshots and diagrams is a separate task; preserve existing diagram and workflow placeholders during a textual content pass.

## Current content status

The public pages describe the current local Yellowhammer implementation as checked on 2026-10-27. They are end-user guides, not a copy of the product specification or a promise about a particular distributed release. The visual placeholders remain intentional.

For an unimplemented section, retain its heading and write **TBD — not yet implemented.** Omit speculative procedures. For a detail whose implementation cannot be verified, write **TBD — behavior requires verification.** These are different conditions: do not call a feature unimplemented merely because its behavior has not been checked. Keep TBD notices local to the affected section so verified instructions remain useful.

When the app changes, recheck the affected procedure and its screenshot instructions together. Review concepts and quickstart text for assumptions that may have changed across features, such as scheduling or the number of Features advanced during a Night. Do not infer behavior from this guide.
