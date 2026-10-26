import type { ImageMetadata } from "astro";
import githubPrClausesDark from "../assets/screenshots/github-pr-clauses-dark.png";
import githubPrClausesLight from "../assets/screenshots/github-pr-clauses-light.png";
import linearCycleDark from "../assets/screenshots/linear-cycle-dark.png";
import linearCycleLight from "../assets/screenshots/linear-cycle-light.png";
import linearNightCardDark from "../assets/screenshots/linear-night-card-dark.png";
import linearNightCardLight from "../assets/screenshots/linear-night-card-light.png";
import nightAccountDark from "../assets/screenshots/night-account-dark.png";
import nightAccountLight from "../assets/screenshots/night-account-light.png";
import pulseAttemptsDark from "../assets/screenshots/pulse-attempts-dark.png";
import pulseAttemptsLight from "../assets/screenshots/pulse-attempts-light.png";
import pulseNightDoneDark from "../assets/screenshots/pulse-night-done-dark.png";
import pulseNightDoneLight from "../assets/screenshots/pulse-night-done-light.png";

/**
 * Screenshots. Every entry renders as a placeholder until `image` is set, so a real screenshot drops
 * in by editing this file only: add the light and dark files to src/assets/ and import them here.
 * Placeholders show what to capture; `captureSteps` below is the how-to for each source.
 * Sources: the app, Linear and GitHub as they look on a finished Night.
 */
export type ShotSource = "app" | "linear" | "github";

export interface ShotSpec {
	/** "S1".."S6". */
	id: string;
	/** What the shot is. */
	title: string;
	/** Alt text for the real image. */
	alt: string;
	/** Picks the capture instructions and the aspect ratio. */
	source: ShotSource;
	/** What to set up before capturing. */
	state: string;
	/** Base filename, rendered as `${saveAs}-light.png` / `${saveAs}-dark.png`. */
	saveAs: string;
	/** An existing light screenshot in yellowhammer-artwork/screenshots/. */
	lightCandidate?: string;
	/** Set when the real files exist. */
	image?: { light: ImageMetadata; dark: ImageMetadata };
}

export const shots: ShotSpec[] = [
	{
		id: "S1",
		title: "Pulse, the morning after",
		source: "app",
		state:
			"A Project whose Feature just verified: the header reads “Night done” with the mesh gradient, nothing needs you, the inspector closed or on the Feature.",
		saveAs: "pulse-night-done",
		lightCandidate: "Pasted 2026-10-26 at 7.35.57 PM.png",
		alt: "The Yellowhammer window the morning after a Night: the header reads Night done, Feature ORB-212 verified, all 18 clauses met. Nothing needs you, and the Feature has one pull request open in each of its three repositories.",
		image: { light: pulseNightDoneLight, dark: pulseNightDoneDark },
	},
	{
		id: "S2",
		title: "The Night's account",
		source: "app",
		state:
			"Open a finished Night from Show the Night's account. Put the playhead inside the Land phase, with a few problems visible in the timeline.",
		saveAs: "night-account",
		lightCandidate: "Pasted 2026-10-15 at 9.30.05 AM.png",
		alt: "The Night's account in the app: the Author, Build and Land phases of one Night on a timeline from 22:00 to 06:00, with the playhead on the Night's one problem, a failed Attempt whose Route was then excluded.",
		image: { light: nightAccountLight, dark: nightAccountDark },
	},
	{
		id: "S3",
		title: "Work Cards in Linear",
		source: "linear",
		state:
			"In Linear, the project view listing the Work Cards Yellowhammer wrote for one Feature, with one Work Card open so its Definition of Done and spec citations show.",
		saveAs: "linear-cycle",
		alt: "A Feature Card in Linear: its status line, then the Work Cards Yellowhammer wrote for the Feature, each marked Done.",
		image: { light: linearCycleLight, dark: linearCycleDark },
	},
	{
		id: "S4",
		title: "Agents at work",
		source: "app",
		state:
			"During a build: several Attempts running across repos in the Now card, the inspector on one Attempt showing its Route and Round.",
		saveAs: "pulse-attempts",
		lightCandidate: "Pasted 2026-10-14 at 10.23.52 PM.png",
		alt: "The Pulse during a Night: three Attempts running in three repositories, on Claude Code, Codex and Antigravity Routes, and the inspector showing one Attempt's Route and Round.",
		image: { light: pulseAttemptsLight, dark: pulseAttemptsDark },
	},
	{
		id: "S5",
		title: "A pull request with its clause report",
		source: "github",
		state:
			"On GitHub, a pull request Yellowhammer opened, scrolled to the Definition of Done report: each clause, its spec citation and its verdict.",
		saveAs: "github-pr-clauses",
		alt: "A GitHub pull request opened by Yellowhammer, showing its Verification section: each Definition of Done clause with its spec citation, its verdict and the evidence behind it.",
		image: { light: githubPrClausesLight, dark: githubPrClausesDark },
	},
	{
		id: "S6",
		title: "The Night Card",
		source: "linear",
		state:
			"In Linear, the Night Card for a finished Night, showing its Night Summary: what landed, what is Blocked and what is Waiting on You.",
		saveAs: "linear-night-card",
		alt: "The Night Card in Linear: the Night's verdict, the Feature it selected and each Work Card with its Attempt, Route and Check.",
		image: { light: linearNightCardLight, dark: linearNightCardDark },
	},
];

type Theme = "Light" | "Dark";

/** The theme-specific step is spelled out per theme, so each placeholder shows its own. */
const both = (
	build: (theme: Theme) => string[],
): { light: string[]; dark: string[] } => ({
	light: build("Light"),
	dark: build("Dark"),
});

export const captureSteps: Record<
	ShotSource,
	{ light: string[]; dark: string[] }
> = {
	app: both((theme) => [
		"Size the window like the 2026-10-26 screenshot (about 1570 × 1140 points).",
		`Set the appearance: System Settings → Appearance → ${theme}.`,
		"Press ⌘⇧4, then Space, then click the Yellowhammer window. This keeps the window shadow at 2×.",
	]),
	linear: both((theme) => [
		`Set the theme: Linear → Settings → Preferences → Interface theme → ${theme}.`,
		"Make the window about 1600 × 1000 points.",
		"Press ⌘⇧4, then Space, then click the window.",
	]),
	github: both((theme) => [
		`Set the theme: GitHub → Settings → Appearance → ${theme} default.`,
		"Make the browser window about 1600 × 1000 points, with the pull request's conversation in view.",
		"Press ⌘⇧4, then Space, then click the window.",
	]),
};

/** Looks a shot up by id; an unknown id fails the build rather than rendering nothing. */
export function getShot(id: string): ShotSpec {
	const shot = shots.find((candidate) => candidate.id === id);
	if (!shot) throw new Error(`Unknown shot id: ${id}`);
	return shot;
}
