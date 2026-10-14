import type { ImageMetadata } from "astro";
import pulse from "../assets/pulse-001.png";

/**
 * One entry per tab of the screenshot showcase. To add a screenshot, add the image file to
 * src/assets/ and one entry here. `crop` names a class in global.css ("Crops of ..."); a new image
 * shown whole can reuse a crop class written for its own window bounds.
 */
export interface Shot {
	/** Unique, used for the radio id. */
	id: string;
	/** Tab label: what the crop actually shows. */
	label: string;
	image: ImageMetadata;
	alt: string;
	/** Crop class from global.css. */
	crop: string;
	/** Rendered image width divided by the frame width, for `sizes`. */
	scale: number;
	caption: string;
}

export const shots: Shot[] = [
	{
		id: "pulse",
		label: "Pulse",
		image: pulse,
		alt: "The Yellowhammer window showing the Pulse for one Project, idle between Nights. A sidebar lists the Project and its repository, the middle column shows five tiles and their cards, and an inspector on the right shows the repository's Work Cards.",
		crop: "crop-pulse",
		scale: 1.095,
		caption:
			"The Pulse, the main window's status view, for one Project—one product: its repos, its Linear project and its specification—between Nights.",
	},
	{
		id: "tiles",
		label: "Tiles",
		image: pulse,
		alt: "Close-up of the Pulse: the tiles Needs you, Now, Feature, Night and Health, above the Needs you card, which reads Nothing needs you, and the Now card, which shows no work running.",
		crop: "crop-tiles",
		scale: 2,
		caption:
			"Five tiles first: Needs you, Now, Feature, Night and Health. Then a card for each.",
	},
	{
		id: "feature",
		label: "Feature · Night",
		image: pulse,
		alt: "Close-up of the Pulse: the Feature card with its one repository and pull request, the Tonight / last Night card marked done, and the Health card with no health flags.",
		crop: "crop-feature",
		scale: 2,
		caption:
			"The Feature in flight and its repositories, last Night's state, and the health flags.",
	},
	{
		id: "lane",
		label: "Work Cards",
		image: pulse,
		alt: "Close-up of the inspector for one repository: 3 of 3 cards done, its pull request, and the three Work Cards, each marked Done.",
		crop: "crop-lane",
		scale: 2.871,
		caption:
			"The inspector for one repository: its Work Cards and its pull request.",
	},
];
