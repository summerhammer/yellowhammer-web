// Two-lane figure layout shared by Fig 1, 2 and 3: a header row per lane (name left, tagline
// right), the lane's plate and stations in the shared isometric projection, then a label under
// each station. Both lanes use the same scale so parts keep one size across a figure.

import {
	AZIMUTH,
	ELEVATION,
	frameCard,
	k,
	path,
	Scene,
	svgDocument,
	TOP,
	text,
} from "./lib.mjs";

export const W = 1200;
const LANE_W = 1080;
const HEADER = 60;
const LABEL_NAME = 30;
const LABEL_SUB = 26;

/** Projection for one lane, with the lane's screen box top-left at (left, top). */
function laneProjection(left, top, geom) {
	const { plateW, plateD, cols, tall, cy } = geom;
	const pts = [
		[0, 0, 0],
		[plateW, 0, 0],
		[0, plateD, 0],
		[plateW, plateD, 0],
	];
	cols.forEach((cx, i) => {
		pts.push([cx - 40, cy, TOP + tall[i]], [cx + 40, cy, TOP + tall[i]]);
	});
	// Fit on a fixed reference box so every lane (and every figure) gets the same scale.
	const ref = [
		[0, 0, 0],
		[plateW, 0, 0],
		[0, plateD, 0],
		[plateW, plateD, 0],
	];
	const fit = k.fitProjection(ref, LANE_W, 2000, {
		pad: 0,
		azimuth: AZIMUTH,
		elevation: ELEVATION,
	});
	const flat = pts.map((p) => k.iso(p, fit));
	const minX = Math.min(...flat.map((p) => p[0]));
	const minY = Math.min(...flat.map((p) => p[1]));
	const maxY = Math.max(...flat.map((p) => p[1]));
	return {
		P: {
			...fit,
			origin: [fit.origin[0] - minX + left, fit.origin[1] - minY + top],
		},
		height: maxY - minY,
	};
}

function labelSvg(S, geom, [col, name, sub, dx = 0]) {
	const [sx, sy] = S.at([geom.cols[col], geom.plateD, 0]);
	return (
		text(name, sx + dx, sy + 44, { size: LABEL_NAME, anchor: "middle" }) +
		(sub
			? text(sub, sx + dx, sy + 76, {
					size: LABEL_SUB,
					cls: "fig-muted",
					anchor: "middle",
				})
			: "")
	);
}

function laneSvg(spec, top) {
	const left = (W - LANE_W) / 2;
	const { P, height } = laneProjection(left, top + HEADER, spec.geom);
	const S = new Scene(P);
	spec.draw(S);
	let svg = text(spec.name, left + 8, top + 40, { size: 34, weight: 600 });
	svg += text(spec.tagline, left + LANE_W - 8, top + 40, {
		size: 30,
		cls: "fig-muted",
		anchor: "end",
	});
	svg += S.render();
	for (const l of spec.labels) svg += labelSvg(S, spec.geom, l);
	if (spec.overlay) svg += spec.overlay(S);
	return { svg, bottom: top + HEADER + height + 84 };
}

/** Build a complete figure SVG from `lanes` (two lane specs). */
export function buildFigure({ id, fig, title, caption, alt, lanes }) {
	let y = 100;
	let body = "";
	lanes.forEach((spec, i) => {
		const lane = laneSvg(spec, y);
		body += lane.svg;
		y = lane.bottom + 24;
		if (i < lanes.length - 1) {
			body += path("fig-frame", `M96 ${lane.bottom + 8}H${W - 96}`);
		}
	});
	const height = Math.round(y + 64);
	return svgDocument({
		id,
		width: W,
		height,
		title,
		desc: alt,
		body: frameCard({ width: W, height, fig, title, caption, body }),
	});
}
