# Landing screenshots: automated capture scenarios

How to produce the six landing screenshots (`src/content/shots.ts`, S1–S6) by automation instead of
by hand, in both appearances, at sizes chosen for where the landing shows them.

**Short answer: yes for the app (S1, S2, S4), not for Linear and GitHub (S3, S5, S6).** The app
already renders from data it only reads, so a UI test can show any state it is given. Linear and
GitHub are third-party pages: a browser script can capture them, but the content has to exist
there first.

## Why the app shots can be automated

The app's UI tests already do this for one state:

- `YellowhammerUITests/PulseJournalUITests.swift` launches the app with
  `-YellowhammerConfigurationDirectory <dir>`. `<dir>` holds `config.toml`, `projects/*.toml` and
  `journals/<project>.db`, and the app reads only that directory. `-ApplePersistenceIgnoreState YES`
  stops window restoration.
- The Journal is a SQLite fixture written by a Swift Testing "writer" in the package
  (`Packages/YellowhammerKit/Tests/PulseTests/PulseUITestJournalTests.swift`, gated on
  `YH_WRITE_UI_TEST_JOURNAL=1`). It uses the real `JournalStore` API, so a fixture always matches the
  current schema.
- `-YellowhammerEngineStub <script>` replaces `yh`, so no Act ever really runs.
- Everything the screenshots show is derived from the Journal. The Pulse header comes from
  `PulseCondition`: "Night done" plus the Night's verdict line, or "Working" plus "N Attempts
  running". The Night's account places its playhead on the Night's first problem.

Two limits shape the design:

1. **The UI test runner is sandboxed.** It cannot run `screencapture`, and it cannot build a
   Journal (the comment in `PulseUITestJournalTests.swift` says so). Capture therefore uses
   `XCUIElement.screenshot()`, and fixtures are written before the test run by `swift test`.
2. **Some strings are relative to the wall clock**, such as an Attempt's "6m" and the Now status. A
   held Act Lease also lasts only ten minutes from its seeded time. Fixtures are therefore written
   **just before** the run, with their times anchored to "now", not committed.

## Pipeline

```
scripts/landing-screenshots.sh            (new, app repo)
 1. xcodebuild build-for-testing           -scheme Yellowhammer
 2. YH_WRITE_SHOWCASE=<dir> YH_SHOWCASE_NOW=$(date +%s) \
    swift test --package-path Packages/YellowhammerKit --filter writeShowcaseJournals
                                           -> <dir>/config.toml, projects/*.toml, journals/*.db
 3. TEST_RUNNER_YH_SHOWCASE_DIR=<dir> \
    xcodebuild test-without-building -only-testing:YellowhammerUITests/LandingScreenshotUITests
                                           -> one XCTAttachment PNG per scenario, kept always
 4. xcrun xcresulttool export attachments --path <result>.xcresult --output-path out/
 5. Rename the attachments to <saveAs>-<light|dark>.png, then copy them into
    yellowhammer-artwork/screenshots/landing/
```

- **Steps 2 and 3:** the runner only passes the `<dir>` string through to the app as a launch
  argument. The app, which isn't sandboxed, reads the directory. The runner never opens the files,
  so the sandbox doesn't get in the way.
- **New code:**
  - `ShowcaseJournalTests.swift`, the writer, next to `PulseUITestJournalTests.swift`.
  - `LandingScreenshotUITests.swift`, one test per scenario × appearance.
  - The script.
  - Two DEBUG-only launch arguments in the app (below).

### Appearance

Launch with `-AppleInterfaceStyle Dark` for dark, or `-AppleInterfaceStyle Light` for light. The
argument domain overrides the global setting for this process only, so the Mac's own appearance
doesn't matter.

The first run must confirm that the Mesh Mist and the sidebar material actually switch. If they
don't, add a DEBUG-only `-YellowhammerAppearance light|dark`, read from the argument domain the way
`ConfigurationDirectory` reads its argument, that sets `NSApp.appearance`.

### Window size

The main window has `.defaultSize(width: 1180, height: 760)`, and XCUITest has no resize API. Add a
DEBUG-only `-YellowhammerWindowContentSize <w>x<h>` (points). It sets the main window's content size
and centres the window once, on first appearance.

Dragging the window corner from the test also works, but it is fragile.

### Capture

- **What:** `app.windows.firstMatch.screenshot()` at the screen's scale, so it must run on a
  Retina/HiDPI display to get 2× output. Attach it as `XCTAttachment(screenshot:)` with
  `lifetime = .keepAlways` and `name = "<saveAs>-<appearance>"`.
