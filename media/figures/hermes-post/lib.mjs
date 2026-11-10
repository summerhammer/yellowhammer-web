// Shared drawing layer for the Hermes post figures.
//
// It wraps the project's isometric kit (media/kit/iso) and emits CSP-safe SVG: every colour is a
// class (`fig-*`, defined once in astro/src/styles/blog.css), and every element also carries a
// presentation-attribute fallback colour taken from PALETTE below (the light values), so the SVG
// still reads if the stylesheet is missing. No <style>, no style="", no var().

import * as k from "../../kit/iso/iso-kit.mjs";

export { k };

export const AZIMUTH = 76;
export const ELEVATION = 30;
/** Height of a lane's plate top above the floor of the world. */
export const TOP = 13;

// ---------------------------------------------------------------------------------------------
// Palette. [light, dark]. Site tokens are referenced by name in blog.css; the derived tones are
// literal pairs. Four tones per material: 1 darkest side, 2 mid side, 3 light side, 4 top.
// ---------------------------------------------------------------------------------------------
export const PALETTE = {
	// fills
	"fig-canvas": { fill: ["#fdfaf0", "#1c1c1e"], token: "--color-bg" },
	"fig-paper": { fill: ["#ffffff", "#5a5a3c"] },
	"fig-n1": { fill: ["#cbc5ae", "#202016"] },
	"fig-n2": { fill: ["#dbd6c1", "#2b2b1a"], token: "--color-surface" },
	"fig-n3": { fill: ["#e8e4d2", "#37371f"] },
	"fig-n4": { fill: ["#f6f2e4", "#42422a"] },
	"fig-y1": { fill: ["#c9ae0b", "#8a780a"] },
	"fig-y2": { fill: ["#e3c812", "#b39d0e"] },
	"fig-y3": { fill: ["#f6d916", "#d6bd14"], token: "--color-brand" },
	"fig-y4": { fill: ["#fbe85e", "#f2d92e"] },
	"fig-o1": { fill: ["#6c6d1d", "#55561a"] },
	"fig-o2": { fill: ["#8e8f26", "#74751f"], token: "--color-wing" },
	"fig-o3": { fill: ["#a9aa45", "#8e8f26"] },
	"fig-o4": { fill: ["#c7c87b", "#a3a43f"] },
	// text fills
	"fig-ink": { fill: ["#1f1d14", "#f3efdf"], token: "--color-ink" },
	"fig-muted": { fill: ["#5c5847", "#bdb8a2"], token: "--color-ink-muted" },
	// strokes (fill none)
	// Alpha is baked into the colour (8-digit hex), so light and dark can differ.
	"fig-edge": { stroke: ["#1f1d14c7", "#f3efdf70"], width: 2 },
	"fig-crease": { stroke: ["#5c584780", "#bdb8a240"], width: 1.4 },
	"fig-rule": { stroke: ["#5c5847a6", "#bdb8a25c"], width: 1.6 },
	"fig-line": {
		stroke: ["#8e8f26", "#8e8f26"],
		width: 2,
		token: "--color-wing",
	},
	"fig-guide": {
		stroke: ["#5c5847", "#bdb8a2"],
		width: 1.8,
		dash: "6 5",
		token: "--color-ink-muted",
	},
	"fig-frame": {
		stroke: ["#1f1d1438", "#f3efdf3d"],
		width: 2,
		token: "--color-line-strong",
	},
};

const FALLBACK_FONT = {
	"fig-sans": "-apple-system, system-ui, sans-serif",
	"fig-mono": "ui-monospace, Menlo, monospace",
};

/** Every class name the drawing layer can emit; build.mjs checks them against blog.css. */
export const CLASSES = [...Object.keys(PALETTE), ...Object.keys(FALLBACK_FONT)];

/** Presentation-attribute fallback for a class list (light values). */
function fallbackOf(classes) {
	let out = "";
	for (const name of classes.split(" ")) {
		const p = PALETTE[name];
		if (!p) continue;
		if (p.fill) out += ` fill="${p.fill[0]}"`;
		if (p.stroke) {
			out += ` fill="none" stroke="${p.stroke[0]}" stroke-width="${p.width}"`;
			if (p.alpha) out += ` stroke-opacity="${p.alpha}"`;
			if (p.dash) out += ` stroke-dasharray="${p.dash}"`;
		}
	}
	return out;
}

const esc = (s) =>
	String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const path = (cls, d) =>
	d ? `<path class="${cls}"${fallbackOf(cls)} d="${d}"/>` : "";

const r1 = (v) => Math.round(v * 10) / 10;

export function circle(cls, [x, y], r) {
	return `<circle class="${cls}"${fallbackOf(cls)} cx="${r1(x)}" cy="${r1(y)}" r="${r}"/>`;
}

/** Flat text in screen space. `font` is "sans" or "mono". */
export function text(
	str,
	x,
	y,
	{
		size = 26,
		cls = "fig-ink",
		font = "sans",
		anchor = "start",
		weight,
		spacing,
	} = {},
) {
	const c = `${cls} fig-${font}`;
	const fam = FALLBACK_FONT[`fig-${font}`];
	return `<text class="${c}"${fallbackOf(cls)} font-family="${fam}" x="${r1(x)}" y="${r1(y)}" font-size="${size}" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ""}${spacing ? ` letter-spacing="${spacing}"` : ""}>${esc(str)}</text>`;
}

// ---------------------------------------------------------------------------------------------
// Solids
// ---------------------------------------------------------------------------------------------

