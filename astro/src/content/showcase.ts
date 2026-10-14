import type { ImageMetadata } from "astro";
import pulse from "../assets/pulse-001.png";

/**
 * One tab of the screenshot showcase. Adding a screenshot is one image file in src/assets plus one
 * entry here; the tab CSS keys off sibling order and needs no change.
 */
export interface ShowcaseTab {
	/** Unique, URL-safe. Used for the radio id. */
	id: string;
	/** Tab label: name it after what the crop actually shows. */
	label: string;
	image: ImageMetadata;
	alt: string;
	/** A crop class from global.css (crop-none shows the whole image). */
	crop:
		| "crop-none"
		| "crop-pulse"
		| "crop-tiles"
		| "crop-feature-night"
		| "crop-repo-lane";
	/** `sizes` for the responsive image; zoomed crops ask for a wider source. */
	sizes: string;
	caption: string;
}

const FULL = "(min-width: 78rem) 76rem, calc(100vw - 2rem)";
const ZOOMED = "(min-width: 78rem) 152rem, calc(200vw - 4rem)";

const pulseAlt =
	"The Pulse for the Project Yellowhammer, idle with one Repo. Tiles read Needs you 0, Now idle, Feature 3/3, Night done, Health OK. The inspector shows the Repo Lane for yellowhammer: 3 of 3 Cards done and pull request #471.";

export const showcase: ShowcaseTab[] = [
	{
		id: "pulse",
		label: "Pulse",
		image: pulse,
		alt: pulseAlt,
		crop: "crop-pulse",
		sizes: FULL,
		caption:
			"The Pulse, the main window's status view, for one Project. This one is idle.",
	},
	{
		id: "tiles",
		label: "Tiles",
		image: pulse,
		alt: "The Pulse tiles: Needs you 0, nothing needs you. Now idle, next Act unknown. Feature 3/3. Night done, started 23:37. Health OK, no flags.",
		crop: "crop-tiles",
		sizes: ZOOMED,
		caption:
			"Five tiles answer the morning question: Needs you, Now, Feature, Night and Health.",
	},
	{
		id: "feature-night",
		label: "Feature and Night",
		image: pulse,
		alt: "The Feature card for YLH-347 with one repository at 3/3 and pull request #471, the Tonight / last Night card marked done with 3 Done and a link to show the Night's account, and the Health card with no health flags.",
		crop: "crop-feature-night",
		sizes: ZOOMED,
		caption:
			"The Feature in flight with its repository, and the last Night with a link to its account.",
	},
	{
		id: "repo-lane",
		label: "Repo Lane",
		image: pulse,
		alt: "The inspector for the repo yellowhammer: its Repo Lane shows Cards 3 of 3 done, pull request #471, and Work Cards YLH-348, YLH-349 and YLH-350, each marked Done.",
		crop: "crop-repo-lane",
		sizes: ZOOMED,
		caption:
			"The inspector shows one Repo Lane: its Work Cards in order, and the one pull request they produced.",
	},
];
