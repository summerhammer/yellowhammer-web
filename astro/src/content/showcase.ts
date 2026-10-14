import type { ImageMetadata } from "astro";
import pulse001 from "../assets/pulse-001.png";

/**
 * One tab of the screenshot showcase.
 *
 * To add a screenshot: put the image in src/assets/, import it here and add an entry.
 * - `id` must be unique; it becomes the radio input's id.
 * - `panelClass` shows the panel when its tab is checked. Copy an existing entry's value and
 *   replace the id in it with the new id. It must be a literal string (not built from `id`), so
 *   Tailwind's scanner finds it. Don't write an example of it in a comment: Tailwind would
 *   compile the example too.
 * - `cropClass` is one of the `.crop-*` classes in src/styles/global.css (`crop-full` shows the
 *   whole image).
 */
export interface Shot {
	id: string;
	label: string;
	description: string;
	image: ImageMetadata;
	alt: string;
	cropClass: string;
	/** How far the crop zooms in (the scale in its crop class), so the right image size loads. Default 1. */
	zoom?: number;
	panelClass: string;
	caption: string;
}

export const shots: Shot[] = [
	{
		id: "shot-pulse",
		label: "Pulse",
		description: "One Project at a glance, read-only.",
		image: pulse001,
		alt: "The Yellowhammer app window. A sidebar lists one Project. The main area, the Pulse, shows the Project as idle with one Repo, a row of five tiles (Needs you, Now, Feature, Night, Health), and a card for each tile below. An inspector on the right shows one Repo Lane with three Work Cards marked Done and its pull request.",
		cropClass: "crop-full",
		panelClass: "[.showcase:has(#shot-pulse:checked)_&]:block",
		caption: "The Pulse for one Project, idle between Nights.",
	},
	{
		id: "shot-tiles",
		label: "Needs you and Now",
		description: "The tile row, what waits on you, and what runs.",
		image: pulse001,
		alt: "Close-up of the Pulse: five tiles reading Needs you 0, Now idle, Feature 3/3, Night done and Health OK; below them the Needs you card says nothing needs you, and the Now card shows the status idle and no Attempt running.",
		cropClass: "crop-tiles",
		zoom: 2.05,
		panelClass: "[.showcase:has(#shot-tiles:checked)_&]:block",
		caption:
			"Needs you comes first. It is the Waiting on You count and the top reasons a Work Card is Blocked.",
	},
	{
		id: "shot-feature-night",
		label: "Feature and Night",
		description: "The Feature in flight, last Night, and Health.",
		image: pulse001,
		alt: "Close-up of the Pulse: the Feature card with one Repo Lane at 3/3 and its pull request chip, the Tonight / last Night card showing done with 3 Done and a link to show the Night's account, and the Health card with no health flags.",
		cropClass: "crop-feature-night",
		zoom: 2.05,
		panelClass: "[.showcase:has(#shot-feature-night:checked)_&]:block",
		caption:
			"The one Feature in flight, with a pull request chip per Repo Lane. Tonight / last Night opens that Night's Night Card.",
	},
	{
		id: "shot-inspector",
		label: "Repo Lane",
		description: "The inspector: Work Cards and their pull request.",
		image: pulse001,
		alt: "Close-up of the inspector: the repository yellowhammer, idle, with its Repo Lane showing 3 of 3 cards done, pull request #471, and its Work Cards marked Done.",
		cropClass: "crop-inspector",
		zoom: 3.6,
		panelClass: "[.showcase:has(#shot-inspector:checked)_&]:block",
		caption:
			"One Repo Lane: its Work Cards in order, and the one pull request they land in.",
	},
];