/** shade bucket 0..3 (darkest..lightest side) -> class, per material. */
const MATERIALS = {
	n: {
		fill: "fig-n2",
		shade: ["fig-n1", "fig-n2", "fig-n3", "fig-n3"],
		top: "fig-n4",
	},
	y: {
		fill: "fig-y2",
		shade: ["fig-y1", "fig-y2", "fig-y3", "fig-y3"],
		top: "fig-y4",
	},
	o: {
		fill: "fig-o2",
		shade: ["fig-o1", "fig-o2", "fig-o3", "fig-o3"],
		top: "fig-o4",
	},
	// Paper: the front face is the whitest thing in the drawing.
	p: {
		fill: "fig-paper",
		shade: ["fig-n2", "fig-n3", "fig-n3", "fig-paper"],
		top: "fig-paper",
	},
	// A dark slot or recess.
	d: {
		fill: "fig-n1",
		shade: ["fig-n1", "fig-n1", "fig-n1", "fig-n1"],
		top: "fig-n1",
	},
};

/** Draw a kit solid (the result of slabOf/cylinder/extrude) in material `mat`. */
export function solid(
	paths,
	mat = "n",
	{ flat = false, edge = "fig-edge" } = {},
) {
	const M = MATERIALS[mat];
	let out = path(M.fill, paths.fill);
	if (!flat) {
		paths.shades.forEach((d, i) => {
			out += path(M.shade[i], d);
		});
		out += path(M.top, paths.top);
		out += path("fig-crease", paths.crease);
		out += path("fig-crease", paths.bevel);
	}
	out += path(edge, paths.outline);
	return out;
}

/**
 * The drawing context for one lane: a projection plus a depth-sorted list of items. Anything
 * added with `add(centre, svg)` is painted back to front by the depth of `centre` (world x, y, z).
 */
export class Scene {
	constructor(P) {
		this.P = P;
		this.items = [];
	}
	/** Screen point of a world point. */
	at(p) {
		return k.iso(p, this.P);
	}
	add(centre, svg) {
		this.items.push({ depth: k.depthOf(centre, this.P), svg });
	}
	/** Painted before everything else (the plate). */
	addFirst(svg) {
		this.items.push({ depth: -1e9, svg });
	}
	slab(plan, z, h, mat = "n", opts = {}) {
		const { steps = 6, bevel = 0, ...rest } = opts;
		return solid(k.slabOf(plan, z, h, this.P, steps, bevel), mat, rest);
	}
	cyl(cx, cy, r, z, h, mat = "n", opts = {}) {
		return solid(k.cylinder(cx, cy, r, z, h, this.P, 24), mat, opts);
	}
	/** A flat polygon in world space, given as 3D points. */
	poly(cls, pts) {
		return path(
			cls,
			k.pathOf(
				pts.map((p) => this.at(p)),
				true,
			),
		);
	}
	line(cls, pts) {
		return path(cls, k.pathOf(pts.map((p) => this.at(p))));
	}
	dot(p, r = 1.5) {
		return circle("fig-ink", this.at(p), r);
	}
	render() {
		return this.items
			.sort((a, b) => a.depth - b.depth)
			.map((i) => i.svg)
			.join("");
	}
}

// A rectangle on a vertical face. `front(y)` places (x, z) on the plane y; `side(x)` places (y, z)
// on the plane x. Both return world points.
export const front = (y) => (x, z) => [x, y, z];
export const side = (x) => (y, z) => [x, y, z];

/** Four corners of a rectangle on a face plane, as world points. */
export function rectOn(plane, a0, b0, a1, b1) {
	return [plane(a0, b0), plane(a1, b0), plane(a1, b1), plane(a0, b1)];
}

/** A scrawled pen line on a front face: a wobble across [x0, x1] at height z. */
export function scrawl(plane, x0, x1, z, amp = 1.1, wave = 3.2) {
	const pts = [];
	const n = Math.max(6, Math.round((x1 - x0) / 1.6));
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const x = x0 + (x1 - x0) * t;
		pts.push(
			plane(
				x,
				z + Math.sin(t * Math.PI * wave) * amp * (0.6 + 0.4 * Math.sin(t * 5)),
			),
		);
	}
	return pts;
}

/** Circle on a front face, as world points. */
export function discOn(plane, cx, cz, r, steps = 24) {
	return Array.from({ length: steps }, (_, i) => {
		const a = (i / steps) * Math.PI * 2;
		return plane(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
	});
}

// ---------------------------------------------------------------------------------------------
// The frame card: "Fig N" top left, a mono label top right, a mono caption along the bottom.
// ---------------------------------------------------------------------------------------------
export function frameCard({
	width,
	height,
	fig,
	title,
	caption,
	body,
	size = 28,
}) {
	const pad = 32;
	return (
		path("fig-canvas", `M0 0H${width}V${height}H0Z`) +
		path(
			"fig-frame",
			`M${pad / 2} ${pad / 2}H${width - pad / 2}V${height - pad / 2}H${pad / 2}Z`,
		) +
		text(`Fig ${fig}`, pad + 8, pad + 40, {
			size: size + 2,
			font: "mono",
			weight: 600,
		}) +
		text(title.toUpperCase(), width - pad - 8, pad + 40, {
			size,
			font: "mono",
			cls: "fig-muted",
			anchor: "end",
			spacing: 1,
		}) +
		body +
		(caption
			? text(caption, pad + 8, height - pad - 14, {
					size,
					font: "mono",
					cls: "fig-muted",
					spacing: 1,
				})
			: "")
	);
}

/** Wrap a figure body in the root <svg>. `id` seeds the title/desc ids. */
export function svgDocument({ id, width, height, title, desc, body }) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc>${body}</svg>\n`;
}
