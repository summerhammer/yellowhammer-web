// Fig 2 — "A failed try". Hermes retries in place on the same profile and, if the card re-blocks,
// sends it to triage. Yellowhammer sends the Work Card to a route it has not tried, and after the
// limit you set it stops in Blocked or Waiting on You with the reason written down.

import { buildFigure } from "./layout.mjs";
import {
	attemptRack,
	cardHolder,
	chevrons,
	indexCard,
	plate,
	routeStation,
	tray,
} from "./parts.mjs";

export const id = "fig-2-retry";
export const file = "fig-2-retry.svg";
export const alt =
	"Two lanes. Hermes Agent: a task card goes to one profile's station, which retries in place; three attempts are marked on the same station, and a card that re-blocks goes to a Triage tray. Yellowhammer: a Work Card goes to Route A, which fails and is tagged tried; the card then goes to Route B, which has not been tried; after the limit you set, a card that still cannot be finished lands in a Blocked or Waiting on You tray with a reason slip.";
export const caption =
	"Hermes retries in place on the same profile; Yellowhammer moves a failed Work Card to a route it has not tried, then stops.";

const PLATE_W = 520;
const CY = 42;
const COLS = [62, 190, 318, 456];
const GAPS = [126, 254, 387];
const TALL = [46, 56, 40, 40];

export function build() {
	const hermes = {
		name: "Hermes Agent",
		tagline: "Retries in place",
		geom: { plateW: PLATE_W, plateD: 84, cy: CY, cols: COLS, tall: TALL },
		draw(S) {
			plate(S, PLATE_W, 84);
			chevrons(S, GAPS, CY, "fig-n1");
			cardHolder(S, { cx: COLS[0], cy: CY, hand: true });
			routeStation(S, { cx: COLS[1], cy: CY, tally: 3 });
			attemptRack(S, { cx: COLS[2], cy: CY });
			tray(S, {
				cx: COLS[3],
				cy: CY,
				contents: (T, b) =>
					indexCard(T, {
						x: b.x + 14,
						y: b.y + 8,
						z: b.z,
						w: 30,
						h: 24,
						band: "fig-n1",
						lines: 2,
					}),
			});
		},
		labels: [
			[0, "Task card", "to one profile"],
			[1, "Same profile", "retries in place"],
			[2, "Attempts 1, 2, 3", "same station"],
			[3, "Triage", "re-blocked card"],
		],
	};
	const yh = {
		name: "Yellowhammer",
		tagline: "New route, up to your limit",
		geom: { plateW: PLATE_W, plateD: 84, cy: CY, cols: COLS, tall: TALL },
		draw(S) {
			plate(S, PLATE_W, 84);
			chevrons(S, GAPS, CY, "fig-y3");
			cardHolder(S, { cx: COLS[0], cy: CY, band: "fig-y3", hand: false });
			routeStation(S, { cx: COLS[1], cy: CY, tried: true });
			routeStation(S, { cx: COLS[2], cy: CY, lit: true });
			tray(S, {
				cx: COLS[3],
				cy: CY,
				contents: (T, b) =>
					indexCard(T, {
						x: b.x + 6,
						y: b.y + 14,
						z: b.z,
						w: 24,
						h: 20,
						band: "fig-y3",
						lines: 1,
					}) +
					indexCard(T, {
						x: b.x + 30,
						y: b.y + 6,
						z: b.z,
						w: 18,
						h: 16,
						hand: true,
						lines: 2,
					}),
			});
		},
		labels: [
			[0, "Work Card", "one piece, one repo"],
			[1, "Route A · tried", "CLI · model · effort"],
			[2, "Route B", "not yet tried"],
			[3, "Blocked", "or Waiting on You"],
		],
	};
	return buildFigure({
		id,
		fig: 2,
		title: "A failed try",
		caption: "FIG 2 · SAME ROUTE AGAIN VS A ROUTE NOT YET TRIED",
		alt,
		lanes: [hermes, yh],
	});
}
