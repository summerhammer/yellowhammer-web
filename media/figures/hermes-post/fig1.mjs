// Fig 1 — "Where the work comes from". Two lanes: Hermes Agent turns a one-liner someone wrote
// into task cards on its own board; Yellowhammer reads the spec, picks one Feature and writes Work
// Cards onto the Linear board, starting from an empty board.

import { buildFigure } from "./layout.mjs";
import {
	board,
	cardHolder,
	chevrons,
	machine,
	plate,
	specBook,
} from "./parts.mjs";

export const id = "fig-1-source";
export const file = "fig-1-source.svg";
export const alt =
	"Two lanes. Hermes Agent: someone writes a one-line request, a decomposer fans it out into task cards on Hermes's own board. Yellowhammer: starting from an empty board, a selector reads the specification, picks one Feature and writes Work Cards onto the Linear board.";
export const caption =
	"Hermes decomposes a request someone wrote; Yellowhammer starts from your specification, even with an empty board.";

const PLATE_W = 520;
const CY = 42;

export function build() {
	const hermes = {
		name: "Hermes Agent",
		tagline: "Someone writes the request",
		geom: {
			plateW: PLATE_W,
			plateD: 84,
			cy: CY,
			cols: [120, 290, 456],
			tall: [46, 74, 84],
		},
		draw(S) {
			plate(S, PLATE_W, 84);
			chevrons(S, [205, 372], CY, "fig-n1");
			cardHolder(S, { cx: 120, cy: CY, hand: true });
			machine(S, { cx: 290, cy: CY, kind: "decomposer", tip: "fig-n1" });
			board(S, {
				cx: 456,
				cy: CY,
				cards: [{ band: "fig-n1" }, { band: "fig-n1" }, { band: "fig-n1" }],
			});
		},
		labels: [
			[0, "One-line request", "written by someone"],
			[1, "Decomposer", "splits it into tasks"],
			[2, "Hermes board", "task cards"],
		],
	};
	const yh = {
		name: "Yellowhammer",
		tagline: "It reads your spec",
		geom: {
			plateW: PLATE_W,
			plateD: 84,
			cy: CY,
			cols: [62, 190, 318, 456],
			tall: [84, 36, 94, 84],
		},
		draw(S) {
			plate(S, PLATE_W, 84);
			chevrons(S, [130, 256], CY, "fig-y3");
			board(S, { cx: 62, cy: CY, ghost: true });
			specBook(S, { cx: 190, cy: CY, cover: "y" });
			machine(S, {
				cx: 318,
				cy: CY,
				kind: "selector",
				tip: "fig-y3",
				lamp: true,
			});
			board(S, {
				cx: 456,
				cy: CY,
				cards: [{ band: "fig-y3" }, { band: "fig-y3" }, { band: "fig-y3" }],
			});
		},
		labels: [
			[0, "Empty board", "Night starts here"],
			[1, "Specification", "read each Night"],
			[2, "Selector", "picks one Feature"],
			[3, "Linear board", "Work Cards"],
		],
	};
	return buildFigure({
		id,
		fig: 1,
		title: "Where the work comes from",
		caption: "FIG 1 · THE ONE-LINER VS THE SPECIFICATION",
		alt,
		lanes: [hermes, yh],
	});
}
