// Cover — "Who decides what runs tonight". One base plate, two halves. Left (neutral, Hermes): a
// pinboard with one handwritten note, a decomposer, one tray of cards. Right (Yellowhammer): a
// spec book, a selector, a board with Work Cards, three trays with one sealed envelope each, and a
// lit window with a moon. Light palette only; it carries no colour classes' stylesheet, so every
// element's fallback attribute does the colouring (the SVG renders standalone, in an <img>).

import { frameCard, k, Scene, svgDocument, TOP } from "./lib.mjs";
import {
	board,
	chevrons,
	envelope,
	indexCard,
	machine,
	nightWall,
	plate,
	specBook,
	tray,
} from "./parts.mjs";

export const alt =
	"Two workshops at night: one turns a written note into tasks, the other reads a specification and leaves one pull request per repository.";

const W = 1200;
const H = 630;
const PLATE = { w: 440, d: 220 };

export function build() {
	const pts = [
		[0, 0, 0],
		[PLATE.w, 0, 0],
		[0, PLATE.d, 0],
		[PLATE.w, PLATE.d, 0],
		[PLATE.w, 0, TOP + 95],
		[110, 0, TOP + 95],
		[62, 180, TOP + 90],
	];
	const P = k.fitProjection(pts, W, H, {
		pad: 30,
		headroom: 56,
		azimuth: 45,
		elevation: 30,
	});
	const S = new Scene(P);
	plate(S, PLATE.w, PLATE.d);
	nightWall(S, { x0: 110, x1: PLATE.w });

	// Hermes, front left.
	const hy = 180;
	board(S, { cx: 62, cy: hy, cards: [null, { band: "fig-n1", hand: true }] });
	machine(S, { cx: 176, cy: hy, kind: "decomposer", tip: "fig-n1" });
	tray(S, {
		cx: 300,
		cy: hy,
		contents: (T, b) =>
			[0, 1, 2]
				.map((i) =>
					indexCard(T, {
						x: b.x + 6 + i * 16,
						y: b.y + 9,
						z: b.z,
						w: 14,
						h: 18,
						band: "fig-n1",
						lines: 1,
					}),
				)
				.join(""),
	});
	chevrons(S, [118, 240], hy, "fig-n1");

	// Yellowhammer, back right.
	const yy = 48;
	specBook(S, { cx: 150, cy: yy, cover: "y" });
	machine(S, { cx: 250, cy: yy, kind: "selector", tip: "fig-y3", lamp: true });
	board(S, {
		cx: 366,
		cy: yy,
		cards: [{ band: "fig-y3" }, { band: "fig-y3" }, { band: "fig-y3" }],
	});
	for (const cx of [275, 345, 415]) {
		tray(S, {
			cx,
			cy: 94,
			w: 54,
			contents: (T, b) =>
				envelope(T, { x: b.x + (b.w - 34) / 2, y: b.y + 2, z: b.z }),
		});
	}

	const body = frameCard({
		width: W,
		height: H,
		fig: 0,
		title: "Two ways to run a night",
		caption: "",
		size: 28,
		body: S.render(),
	});
	return svgDocument({
		id: "cover",
		width: W,
		height: H,
		title: "Who decides what runs tonight",
		desc: alt,
		body,
	});
}