- **No shadow:** the capture is the window's rectangle, with no shadow, and whatever is behind the
  rounded corners shows through.
- **Landing follow-up:** the landing must frame real images itself, with the window corner radius
  as an `overflow: hidden` radius plus the existing `--shadow-float`, as the old `.shot-frame` did.
  Every shot then gets the same shadow, which hand captures never managed. Update the capture steps
  in `shots.ts` to match when the pipeline lands.
- **Before each capture:**
  - Move the pointer off the window, using `XCUICoordinate` hover on the desktop, so there are no
    hover states.
  - Wait until the target element exists, then wait one more second for the Mist to settle.
  - Assert that `PulseCondition` reached the intended head, so the run fails instead of capturing
    the wrong state.

## The example Project

All scenarios tell **one Night of one example Project**, so the landing reads as a single story
from the Feature it picked to the verdict it left. The names follow `media/diagrams/night`.

- **Project `orbit`**, "Orbit": a fictional product with repos `orbit-api`, `orbit-web` and
  `orbit-ios`, and Linear team key `ORB`.
- **Second Project `harbor`**, "Harbor", repos `harbor-api` and `harbor-app`: no Journal, so it
  only fills the sidebar the way a real install looks.
- **Feature `ORB-212` "Saved searches"**: Work Cards `ORB-213` to `ORB-219`, seven of them across
  the three repos. The Definition of Done has 18 clauses.
- **The Night before the capture day, Night Card `ORB-200`:** written below as 2026-10-21; the
  writer derives the real date from `YH_SHOWCASE_NOW`.
  - author at 22:00.
  - build from 22:16 to 03:12. `ORB-214`'s Attempt 1 ends in a route failure (usage limit); Attempt
    2 on a different Route finishes it.
  - land from 05:30 to 05:42: pull requests `orbit-api` #418, `orbit-web` #233 and `orbit-ios` #97.
- **Routes:** take them from the Routing Table in the fixture's `config.toml`, and use a mix of
  `claude`, `codex` and `agy`. Use only models that the shipped model discovery lists; don't invent
  model names.

Before publishing, add a figcaption to each app shot: "Example Project."

---

## Scenarios

Sizes are **window content size in points**. The output PNG is that size × 2. The size is chosen
from the CSS width the landing gives the slot, so that the app's 13 pt body text lands at 8–11 CSS
px on the page:

| Slot | Landing width (CSS px, at 1440) | Window (pt) | Scale on page | Output (px) |
|---|---|---|---|---|
| Hero (S1) | about 1088 | 1280 × 880 | 0.85 | 2560 × 1760 |
| Full width (S2) | about 1104 | 1280 × 860 | 0.86 | 2560 × 1720 |
| Timeline column (S3–S6) | about 600 | 960 × 680 | 0.62 | 1920 × 1360 |

Every scenario runs twice: once **light** (`-AppleInterfaceStyle Light`) and once **dark**
(`-AppleInterfaceStyle Dark`).

### S1: Pulse, the morning after (`pulse-night-done-{light,dark}.png`)

**Where it shows:** the hero.

**Window:** 1280 × 880 pt. Sidebar shown. Inspector closed (the Pulse alone reads as the verdict).

**Seed (`journals/orbit.db`, anchored to now):**
- The Night of yesterday's date, **done**: it closed at 06:00 local today and its land Act ended
  05:42.
- Feature `ORB-212` verified with all 18 clauses met. Three Repo Lanes, each with its pull request
  open and none merged.
- No Card Blocked or Waiting on You, and no Health flags. No Act Lease held.
- Next Act: author at 22:00 today.

**Steps:**
1. Launch, and wait for `pulse-heading` = "Orbit".
2. Assert the head title is "Night done" and the line contains "18 clauses met".
3. Hover off the window, then capture.

**Must show:**
- The Mesh Mist behind "Night done".
- Needs you: "Nothing needs you".
- Feature card with three lanes and three pull request badges.
- Tonight / last Night: done, "7 Done".
- Health: no flags.

### S2: The Night's account (`night-account-{light,dark}.png`)

**Where it shows:** the full-width visual that opens "How a Night runs".

**Window:** 1280 × 860 pt. Sidebar shown. Inspector shows the Night (it opens with the account).

**Seed:** the same Journal as S1, with the full Act-run history:
- author: one run, 22:00 to 22:04.
- build: one long run from 22:16 to 03:12, plus the short sweeps the build Act really records
  between runs.
- land: 05:30 to 05:42.
- Exactly **one problem**: `ORB-214`'s Attempt 1 route failure at about 01:40.
- Log entries around the failure: step lines, the failure, "Attempt 2 started" on a different
  Route, its Check passing, and the reviewer approving.

