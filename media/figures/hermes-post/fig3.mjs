// Fig 3 — "One Feature, three repos". Hermes: one board per repo, one worktree per card, and
// boards cannot be linked. Yellowhammer: one Feature card on the Linear board feeds a tray per
// repo, each ending in one sealed envelope (a pull request), with a Night Card pinned on the board.

import { buildFigure } from "./layout.mjs";
import { text } from "./lib.mjs";
import {
	board,
	chevrons,
	envelope,
	indexCard,
	plate,
	rail,
	tray,
} from "./parts.mjs";

export const id = "fig-3-repos";
export const file = "fig-3-repos.svg";
export const alt =
	"Two lanes. Hermes Agent: three separate boards, here split by repository, each with one card that works in one repo in one worktree; a gap between the boards is marked as unable to link. Yellowhammer: one Feature card and a Night Card on the Linear board; the Feature feeds three repository trays, web, server and mobile, and each ends in one sealed envelope, a pull request.";
export const caption =
	"A Hermes card works in one repo, and its boards can't link; Yellowhammer turns one Feature into one pull request per repo and reports the Night on the board.";

const PLATE_W = 530;
const CY = 42;

export function build() {
	const plates = [0, 190, 380];
	const repos = ["web", "server", "mobile"];
	const hermes = {
		name: "Hermes Agent",
		tagline: "One repo per card",
		geom: {
			plateW: PLATE_W,
			plateD: 84,
			cy: CY,
			cols: plates.map((x) => x + 75),
			tall: [100, 100, 100],
		},
		draw(S) {
			for (const x0 of plates) plate(S, 150, 84, x0);
			for (const x0 of plates) {
				board(S, { cx: x0 + 75, cy: 26, cards: [null, { band: "fig-n1" }] });
				tray(S, {
					cx: x0 + 75,
					cy: 64,
					w: 54,
					d: 30,
					contents: (T, b) =>
						indexCard(T, {
							x: b.x + 14,
							y: b.y + 4,
							z: b.z,
							w: 22,
							h: 16,
							band: "fig-n1",
							lines: 1,
						}),
				});
			}
		},
		labels: repos.map((r, i) => [i, `${r} board`, "one card, one worktree"]),
		overlay(S) {
			let svg = "";
			for (const gx of [170, 360]) {
				const [sx, sy] = S.at([gx, 30, 60]);
				svg +=
					text("boards", sx, sy - 14, {
						size: 26,
						cls: "fig-muted",
						anchor: "middle",
					}) +
					text("can't link", sx, sy + 16, {
						size: 26,
						cls: "fig-muted",
						anchor: "middle",
					});
			}
			return svg;
		},
	};
	const cols = [70, 215, 345, 475];
	const yh = {
		name: "Yellowhammer",
		tagline: "One Feature, one pull request per repo",
		geom: {
			plateW: PLATE_W,
			plateD: 84,
			cy: CY,
			cols,
			tall: [84, 40, 40, 40],
		},
		draw(S) {
			plate(S, PLATE_W, 84);
			rail(S, 140, 505, CY, "fig-n1");
			chevrons(S, [160, 280, 410], CY, "fig-y3");
			board(S, {
				cx: cols[0],
				cy: CY,
				cards: [{ band: "fig-y3" }, null, { band: "fig-o2" }],
			});
			for (const cx of cols.slice(1)) {
				tray(S, {
					cx,
					cy: CY,
					contents: (T, b) =>
						envelope(T, { x: b.x + (b.w - 34) / 2, y: b.y + 2, z: b.z }),
				});
			}
		},
		labels: [
			[0, "Linear board", "Feature, Night Card"],
			...repos.map((r, i) => [i + 1, r, "one pull request"]),
		],
	};
	return buildFigure({
		id,
		fig: 3,
		title: "One Feature, three repos",
		caption: "FIG 3 · ONE REPO PER CARD VS ONE FEATURE, ONE PR PER REPO",
		alt,
		lanes: [hermes, yh],
	});
}