**Steps:**
1. Launch, then click `night-account-link`.
2. Wait for `night-account-clock`.
3. Assert `night-account-problem-count` = "1 problem". The playhead sits on the route failure on
   its own.
4. Hover off the window, then capture.

**Must show:**
- The three phase cards (Author, Build, Land).
- The log, with the playhead row highlighted on the failure.
- The lane timeline from 22:00 to 06:00, with the long green build bar and a problem marker.
- The inspector: Night of 2026-10-21, done, Open ORB-200 in Linear.

### S4: Agents at work (`pulse-attempts-{light,dark}.png`)

**Where it shows:** the timeline's **Build** stop.

**Window:** 960 × 680 pt. **Sidebar hidden** (⌃⌘S) so the Pulse and the inspector fill the narrow
slot. Inspector on one Attempt.

**Seed (a separate Journal, `journals/orbit.db` written for this test, anchored to now):**
- The same Night, **running**, partway through the build Act. An **Act Lease held** by a build run
  claimed 2 minutes ago, so the Now status is `working`.
- Three open Attempts, one per repo:
  - `ORB-214` in `orbit-api`, **Attempt 2**, a `claude` Route, Round 1, started 6 minutes ago.
  - `ORB-216` in `orbit-web`, Attempt 1, a `codex` Route, Round 2, started 14 minutes ago.
  - `ORB-218` in `orbit-ios`, Attempt 1, an `agy` Route, Round 1, started 3 minutes ago.
- `ORB-213` Done and `ORB-215` Done. Nothing Waiting on You.

**Steps:**
1. Launch, then hide the sidebar.
2. Assert the head is "Working" with "3 Attempts running".
3. Click `now-attempt-<ORB-214's attempt id>`.
4. Wait for the inspector's Route row.
5. Hover off the window, then capture.

**Must show:**
- The Now card listing three Attempts with Route and Round.
- The inspector with Attempt 2's Route. Together these show "a retry uses a different Route" in
  one frame.

**To verify first:** whether `working` needs only a held Act Lease, or also a live Act job.
`PulseJournalUITests` says its fixture "has no held Act Lease and no Act job alive". If a live job
is required, point `-YellowhammerEngineStub` at a stub that reports the build Act alive, or seed
whatever the Now status actually reads.

### S3, S5, S6: Linear and GitHub (not app UI tests)

These are third-party pages, so a UI test cannot render them, and a seeded fake would show content
Yellowhammer never wrote. **Make them real once, then capture them by script:**

- **Make them real:**
  - Create a public demo Project: repos `orbit-api`, `orbit-web` and `orbit-ios` with a small spec,
    under a demo GitHub org, and a demo Linear team `ORB`.
  - Let Yellowhammer run real Nights on it until one lands a multi-repo Feature.
  - This also gives the landing something real to link to later.
- **Capture by script:**
  - Use headless Chrome over CDP, like the landing's own verification, with a Chrome profile that
    is signed in to both sites.
  - Set Linear's Interface theme and GitHub's Appearance to **follow the system**. Then
    `Emulation.setEmulatedMedia prefers-color-scheme: light|dark` switches them per run.
  - Viewport 960 × 680 CSS px, `deviceScaleFactor: 2`, so the output is 1920 × 1360 px, the same
    scale as S4.

| Shot | URL / state | Framing |
|---|---|---|
| **S3** Work Cards in Linear (`linear-cycle`) | The `ORB` project's issue list filtered to the Feature's Work Cards, with one Work Card open in the side peek so its Definition of Done and spec citations show | Full viewport |
| **S5** Pull request clause report (`github-pr-clauses`) | One of the Feature's pull requests, scrolled so the Definition of Done report (clause, spec citation, verdict) fills the view | Full viewport, or an element screenshot of the PR body at 760 CSS px wide if the conversation chrome crowds it |
| **S6** The Night Card (`linear-night-card`) | The Night Card issue for that Night, showing its Night Summary: what landed, what is Blocked, what is Waiting on You | Full viewport |

Before capturing, hide anything private in the signed-in UI: the workspace switcher, other teams
and notifications.

## Definition of done for the pipeline

- One command (`scripts/landing-screenshots.sh`) produces all three app shots in both appearances
  in about 10 minutes, with no manual step.
- Each test asserts its target state before capturing.
- Running it twice gives the same pictures, except for wall-clock strings.
- The browser script produces S3, S5 and S6 in both appearances from the signed-in profile.
- The 12 PNGs land in `yellowhammer-artwork/screenshots/landing/`. From there they are copied into
  `astro/src/assets/` and wired in through `image` in `shots.ts`.
