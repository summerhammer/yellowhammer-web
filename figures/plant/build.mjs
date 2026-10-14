// Builds the Night Edition figure: a small overnight newspaper plant whose line, wire desk to
// loading dock, is how Yellowhammer runs an unattended Shift. `node build.mjs [--light] [--audit]`.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as A from "../src/iso/audit.mjs";
import * as k from "../src/iso/iso-kit.mjs";
import * as G from "../src/iso/lathe.mjs";
import * as N from "./night.mjs";
import { L, makeParts, RUN_SLOTS, UP_SLOTS } from "./parts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ISO = join(HERE, "..", "src", "iso");
const THEME = process.argv.includes("--light") ? "light" : "dark";
const W = 600;
const H = 332;
const AZIMUTH = 60;

const P = k.fitProjection(
	[
		...k.boxCorners(L.floor, -L.floorH - L.footH, 0),
		[L.wall.x, L.wall.y, L.wallH + 1.5],
		[L.wall.x + L.wall.w, L.wall.y, L.wallH + 1.5],
		[L.lamp.post[0], L.lamp.post[1], L.lamp.z + 1],
		[L.dock.x + L.dock.w, L.dock.y + L.dock.d, L.dockH],
	],
	W,
	H,
	{ pad: 12, azimuth: AZIMUTH },
);
const parts = makeParts(k, G, P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);

// Every drawn item and its true shape go into one recorder; `settle` orders them by measured depth.
// Sheets in flight are carried by the plant, so their shapes count as held (`flying`).
const R = A.recorder(P, {
	ground: (shape) => A.grounded(shape) || Boolean(shape.flying),
});
function put(name, ref, svg, shapes = [], { bias = 0 } = {}) {
	return R.put({
		name,
		at: ref,
		bias,
		svg,
		shapes: shapes.map((shape) => R.solid(shape)),
	});
}
const centreOf = (plan, z, h) => [
	plan.x + plan.w / 2,
	plan.y + plan.d / 2,
	z + h / 2,
];
function box(
	name,
	plan,
	z,
	h,
	style = {},
	{ steps = 4, bevel = 0, inner = "", extra = "", bias = 0, meta = {} } = {},
) {
	put(
		name,
		centreOf(plan, z, h),
		S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "mid", ...style, inner }) +
			extra,
		[A.slab(plan, z, h, { name, ...meta }, steps)],
		{ bias },
	);
}
function cyl(
	name,
	cx,
	cy,
	r,
	z,
	h,
	style = {},
	{ steps = 24, bevel = 0, inner = "", extra = "", bias = 0, meta = {} } = {},
) {
	put(
		name,
		[cx, cy, z + h / 2],
		S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), {
			tone: "mid",
			...style,
			inner,
		}) + extra,
		[A.cylinder(cx, cy, r, z, h, { name, ...meta })],
		{ bias },
	);
}
function disc(
	name,
	F,
	s0,
	s1,
	r,
	style = {},
	{ inner = "", extra = "", bias = 0, meta = {}, ...options } = {},
) {
	const ref = G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2));
	put(
		name,
		ref,
		S(G.disc(s0, s1, r, F, P, options), { tone: "mid", ...style, inner }) +
			extra,
		[A.disc(F, s0, s1, r, { name, ...meta })],
		{ bias },
	);
}
function prism(
	name,
	F,
	poly,
	s0,
	s1,
	style = {},
	{ inner = "", extra = "", bias = 0, meta = {} } = {},
) {
	const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
	const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
	const ref = G.add3(
		G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)),
		G.mul3(F.v, cy),
	);
	put(
		name,
		ref,
		S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra,
		[A.prism(F, poly, s0, s1, { name, ...meta })],
		{ bias },
	);
}
function turned(
	name,
	F,
	profile,
	style = {},
	{ inner = "", extra = "", bias = 0, meta = {}, ...options } = {},
) {
	const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
	put(
		name,
		G.add3(F.o, G.mul3(F.a, mid)),
		S(G.solidOf(profile, F, P, options), { tone: "mid", ...style, inner }) +
			extra,
		[A.solid(F, profile, { name, ...meta })],
		{ bias },
	);
}
const rect = (u0, u1, v0, v1) => [
	[u0, v0],
	[u1, v0],
	[u1, v1],
	[u0, v1],
];
const dot = (x, y, z) => at([x, y, z]);
const screws = (points, size = 0.45) =>
	Dots(
		points.map(([x, y, z]) => dot(x, y, z)),
		{ size },
	);
/** A trough: a floor plate and two side rails along a run, each its own depth-sorted item. */
function trough(
	name,
	from,
	to,
	width,
	{ thick = 1.2, rail = 3, lip = 1.2, owner = name } = {},
) {
	const { F, length } = parts.runFrame(from, to);
	const h = width / 2;
	prism(
		`${name}.rail.far`,
		F,
		rect(-h, -h + lip, 0, rail),
		0,
		length,
		{ tone: "mid" },
		{ meta: { owner } },
	);
	prism(
		`${name}.floor`,
		F,
		rect(-h, h, -thick, 0),
		0,
		length,
		{ tone: "lo" },
		{ meta: { owner } },
	);
	prism(
		`${name}.rail.near`,
		F,
		rect(h - lip, h, 0, rail),
		0,
		length,
		{ tone: "mid" },
		{ meta: { owner } },
	);
	return { F, length };
}
/** The height of a run's underside above the floor at x, for a post under it. */
function underAt(from, to, x, thick = 1.2) {
	const { a, v } = parts.runFrame(from, to);
	const s = (x - from[0]) / a[0];
	return from[2] + a[2] * s - thick * v[2];
}

// ── The floor: a plate on feet, with a groove, corner screws, a ruler strip and a label plate ──
const FLOOR_Z = -L.floorH;
const halo = `<path class="iso-halo" d="${k.haloOf(L.floor, FLOOR_Z - L.footH, L.floorH, P)}"/>`;
const feet = [
	...k.corners(L.floor, 24),
	[L.floor.x + L.floor.w / 2, L.floor.y + 24],
	[L.floor.x + L.floor.w / 2, L.floor.y + L.floor.d - 24],
];
for (const [x, y] of feet) {
	cyl(
		"stand.foot.flange",
		x,
		y,
		6.5,
		FLOOR_Z - L.footH,
		1.4,
		{ tone: "lo" },
		{ steps: 28, meta: { ground: true } },
	);
	cyl(
		"stand.foot",
		x,
		y,
		5,
		FLOOR_Z - L.footH + 1.4,
		L.footH - 1.4,
		{ tone: "mid" },
		{ steps: 28, meta: { ground: true } },
	);
}
{
	const corner = k.corners(L.floor, 9);
	const rings = corner.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join("");
	box(
		"stand.floor",
		L.floor,
		FLOOR_Z,
		L.floorH,
		{ tone: "mid" },
		{
			steps: 8,
			bevel: 1.4,
			extra:
				Ln(k.planOutline(k.insetPlan(L.floor, 5), 0, P), { tone: "faint" }) +
				Ln(rings, { tone: "lo" }) +
				screws(
					corner.map(([x, y]) => [x, y, 0]),
					0.5,
				),
			meta: { ground: true },
		},
	);
	const strip = { x: -138, y: L.floor.y + L.floor.d - 11, w: 262, d: 6, r: 1 };
	const ticks = k.topTicks(
		strip.x + 4,
		strip.x + strip.w - 4,
		4,
		5,
		strip.y + 0.6,
		0.6,
		[1.8, 3.4],
		P,
	);
	box(
		"floor.ruler",
		strip,
		0,
		0.6,
		{ tone: "lo", crease: "none" },
		{
			steps: 3,
			extra: Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }),
		},
	);
	const label = { x: -178, y: L.floor.y + L.floor.d - 12, w: 34, d: 9, r: 1.2 };
	const rules = [0, 1, 2]
		.map((row) =>
			k.lineOnTop(
				[label.x + 3, label.y + 2.4 + row * 2.1],
				[label.x + 3 + [22, 15, 18][row], label.y + 2.4 + row * 2.1],
				0.8,
				P,
			),
		)
		.join("");
	box(
		"floor.label",
		label,
		0,
		0.8,
		{ tone: "lo" },
		{
			steps: 3,
			extra:
				Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), {
					tone: "faint",
				}) +
				Ln(rules, { tone: "lo", free: true }) +
				screws(
					[
						[label.x + 1.8, label.y + label.d / 2, 0.8],
						[label.x + label.w - 1.8, label.y + label.d / 2, 0.8],
					],
					0.4,
				),
		},
	);
}

// ── The back wall: planks, a window, the clock ──
const WALL_FACE = L.wall.y + L.wall.d;
{
	const seams = [];
	for (let x = L.wall.x + 34; x < L.wall.x + L.wall.w - 4; x += 34)
		seams.push(k.segment([x, WALL_FACE, 0], [x, WALL_FACE, L.wallH], P));
	const win = L.window;
	const frame = k.pathOf(
		[
			at([win.x0, WALL_FACE, win.z0]),
			at([win.x1, WALL_FACE, win.z0]),
			at([win.x1, WALL_FACE, win.z1]),
			at([win.x0, WALL_FACE, win.z1]),
		],
		true,
	);
	const mid = (win.x0 + win.x1) / 2;
	const mullions =
		k.segment([mid, WALL_FACE, win.z0], [mid, WALL_FACE, win.z1], P) +
		k.segment(
			[win.x0, WALL_FACE, (win.z0 + win.z1) / 2],
			[win.x1, WALL_FACE, (win.z0 + win.z1) / 2],
			P,
		);
	box(
		"wall",
		L.wall,
		0,
		L.wallH,
		{ tone: "mid" },
		{
			steps: 2,
			inner:
				Ln(seams.join(""), { tone: "faint" }) +
				Ln(frame, { tone: "lo" }) +
				Ln(mullions, { tone: "lo" }),
		},
	);
	box(
		"wall.sill",
		{ x: win.x0 - 1.5, y: WALL_FACE, w: win.x1 - win.x0 + 3, d: 2.4, r: 0.3 },
		win.z0 - 1.6,
		1.6,
		{ tone: "mid" },
		{ steps: 2 },
	);
	box(
		"wall.cap",
		{
			x: L.wall.x - 1,
			y: L.wall.y - 1,
			w: L.wall.w + 2,
			d: L.wall.d + 2,
			r: 0.5,
		},
		L.wallH,
		1.5,
		{ tone: "lo" },
		{ steps: 2 },
	);
	// The clock: a dial on the wall, its hands drawn live in the same plane.
	const C = L.clock;
	const F = G.frameOf([C.x, WALL_FACE, C.z], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
	const face = C.depth + 0.06;
	const ticks = [];
	for (let i = 0; i < 12; i++) {
		const angle = (i / 12) * Math.PI * 2;
		const r0 = i % 3 === 0 ? C.r - 3.2 : C.r - 2.2;
		const r1 = C.r - 1.3;
		ticks.push(
			k.segment(
				[
					C.x + Math.sin(angle) * r0,
					WALL_FACE + face,
					C.z + Math.cos(angle) * r0,
				],
				[
					C.x + Math.sin(angle) * r1,
					WALL_FACE + face,
					C.z + Math.cos(angle) * r1,
				],
				P,
			),
		);
	}
	disc(
		"clock",
		F,
		0,
		C.depth,
		C.r,
		{ tone: "hi", crease: "lo" },
		{
			steps: 64,
			inner: Ln(G.circleOf(F, C.depth, C.r - 1.2, P, 64), { tone: "faint" }),
			extra:
				Ln(ticks.join(""), { tone: "mid" }) +
				`<g data-part="hands"><path class="iso-line pl-hand" data-tone="hi" data-free="end" d="${parts.handsOf(N.START + N.T_END).hour}"/><path class="iso-line pl-hand" data-tone="hi" data-free="end" d="${parts.handsOf(N.START + N.T_END).minute}"/></g>` +
				Dots([at([C.x, WALL_FACE + face, C.z])], { size: 0.6, tone: "hi" }),
		},
	);
}

// ── Station 1: the wire desk, the teleprinter and the spike ──
{
	const D = L.desk;
	const legZ = L.deskTop - L.deskThick;
	for (const [x, y] of k.corners(D, 3))
		box(
			"desk.leg",
			{ x: x - 1.5, y: y - 1.5, w: 3, d: 3, r: 0.4 },
			0,
			legZ,
			{ tone: "mid" },
			{ steps: 2 },
		);
	box(
		"desk.top",
		D,
		legZ,
		L.deskThick,
		{ tone: "mid" },
		{
			steps: 4,
			bevel: 0.6,
			extra: screws(k.corners(D, 2.6).map(([x, y]) => [x, y, L.deskTop])),
		},
	);
	const PR = L.printer;
	const top = L.deskTop + L.printerH;
	const slot = k.pathOf(
		[
			at([PR.x + 3, PR.y + PR.d, L.slotZ - 0.8]),
			at([PR.x + PR.w - 3, PR.y + PR.d, L.slotZ - 0.8]),
			at([PR.x + PR.w - 3, PR.y + PR.d, L.slotZ + 0.8]),
			at([PR.x + 3, PR.y + PR.d, L.slotZ + 0.8]),
		],
		true,
	);
	box(
		"printer",
		PR,
		L.deskTop,
		L.printerH,
		{ tone: "mid" },
		{
			steps: 4,
			bevel: 0.6,
			inner: Ln(k.sideSeam(PR, top - 2.4, P, 4), { tone: "faint" }),
			extra:
				Ln(slot, { tone: "lo" }) +
				screws([
					[PR.x + 2, PR.y + 2, top],
					[PR.x + PR.w - 2, PR.y + 2, top],
				]),
			meta: { owner: "printer" },
		},
	);
	const knob = [PR.x + 4, PR.y + PR.d - 3.2];
	cyl(
		"printer.knob",
		knob[0],
		knob[1],
		1.6,
		top,
		1.6,
		{ tone: "mid" },
		{
			steps: 16,
			extra: Ln(k.knurl(knob[0], knob[1], 1.6, top, top + 1.6, 14, P), {
				tone: "lo",
			}),
			meta: { owner: "printer" },
		},
	);
	const roll = L.roll;
	const RF = G.frameOf(
		[roll.x, roll.y, roll.z],
		[1, 0, 0],
		[0, 0, 1],
		[0, -1, 0],
	);
	for (const side of [-1, 1])
		box(
			"printer.bracket",
			{
				x: roll.x + side * (roll.half + 2.4) - 1.2,
				y: roll.y - 1.2,
				w: 2.4,
				d: 2.4,
				r: 0.3,
			},
			top,
			roll.z - top,
			{ tone: "mid" },
			{ steps: 2, meta: { owner: "printer" } },
		);
	disc(
		"printer.core.l",
		RF,
		-roll.half - 1.2,
		-roll.half,
		1,
		{ tone: "lo" },
		{ meta: { owner: "printer" } },
	);
	disc(
		"printer.roll",
		RF,
		-roll.half,
		roll.half,
		roll.r,
		{ tone: "hi", crease: "lo" },
		{
			inner:
				Ln(G.arcOf(RF, roll.half - 2, roll.r, P), { tone: "faint" }) +
				Ln(G.arcOf(RF, -roll.half + 2, roll.r, P), { tone: "faint" }),
			meta: { owner: "printer" },
		},
	);
	disc(
		"printer.core.r",
		RF,
		roll.half,
		roll.half + 1.2,
		1,
		{ tone: "lo" },
		{ meta: { owner: "printer" } },
	);
	const sp = L.spike;
	cyl(
		"spike.base",
		sp.x,
		sp.y,
		sp.baseR,
		L.deskTop,
		1.2,
		{ tone: "mid" },
		{
			steps: 28,
			extra: Ln(k.ring(sp.x, sp.y, sp.baseR - 1.2, L.deskTop + 1.2, P, 28), {
				tone: "faint",
			}),
		},
	);
	cyl(
		"spike.pin",
		sp.x,
		sp.y,
		sp.pinR,
		L.deskTop + 1.2,
		sp.top - L.deskTop - 1.2,
		{ tone: "hi", crease: "none" },
		{ steps: 12 },
	);
}

// ── The copy trolley on its rail ──
{
	const RL = L.rail;
	box(
		"rail",
		RL,
		0,
		L.railH,
		{ tone: "mid" },
		{
			steps: 3,
			bevel: 0.4,
			extra: screws(
				[
					[RL.x + 5, RL.y + RL.d / 2, L.railH],
					[RL.x + RL.w - 5, RL.y + RL.d / 2, L.railH],
				],
				0.4,
			),
		},
	);
	for (const x of [RL.x - 3, RL.x + RL.w])
		box(
			"rail.stop",
			{ x, y: RL.y - 1.5, w: 3, d: RL.d + 3, r: 0.6 },
			0,
			6,
			{ tone: "mid" },
			{ steps: 2, extra: screws([[x + 1.5, RL.y + RL.d / 2, 6]], 0.4) },
		);
	const T = L.trolley;
	const plan = {
		x: T.from - T.w / 2,
		y: RL.y + RL.d / 2 - T.d / 2,
		w: T.w,
		d: T.d,
		r: 1,
	};
	const top = L.railH + T.h;
	const body =
		S(k.slabOf(plan, L.railH, T.h, P, 3, 0.4), { tone: "mid" }) +
		Dots(
			[-3.5, 0, 3.5].map((dx) => at([T.from + dx, plan.y + plan.d - 1.2, top])),
			{ size: 0.4, tone: "lo" },
		);
	const bush = [plan.x + 1, plan.x + plan.w - 3]
		.map((x) =>
			S(
				k.slabOf(
					{ x, y: plan.y - 0.8, w: 2, d: plan.d + 1.6, r: 0.4 },
					L.railH - 0.6,
					1.2,
					P,
					2,
				),
				{ tone: "lo", crease: "none" },
			),
		)
		.join("");
	const knob =
		S(
			k.cylinder(T.from, plan.y + plan.d + 1.6, 1.3, L.railH + 0.8, 2.2, P, 14),
			{ tone: "mid" },
		) +
		Ln(
			k.knurl(
				T.from,
				plan.y + plan.d + 1.6,
				1.3,
				L.railH + 0.8,
				L.railH + 3,
				10,
				P,
			),
			{ tone: "lo" },
		);
	put(
		"trolley",
		[T.from, RL.y + RL.d / 2, L.railH + T.h / 2],
		`<g data-part="trolley">${bush}${body}${knob}</g>`,
		[A.slab(plan, L.railH, T.h, { name: "trolley" }, 3)],
	);
}

// ── Station 2: the typesetter ──
{
	const TS = L.ts;
	const label = k.faceTextSvg(
		k.sideMatrix([TS.x + TS.w / 2, TS.y + TS.d], L.tsH - 4.2, P, "left"),
		"ORCA",
		{ size: 3.2, tone: "lo", anchor: "middle" },
	);
	box(
		"ts.body",
		TS,
		0,
		L.tsH,
		{ tone: "mid" },
		{
			steps: 5,
			bevel: 0.8,
			inner: Ln(k.sideSeam(TS, 6, P, 5), { tone: "faint" }),
			extra:
				label +
				screws(
					k.corners(TS, 2.8).map(([x, y]) => [x, y, L.tsH]),
					0.5,
				),
		},
	);
	const M = L.magazine;
	const faceY = M.y + M.d;
	const channels = [];
	for (let i = 1; i < 7; i++) {
		const x = M.x + (M.w * i) / 7;
		channels.push(
			k.segment([x, faceY, L.tsH], [x, faceY, L.tsH + L.magazineH], P),
		);
	}
	box(
		"ts.magazine",
		M,
		L.tsH,
		L.magazineH,
		{ tone: "mid" },
		{ steps: 3, bevel: 0.5, inner: Ln(channels.join(""), { tone: "faint" }) },
	);
	box(
		"ts.magazine.cap",
		{ x: M.x - 0.8, y: M.y - 0.8, w: M.w + 1.6, d: M.d + 1.6, r: 1 },
		L.tsH + L.magazineH,
		1.8,
		{ tone: "lo" },
		{
			steps: 3,
			extra: screws([
				[M.x + 3, M.y + M.d / 2, L.tsH + L.magazineH + 1.8],
				[M.x + M.w - 3, M.y + M.d / 2, L.tsH + L.magazineH + 1.8],
			]),
		},
	);
	// The copy clip on the magazine's face: two tabs the sheet stands under.
	const CL = L.clip;
	for (const x of [CL.x + 1, CL.x + CL.w - 3])
		box(
			"ts.clip",
			{ x, y: faceY + L.sheet.h, w: 2, d: 1.6, r: 0.3 },
			CL.z + CL.h - 1.2,
			2.4,
			{ tone: "lo" },
			{ steps: 2 },
		);
	const K = L.keyboard;
	box(
		"ts.keyboard",
		K,
		L.tsH,
		L.keyboardH,
		{ tone: "mid" },
		{
			steps: 3,
			bevel: 0.4,
			extra: Dots(
				k.dotGrid(K.x + 3.2, K.y + 2.6, 7, 3, 3.2, L.tsH + L.keyboardH, P),
				{ size: 0.5, tone: "lo" },
			),
		},
	);
	// The composing bar over the galley, and the head that walks it line by line (moved live).
	const B = L.bar;
	for (const y of [B.y + 0.8, B.y + B.d - 0.8])
		cyl(
			"ts.bar.post",
			B.x + B.w / 2,
			y,
			1,
			L.tsH,
			L.barZ - L.tsH,
			{ tone: "mid", crease: "none" },
			{ steps: 12 },
		);
	box(
		"ts.bar",
		B,
		L.barZ,
		2,
		{ tone: "mid" },
		{
			steps: 2,
			extra: screws(
				[
					[B.x + B.w / 2, B.y + 0.8, L.barZ + 2],
					[B.x + B.w / 2, B.y + B.d - 0.8, L.barZ + 2],
				],
				0.4,
			),
		},
	);
	const HD = L.head;
	const headPlan = {
		x: HD.x - HD.w / 2,
		y: L.lineY0 - HD.d / 2,
		w: HD.w,
		d: HD.d,
		r: 0.5,
	};
	put(
		"ts.head",
		[HD.x, L.lineY0, L.barZ - HD.h / 2],
		`<g data-part="head">${S(k.slabOf(headPlan, L.barZ - HD.h, HD.h, P, 2, 0.3), { tone: "hi", crease: "lo" })}${Dots([at([HD.x, L.lineY0, L.barZ])], { size: 0.4 })}</g>`,
		[
			A.slab(
				headPlan,
				L.barZ - HD.h,
				HD.h,
				{ name: "ts.head", flying: true },
				2,
			),
		],
	);
	// The plate rails from the galley to the press bed, on blocks.
	for (const [i, rail] of L.rails.entries()) {
		const plan = {
			x: L.railsX[0],
			y: rail.y - 1.25,
			w: L.railsX[1] - L.railsX[0],
			d: 2.5,
			r: 0.5,
		};
		for (const x of [L.railsX[0] + 3, L.railsX[1] - 7])
			box(
				`rail${i}.block`,
				{ x, y: rail.y - 2, w: 4, d: 4, r: 0.5 },
				0,
				L.railsZ,
				{ tone: "mid" },
				{ steps: 2 },
			);
		box(
			`rail${i}`,
			plan,
			L.railsZ,
			2,
			{ tone: "mid" },
			{
				steps: 2,
				bevel: 0.3,
				extra: screws(
					[
						[L.railsX[0] + 5, rail.y, L.railsZ + 2],
						[L.railsX[1] - 5, rail.y, L.railsZ + 2],
					],
					0.4,
				),
			},
		);
	}
	// The return hopper behind the typesetter: an open bin the chute drops into.
	const HP = L.hopper;
	const t = 1;
	box(
		"hopper.floor",
		HP,
		0,
		1,
		{ tone: "lo" },
		{ steps: 2, meta: { owner: "hopper" } },
	);
	box(
		"hopper.back",
		{ x: HP.x, y: HP.y, w: HP.w, d: t, r: 0.3 },
		1,
		L.hopperH - 1,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "hopper" } },
	);
	box(
		"hopper.left",
		{ x: HP.x, y: HP.y, w: t, d: HP.d, r: 0.3 },
		1,
		L.hopperH - 1,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "hopper" } },
	);
	put(
		"hopper.slot",
		[HP.x + HP.w / 2, HP.y + HP.d / 2, L.hopperH - 6],
		`<g data-part="slot-hopper"></g>`,
		[
			A.slab(
				{ x: HP.x + 1, y: HP.y + 1, w: HP.w - 2, d: HP.d - 2, r: 0 },
				L.hopperH - 8,
				0.8,
				{ name: "hopper.slot", flying: true },
				2,
			),
		],
	);
	box(
		"hopper.right",
		{ x: HP.x + HP.w - t, y: HP.y, w: t, d: HP.d, r: 0.3 },
		1,
		L.hopperH - 1,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "hopper" } },
	);
	box(
		"hopper.front",
		{ x: HP.x, y: HP.y + HP.d - t, w: HP.w, d: t, r: 0.3 },
		1,
		L.hopperH - 1,
		{ tone: "mid" },
		{
			steps: 2,
			meta: { owner: "hopper" },
			extra: screws(
				[
					[HP.x + 2.5, HP.y + HP.d - 0.5, L.hopperH],
					[HP.x + HP.w - 2.5, HP.y + HP.d - 0.5, L.hopperH],
				],
				0.4,
			),
		},
	);
}

// ── Station 3: the press ──
{
	const PR = L.press;
	box(
		"press.base",
		PR,
		0,
		L.pressH,
		{ tone: "mid" },
		{
			steps: 5,
			bevel: 0.8,
			inner: Ln(k.sideSeam(PR, 4, P, 5), { tone: "faint" }),
			extra:
				Ln(
					k
						.corners(PR, 3.2)
						.map(([x, y]) => k.ring(x, y, 1.4, L.pressH, P, 12))
						.join(""),
					{ tone: "lo" },
				) +
				screws(
					k.corners(PR, 3.2).map(([x, y]) => [x, y, L.pressH]),
					0.5,
				),
			meta: { owner: "press" },
		},
	);
	const BD = L.bed;
	const clamps = [BD.x, BD.x + BD.w - 2.5]
		.map((x) =>
			S(
				k.slabOf(
					{ x, y: BD.y + 2, w: 2.5, d: BD.d - 4, r: 0.4 },
					L.bedZ + L.bedH,
					1.6,
					P,
					2,
				),
				{ tone: "lo", crease: "none" },
			),
		)
		.join("");
	put(
		"press.bed",
		centreOf(BD, L.bedZ, L.bedH),
		`<g data-part="bed">${S(k.slabOf(BD, L.bedZ, L.bedH, P, 3, 0.5), { tone: "hi", crease: "lo" })}${clamps}</g>`,
		[A.slab(BD, L.bedZ, L.bedH, { name: "press.bed", owner: "press" }, 3)],
	);
	for (const [i, U] of L.uprights.entries())
		box(
			`press.upright${i}`,
			U,
			L.pressH,
			L.uprightH,
			{ tone: "mid" },
			{
				steps: 3,
				bevel: 0.5,
				inner: Ln(k.sideSeam(U, L.pressH + L.uprightH - 3, P, 3), {
					tone: "faint",
				}),
				extra: screws(
					[[U.x + U.w / 2, U.y + U.d / 2, L.pressH + L.uprightH]],
					0.5,
				),
				meta: { owner: "press" },
			},
		);
	const CYL = parts.CYL;
	const C = L.cyl;
	disc(
		"press.cylinder",
		CYL,
		-C.half,
		C.half,
		C.r,
		{ tone: "hi", crease: "lo" },
		{
			inner:
				Ln(G.arcOf(CYL, -C.half + 1.2, C.r, P), { tone: "faint" }) +
				Ln(G.arcOf(CYL, C.half - 1.2, C.r, P), { tone: "faint" }),
			extra: `<g data-part="ribs">${parts.cylinderRibs(0)}</g>`,
			meta: { owner: "press" },
		},
	);
	for (const x of L.inkers) {
		const F = G.frameOf([x, C.y, L.inkerZ], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
		disc(
			"press.inker",
			F,
			-C.half,
			C.half,
			L.inkerR,
			{ tone: "mid" },
			{
				inner:
					Ln(G.arcOf(F, -C.half + 2, L.inkerR, P), { tone: "faint" }) +
					Ln(G.arcOf(F, C.half - 2, L.inkerR, P), { tone: "faint" }),
				meta: { owner: "press" },
			},
		);
	}
	const FW = L.flywheel;
	const FLY = parts.FLY;
	disc(
		"press.flywheel",
		FLY,
		0,
		FW.thick,
		FW.r,
		{ tone: "mid" },
		{
			steps: 64,
			inner:
				Ln(G.circleOf(FLY, FW.thick, FW.r - 1.6, P, 64), { tone: "lo" }) +
				Ln(G.arcOf(FLY, FW.thick - 1, FW.r, P), { tone: "faint" }),
			extra: `<g data-part="spokes">${parts.flywheelSpokes(0)}</g>`,
			meta: { owner: "press" },
		},
	);
	disc(
		"press.hub",
		FLY,
		FW.thick,
		FW.thick + 1.6,
		3,
		{ tone: "mid" },
		{
			extra: Dots([at([FW.x, FW.y + FW.thick + 1.6, FW.z])], { size: 0.5 }),
			meta: { owner: "press" },
		},
	);
	// A lever on the base's front corner.
	const lever = { x: PR.x + 3, y: PR.y + PR.d - 7, w: 5, d: 4, r: 0.6 };
	box(
		"press.lever.base",
		lever,
		L.pressH,
		1.6,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "press" } },
	);
	cyl(
		"press.lever",
		lever.x + 2.5,
		lever.y + 2,
		0.6,
		L.pressH + 1.6,
		7,
		{ tone: "hi", crease: "none" },
		{ steps: 10, meta: { owner: "press" } },
	);
	put(
		"press.lever.knob",
		[lever.x + 2.5, lever.y + 2, L.pressH + 9.6],
		S(G.sphereOf([lever.x + 2.5, lever.y + 2, L.pressH + 9.6], 1.3, P), {
			tone: "mid",
		}),
		[
			A.ball([lever.x + 2.5, lever.y + 2, L.pressH + 9.6], 1.3, {
				name: "press.lever.knob",
				owner: "press",
			}),
		],
	);
	// The delivery board at the exit, on two legs.
	const DL = L.delivery;
	for (const y of [DL.y + 4, DL.y + DL.d - 4])
		cyl(
			"delivery.leg",
			DL.x + DL.w - 3,
			y,
			1.2,
			0,
			L.deliveryZ,
			{ tone: "mid", crease: "none" },
			{ steps: 12 },
		);
	box(
		"delivery",
		DL,
		L.deliveryZ,
		2,
		{ tone: "mid" },
		{ steps: 3, bevel: 0.3 },
	);
	for (const y of [DL.y, DL.y + DL.d - 1.4])
		box(
			"delivery.guide",
			{ x: DL.x, y, w: DL.w, d: 1.4, r: 0.3 },
			L.deliveryZ + 2,
			1.6,
			{ tone: "lo" },
			{ steps: 2 },
		);
}

// ── Station 4: the incline, the gallery, the proof desk, the lamp and the stamp ──
{
	const IN = L.incline;
	const { F, length, a, v } = parts.runFrame(IN.from, IN.to);
	const h = IN.w / 2;
	prism(
		"incline.rail.far",
		F,
		rect(-h - 1.4, -h, 0, 3.2),
		0,
		length,
		{ tone: "mid" },
		{ meta: { owner: "incline" } },
	);
	prism(
		"incline.belt",
		F,
		rect(-h, h, 0, 1.6),
		0,
		length,
		{ tone: "hi", crease: "lo" },
		{ meta: { owner: "incline" } },
	);
	prism(
		"incline.rail.near",
		F,
		rect(h, h + 1.4, 0, 3.2),
		0,
		length,
		{ tone: "mid" },
		{ meta: { owner: "incline" } },
	);
	for (const [name, s] of [
		["incline.roller.low", 0],
		["incline.roller.high", length],
	]) {
		const centre = G.add3(G.add3(IN.from, G.mul3(a, s)), G.mul3(v, -2.4));
		const RF = G.frameOf(centre, [0, 1, 0], [0, 0, 1], [1, 0, 0]);
		disc(
			name,
			RF,
			-h - 1,
			h + 1,
			2.4,
			{ tone: "mid" },
			{
				inner: Ln(G.arcOf(RF, -h + 1, 2.4, P), { tone: "faint" }),
				meta: { owner: "incline" },
			},
		);
	}
	const low = G.add3(IN.from, G.mul3(v, -2.4));
	box(
		"incline.cradle",
		{ x: low[0] - 3, y: IN.from[1] - h - 1, w: 6, d: IN.w + 2, r: 0.5 },
		0,
		low[2] - 2.4,
		{ tone: "mid" },
		{ steps: 2 },
	);
	const sPost = length - 9;
	const p = G.add3(IN.from, G.mul3(a, sPost));
	for (const y of [IN.from[1] - h - 0.7, IN.from[1] + h + 0.7])
		cyl(
			"incline.post",
			p[0],
			y,
			0.6,
			0,
			p[2],
			{ tone: "mid", crease: "none" },
			{ steps: 10 },
		);
	// The gallery: four columns, a deck, an L of railing at the back-right corner.
	const GL = L.gallery;
	for (const [x, y] of k.corners(GL, 5)) {
		cyl(
			"gallery.column",
			x,
			y,
			2.2,
			0,
			L.galleryZ - 2,
			{ tone: "mid", crease: "none" },
			{
				steps: 20,
				extra: Ln(k.sideArc(x, y, 2.2, 12, P, 14), { tone: "faint" }),
			},
		);
		cyl(
			"gallery.collar",
			x,
			y,
			3,
			L.galleryZ - 2,
			2,
			{ tone: "mid" },
			{ steps: 20 },
		);
	}
	box(
		"gallery.deck",
		GL,
		L.galleryZ,
		L.galleryH,
		{ tone: "mid" },
		{
			steps: 3,
			bevel: 0.6,
			inner: Ln(k.sideSeam(GL, L.galleryZ + 1.2, P, 3), { tone: "faint" }),
			extra: screws(
				k.corners(GL, 2.4).map(([x, y]) => [x, y, L.galleryZ + L.galleryH]),
				0.45,
			),
		},
	);
	const deckTop = L.galleryZ + L.galleryH;
	const posts = [
		[GL.x + 30, GL.y + 1.2],
		[GL.x + GL.w - 1.2, GL.y + 1.2],
		[GL.x + GL.w - 1.2, GL.y + 16],
	];
	for (const [x, y] of posts)
		cyl(
			"railing.post",
			x,
			y,
			0.6,
			deckTop,
			11,
			{ tone: "mid", crease: "none" },
			{ steps: 10, meta: { owner: "railing" } },
		);
	box(
		"railing.back",
		{
			x: posts[0][0],
			y: GL.y + 0.6,
			w: posts[1][0] - posts[0][0],
			d: 1.2,
			r: 0.3,
		},
		deckTop + 11,
		1.2,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "railing" } },
	);
	box(
		"railing.side",
		{
			x: GL.x + GL.w - 1.8,
			y: posts[1][1],
			w: 1.2,
			d: posts[2][1] - posts[1][1],
			r: 0.3,
		},
		deckTop + 11,
		1.2,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "railing" } },
	);
	// The proof desk: a cabinet with a drawer, a ledge, the lamp and the stamp.
	const PD = L.proofDesk;
	const faceY = PD.y + PD.d;
	const drawer = k.pathOf(
		[
			at([PD.x + 3, faceY, deckTop + 2]),
			at([PD.x + PD.w - 3, faceY, deckTop + 2]),
			at([PD.x + PD.w - 3, faceY, deckTop + 6]),
			at([PD.x + 3, faceY, deckTop + 6]),
		],
		true,
	);
	box(
		"desk2",
		PD,
		deckTop,
		L.proofTop - deckTop,
		{ tone: "mid" },
		{
			steps: 3,
			bevel: 0.6,
			inner: Ln(drawer, { tone: "lo" }),
			extra: Dots([at([PD.x + PD.w / 2, faceY, deckTop + 4])], { size: 0.55 }),
		},
	);
	box(
		"desk2.ledge",
		{ x: PD.x, y: faceY - 1.4, w: PD.w, d: 1.4, r: 0.3 },
		L.proofTop,
		1,
		{ tone: "lo" },
		{ steps: 2 },
	);
	const [lx, ly] = L.lamp.post;
	cyl(
		"lamp.post",
		lx,
		ly,
		0.8,
		L.proofTop + 1.4,
		L.lamp.z - L.proofTop - 1.4,
		{ tone: "mid", crease: "none" },
		{
			steps: 12,
			extra: Ln(k.sideArc(lx, ly, 0.8, L.proofTop + 3, P, 8), {
				tone: "faint",
			}),
			meta: { owner: "lamp" },
		},
	);
	cyl(
		"lamp.collar",
		lx,
		ly,
		1.3,
		L.proofTop,
		1.4,
		{ tone: "mid" },
		{ steps: 12, meta: { owner: "lamp" } },
	);
	const [sx, sy] = L.lamp.shade;
	box(
		"lamp.arm1",
		{ x: sx - 0.8, y: ly - 0.8, w: lx - 0.8 - (sx - 0.8), d: 1.6, r: 0.3 },
		L.lamp.z - 1.6,
		1.6,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "lamp" } },
	);
	box(
		"lamp.arm2",
		{ x: sx - 0.8, y: ly + 0.8, w: 1.6, d: sy - ly - 0.8, r: 0.3 },
		L.lamp.z - 1.6,
		1.6,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "lamp" } },
	);
	const SF = G.frameAlong([sx, sy, L.lamp.z - 1.6], [0, 0, -1]);
	turned(
		"lamp.shade",
		SF,
		[
			[0, 1.3],
			[1, 1.3],
			[1, 2.2],
			[6, 5.4],
		],
		{ tone: "mid" },
		{
			inner: Ln(G.arcOf(SF, 1, 2.2, P, { slope: 0 }), { tone: "faint" }),
			meta: { owner: "lamp" },
		},
	);
	const ST = L.stamp;
	box(
		"stamp.post",
		ST.post,
		L.proofTop,
		ST.armZ - L.proofTop,
		{ tone: "mid" },
		{ steps: 2, meta: { owner: "stamp" } },
	);
	box(
		"stamp.arm",
		ST.arm,
		ST.armZ,
		3,
		{ tone: "mid" },
		{
			steps: 2,
			extra: screws(
				[[ST.arm.x + ST.arm.w / 2, ST.arm.y + 2, ST.armZ + 3]],
				0.4,
			),
			meta: { owner: "stamp" },
		},
	);
	const [px, py] = ST.plunger;
	const shaft = S(
		k.cylinder(
			px,
			py,
			1.8,
			L.proofTop + 1.6,
			ST.armZ - L.proofTop - 1.6,
			P,
			16,
		),
		{ tone: "hi", crease: "lo" },
	);
	const cap =
		S(k.cylinder(px, py, 2.4, ST.armZ + 3, 2, P, 16), { tone: "mid" }) +
		Ln(k.knurl(px, py, 2.4, ST.armZ + 3, ST.armZ + 5, 16, P), { tone: "lo" });
	put(
		"stamp.shaft",
		[px, py, (L.proofTop + ST.armZ) / 2],
		`<g data-part="stamp">${shaft}</g>`,
		[
			A.cylinder(px, py, 1.8, L.proofTop + 1.6, ST.armZ - L.proofTop - 1.6, {
				name: "stamp.shaft",
				flying: true,
				owner: "stamp",
			}),
		],
	);
	put(
		"stamp.cap",
		[px, py, ST.armZ + 4],
		`<g data-part="stamp-cap">${cap}</g>`,
		[
			A.cylinder(px, py, 2.4, ST.armZ + 3, 2, {
				name: "stamp.cap",
				flying: true,
				owner: "stamp",
			}),
		],
	);
}

// ── The return chute behind the press, its lead-in from the desk, and the dock chute ──
{
	const CH = L.chute;
	const leadFrom = [106, -30, 52.2];
	const leadTo = [100, -40.5, 50.4];
	trough("lead", leadFrom, leadTo, CH.w, { owner: "chute" });
	{
		const mid = G.lerp3(leadFrom, leadTo, 0.5);
		const top = underAt(leadFrom, leadTo, mid[0]);
		cyl(
			"lead.post",
			mid[0],
			mid[1],
			0.8,
			L.galleryZ + L.galleryH,
			top - L.galleryZ - L.galleryH,
			{ tone: "mid", crease: "none" },
			{ steps: 10, meta: { owner: "chute" } },
		);
	}
	trough("chute", CH.from, CH.to, CH.w, { owner: "chute" });
	for (const x of [62, 2, -36]) {
		const top = underAt(CH.from, CH.to, x);
		cyl(
			"chute.post.foot",
			x,
			CH.from[1],
			2.8,
			0,
			1,
			{ tone: "lo" },
			{ steps: 20, meta: { owner: "chute" } },
		);
		cyl(
			"chute.post",
			x,
			CH.from[1],
			1.6,
			1,
			top - 1,
			{ tone: "mid", crease: "none" },
			{
				steps: 16,
				extra: Ln(k.sideArc(x, CH.from[1], 1.6, top - 6, P, 10), {
					tone: "faint",
				}),
				meta: { owner: "chute" },
			},
		);
	}
	const DC = L.dockChute;
	trough("dockchute", DC.from, DC.to, DC.w, { owner: "dockchute" });
}

// ── Station 5: the loading dock, the tying table and the bundles ──
{
	const DK = L.dock;
	box(
		"dock",
		DK,
		0,
		L.dockH,
		{ tone: "mid" },
		{
			steps: 4,
			bevel: 0.8,
			inner: Ln(k.sideSeam(DK, 2.4, P, 4), { tone: "faint" }),
			extra: screws(
				k.corners(DK, 3).map(([x, y]) => [x, y, L.dockH]),
				0.5,
			),
		},
	);
	const bumper = { x: DK.x + 2, y: DK.y + DK.d, w: DK.w - 4, d: 2.2, r: 0.5 };
	box(
		"dock.bumper",
		bumper,
		2,
		L.dockH - 2,
		{ tone: "lo" },
		{
			steps: 2,
			extra: Dots(
				[bumper.x + 8, bumper.x + bumper.w / 2, bumper.x + bumper.w - 8].map(
					(x) => at([x, bumper.y + bumper.d, L.dockH - 1.6]),
				),
				{ size: 0.5 },
			),
		},
	);
	const TB = L.table;
	box(
		"table",
		TB,
		L.dockH,
		L.tableH,
		{ tone: "mid" },
		{
			steps: 3,
			bevel: 0.4,
			extra: screws(
				k.corners(TB, 2).map(([x, y]) => [x, y, L.dockH + L.tableH]),
				0.4,
			),
		},
	);
	const { x: qx, y: qy } = L.spool;
	const tableTop = parts.tableTop;
	cyl(
		"spool.post.low",
		qx,
		qy,
		1,
		tableTop,
		4.4,
		{ tone: "mid", crease: "none" },
		{ steps: 12, meta: { owner: "spool" } },
	);
	cyl(
		"spool.flange.low",
		qx,
		qy,
		3,
		tableTop + 4.4,
		0.6,
		{ tone: "lo" },
		{ steps: 20, meta: { owner: "spool" } },
	);
	cyl(
		"spool",
		qx,
		qy,
		2.6,
		tableTop + 5,
		4,
		{ tone: "hi", crease: "lo" },
		{
			steps: 20,
			extra: Ln(k.knurl(qx, qy, 2.6, tableTop + 5, tableTop + 9, 18, P), {
				tone: "lo",
			}),
			meta: { owner: "spool" },
		},
	);
	cyl(
		"spool.flange.high",
		qx,
		qy,
		3,
		tableTop + 9,
		0.6,
		{ tone: "lo" },
		{ steps: 20, meta: { owner: "spool" } },
	);
	cyl(
		"spool.post.high",
		qx,
		qy,
		1,
		tableTop + 9.6,
		4.4,
		{ tone: "mid", crease: "none" },
		{ steps: 12, meta: { owner: "spool" } },
	);
	const AF = G.frameAlong(
		[qx, qy, tableTop + 12.5],
		G.unit3([
			L.table.x + L.table.w / 2 - qx,
			L.table.y + L.table.d / 2 - qy,
			0,
		]),
	);
	prism(
		"spool.arm",
		AF,
		rect(-0.8, 0.8, -0.7, 0.7),
		1,
		10.5,
		{ tone: "mid" },
		{ meta: { owner: "spool" } },
	);
	disc(
		"spool.head",
		AF,
		10.5,
		12.5,
		1.6,
		{ tone: "mid" },
		{
			inner: Ln(G.arcOf(AF, 11.5, 1.6, P), { tone: "faint" }),
			meta: { owner: "spool" },
		},
	);
}

// ── Sheets, prints, plates and bundles ──
const SH = L.sheet;
const SHEET_PLAN = { x: -SH.w / 2, y: -SH.d / 2, w: SH.w, d: SH.d, r: 0.3 };
const SHEET_RULES = [0, 1, 2, 3].map((row) => [
	-5,
	-3.2 + row * 2.1,
	[8, 6.5, 7.5, 4][row],
]);
const PRINT_COLS = [-4.6, -1.2, 2.2].flatMap((x) =>
	[0, 1].map((row) => [x, -1.4 + row * 2, 2.6]),
);
/** A story sheet (rule lines) or a printed paper (masthead and columns), lying flat with its centre at the origin. */
function flatArt(form, lit) {
	const body = S(k.slabOf(SHEET_PLAN, 0, SH.h, P, 2), {
		tone: "hi",
		crease: "lo",
		lit,
	});
	if (form === "sheet")
		return (
			body +
			Ln(
				SHEET_RULES.map(([x, y, w]) =>
					k.lineOnTop([x, y], [x + w, y], SH.h, P),
				).join(""),
				{ tone: "lo", free: true },
			)
		);
	const head = k.lineOnTop([-5.2, -3.4], [5.2, -3.4], SH.h, P);
	return (
		body +
		Ln(head, { tone: "hi", free: true }) +
		Ln(
			PRINT_COLS.map(([x, y, w]) =>
				k.lineOnTop([x, y], [x + w, y], SH.h, P),
			).join(""),
			{ tone: "lo", free: true },
		)
	);
}
/** The same paper standing upright in the clip: its origin is the bottom centre on the clip's face. */
function uprightArt(form, lit) {
	const plan = { x: -SH.w / 2, y: 0, w: SH.w, d: SH.h, r: 0.2 };
	const body = S(k.slabOf(plan, 0, SH.d, P, 2), {
		tone: "hi",
		crease: "lo",
		lit,
	});
	const line = ([x, y, w]) =>
		k.segment([x, SH.h, SH.d / 2 - y], [x + w, SH.h, SH.d / 2 - y], P);
	if (form === "sheet")
		return (
			body + Ln(SHEET_RULES.map(line).join(""), { tone: "lo", free: true })
		);
	return (
		body +
		Ln(line([-5.2, -3.4, 10.4]), { tone: "hi", free: true }) +
		Ln(PRINT_COLS.map(line).join(""), { tone: "lo", free: true })
	);
}
/** The paper lying on a tilted run, built along the run's frame from its start (`s` is its centre). */
function tiltedArt(slot, form, lit, s) {
	const run = parts.RUNS[RUN_SLOTS[slot]];
	const F = run.F;
	const lift = run.lift;
	const body = S(
		G.prismOf(
			F,
			rect(-SH.d / 2, SH.d / 2, lift, lift + SH.h),
			s - SH.w / 2,
			s + SH.w / 2,
			P,
		),
		{ tone: "hi", crease: "lo", lit },
	);
	const on = (x, y) =>
		G.add3(
			G.add3(G.add3(F.o, G.mul3(F.a, s + x)), G.mul3(F.u, y)),
			G.mul3(F.v, lift + SH.h),
		);
	const line = ([x, y, w]) => k.pathOf([at(on(x, y)), at(on(x + w, y))]);
	if (form === "sheet")
		return (
			body + Ln(SHEET_RULES.map(line).join(""), { tone: "lo", free: true })
		);
	return (
		body +
		Ln(line([-5.2, -3.4, 10.4]), { tone: "hi", free: true }) +
		Ln(PRINT_COLS.map(line).join(""), { tone: "lo", free: true })
	);
}
const copy = (slot, form, lit, art, where) =>
	`<g class="pl-copy" data-slot="${slot}" data-form="${form}"${lit ? " data-lit" : ""} transform="${k.translateAlong(P, where)}" style="display:none">${art}</g>`;
const flatShape = (name, [x, y, z], meta = {}) =>
	A.slab(
		{ ...SHEET_PLAN, x: SHEET_PLAN.x + x, y: SHEET_PLAN.y + y },
		z,
		SH.h,
		{ name, flying: true, ...meta },
		2,
	);
const SHEET_SLOTS = ["wire", "lift", "roll", "load", "holder"];
const PRINT_SLOTS = ["out", "up", "desk", "back", "rework", "down"];
const REST = {
	wire: 0.3,
	lift: 0.5,
	roll: 0.5,
	load: 0.5,
	out: 0.5,
	up: 0.5,
	back: 0.5,
	down: 0.5,
};
/** Where each run copy was built: the page moves it relative to this. */
const ORIGINS = {};
for (const slot of [...SHEET_SLOTS, ...PRINT_SLOTS]) {
	const form = SHEET_SLOTS.includes(slot) ? "sheet" : "print";
	const rest = { slot, u: REST[slot] ?? 0, k: slot === "wire" ? 7 : 0 };
	const pose = parts.poseOf(rest);
	let svg;
	let shape;
	let ref;
	if (RUN_SLOTS[slot]) {
		// Built along the run at its resting `s`, so the recorded shape is what is drawn; the page moves it by the run's start.
		const run = parts.RUNS[RUN_SLOTS[slot]];
		const s = G.dot3(G.sub3(pose, L[RUN_SLOTS[slot]].from), run.a);
		svg =
			copy(slot, form, false, tiltedArt(slot, form, false, s), [0, 0, 0]) +
			copy(slot, form, true, tiltedArt(slot, form, true, s), [0, 0, 0]);
		shape = A.prism(
			run.F,
			rect(-SH.d / 2, SH.d / 2, run.lift, run.lift + SH.h),
			s - SH.w / 2,
			s + SH.w / 2,
			{ name: `slot.${slot}`, flying: true },
		);
		ORIGINS[slot] = pose;
		ref = G.add3(pose, G.mul3(run.v, run.lift + SH.h / 2));
	} else if (UP_SLOTS.includes(slot)) {
		svg =
			copy(slot, form, false, uprightArt(form, false), pose) +
			copy(slot, form, true, uprightArt(form, true), pose);
		shape = A.slab(
			{ x: pose[0] - SH.w / 2, y: pose[1], w: SH.w, d: SH.h, r: 0.2 },
			pose[2],
			SH.d,
			{ name: `slot.${slot}`, flying: true },
			2,
		);
		ref = [pose[0], pose[1] + SH.h / 2, pose[2] + SH.d / 2];
	} else {
		svg =
			copy(slot, form, false, flatArt(form, false), pose) +
			copy(slot, form, true, flatArt(form, true), pose);
		shape = flatShape(
			`slot.${slot}`,
			pose,
			slot === "wire" ? { owner: "printer" } : {},
		);
		ref = [pose[0], pose[1], pose[2] + SH.h / 2];
	}
	put(`slot.${slot}`, ref, `<g data-part="slot-${slot}">${svg}</g>`, [shape], {
		bias: UP_SLOTS.includes(slot) ? 0.3 : 0,
	});
}
// The spike holds up to every sheet; copies paint from the bottom of the stack.
{
	const svg = N.SHEETS.map((_, index) =>
		copy(
			"spike",
			"sheet",
			index === N.LIT,
			flatArt("sheet", index === N.LIT),
			parts.spikeAt(N.SHEETS.length - 1 - index),
		),
	).join("");
	const pose = parts.spikeAt(3);
	put(
		"slot.spike",
		[pose[0], pose[1], pose[2]],
		`<g data-part="slot-spike">${svg}</g><g data-part="pin">${S(parts.pinAbove(parts.SPIKE_Z), { tone: "hi", crease: "none" })}</g>`,
		N.SHEETS.map((_, n) => flatShape("slot.spike", parts.spikeAt(n))),
		{ bias: 0.2 },
	);
}
// Loose prints on the tying table, two deep plus the lit one.
{
	const svg =
		copy("stack", "print", false, flatArt("print", false), parts.stackAt(0)) +
		copy("stack", "print", false, flatArt("print", false), parts.stackAt(1)) +
		copy("stack", "print", true, flatArt("print", true), parts.stackAt(1));
	const pose = parts.stackAt(0);
	put(
		"slot.stack",
		[pose[0], pose[1], pose[2] + 0.8],
		`<g data-part="slot-stack">${svg}</g>`,
		[
			flatShape("slot.stack", parts.stackAt(0)),
			flatShape("slot.stack", parts.stackAt(1)),
		],
	);
}
// The galley tray with its type lines: the plate. It moves from the galley to the bed and back.
{
	const GY = L.galley;
	const tray =
		S(k.slabOf(GY, L.tsH, L.trayH, P, 3, 0.3), { tone: "mid" }) +
		Ln(k.planOutline(k.insetPlan(GY, 1.2), L.tsH + L.trayH, P, 3), {
			tone: "faint",
		});
	const lines = Array.from({ length: N.LINES }, (_, i) => {
		const plan = {
			x: GY.x + (GY.w - L.lineW) / 2,
			y: L.lineY0 + i * L.linePitch - 0.55,
			w: L.lineW,
			d: 1.1,
			r: 0.2,
		};
		return `<g class="pl-line" style="display:none">${S(k.slabOf(plan, L.tsH + L.trayH, 0.5, P, 1), { tone: "hi", crease: "none" })}</g>`;
	}).join("");
	put(
		"tray",
		centreOf(GY, L.tsH, L.trayH + 0.5),
		`<g data-part="tray" class="pl-tray">${tray}${lines}</g>`,
		[A.slab(GY, L.tsH, L.trayH + 0.5, { name: "tray", flying: true }, 3)],
		{ bias: 0.2 },
	);
}
// Bundles: each a stack of papers on the dock tied with two twines; the lit paper tops its bundle.
for (let b = 0; b < N.BUNDLES; b++) {
	const [bx, by] = L.pile[b];
	const n = N.BUNDLE_SIZE[b];
	const litTop = N.SHEETS[N.LIT].bundle === b;
	let svg = "";
	const shapes = [];
	for (let i = 0; i < n; i++) {
		const z = L.dockH + i * SH.pitch;
		const lit = litTop && i === n - 1;
		svg += `<g transform="${k.translateAlong(P, [bx, by, z])}">${flatArt("print", lit)}</g>`;
		shapes.push(flatShape(`bundle${b}.paper`, [bx, by, z]));
	}
	const top = L.dockH + (n - 1) * SH.pitch + SH.h;
	const twine = [-2.6, 2.6]
		.map(
			(dy) =>
				k.segment(
					[bx - SH.w / 2, by + dy, top],
					[bx + SH.w / 2, by + dy, top],
					P,
				) +
				k.segment(
					[bx + SH.w / 2, by + dy, top],
					[bx + SH.w / 2, by + dy, L.dockH],
					P,
				),
		)
		.join("");
	svg += `<g class="pl-twine">${Ln(twine, { tone: "mid" })}</g>`;
	put(
		`bundle${b}`,
		[bx, by, (L.dockH + top) / 2],
		`<g data-part="bundle" data-bundle="${b}">${svg}</g>`,
		shapes,
		{ bias: 0.1 },
	);
}

A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const body = [halo, ...R.items.map((item) => item.svg)];

const svg = k.figureSvg({
	width: W,
	height: H,
	label:
		"A small overnight newspaper plant, seen from above and to the side, read left to right: a wire desk where story sheets print out onto a spike; a typesetting machine that composes one sheet at a time, line by line; a flat-bed press that runs on a timer; an inclined belt up to a proof desk under a lamp, with a return chute back to the typesetter for a rejected proof; and a loading dock where approved papers are tied into bundles. A wall clock shows the time and the light goes from dusk to morning.",
	body,
});

const DATA = {
	P,
	LIT: N.LIT,
	count: N.SHEETS.length,
	bundles: N.BUNDLES,
	sizes: N.BUNDLE_SIZE,
	theme: THEME,
	origins: ORIGINS,
};
const strip = (file) =>
	readFileSync(file, "utf8")
		.replace(/^import .*$/gm, "")
		.replace(/^export /gm, "");
const latheSource = strip(join(ISO, "lathe.mjs"));
const latheScript = `const G = (() => {${latheSource}\nreturn { frameOf, frameAlong, ribsOf, spokesOf, add3, mul3, unit3, sub3, cross3, len3, dot3, viewOf };})();\n`;
const kitScript = strip(join(ISO, "iso-kit.mjs"));
const modelScript = `const NIGHT = (() => {${strip(join(HERE, "night.mjs"))}\nreturn { START, NIGHT_END, T_END, EVERY, LIT, SHEETS, BUNDLES, BUNDLE_SIZE, PLAN, TIED_AT, ALL_TIED, TIE, CARRY, TO_GALLEY, LINES, clamp, smooth, clock, sheetAt, pressAt, typesetterAt, trolleyAt, deskAt, bundleAt, prsAt, readoutOf };})();\n`;
const partsScript = strip(join(HERE, "parts.mjs"));
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace(
	"__DATA__",
	JSON.stringify(DATA),
);
const CSS = readFileSync(join(HERE, "plant.css"), "utf8");

const page = k.pageHtml({
	title: "The Night Edition",
	theme: THEME,
	width: 650,
	body:
		`<style>${CSS}</style>` +
		k.plateHtml({
			fig: "Fig 2",
			title: "The night edition",
			hint: "Drag to run the night · ← → 15 min",
			readout: N.readoutOf(N.T_END),
			keys: [
				{
					mark: "lit",
					label: "One issue you can follow, from the wire to its bundle",
				},
				{
					mark: "raised",
					label:
						"Story sheets, plates and papers: the other issues of the night",
				},
			],
			caption: `Linear issues come off the wire in the evening as story sheets and wait on the spike. From 22:00 the typesetter, the agent in Orca, takes one Work Card at a time and composes it line by line; the plate goes to the press, which runs on the build tick every 15 minutes: the build and tests. Every print goes up to the proof desk for a Round of review and checks. A proof that fails is sent back down the return chute, reworked and printed again; one that passes is stamped and dropped to the dock, where the papers of each Repo Lane are tied into one bundle on the land tick, one pull request each. ${N.SHEETS.length} issues go in at night, ${N.BACKS} come back once, and by morning ${N.BUNDLES} pull requests wait on the dock for your review.`,
			body: `<div class="iso-stage pl-stage" tabindex="0" role="slider" aria-label="The night edition: drag across, or use the arrow keys, to run the night from 22:00 to 07:00" aria-valuemin="0" aria-valuemax="${N.T_END}" aria-valuenow="${N.T_END}" aria-valuetext="${N.readoutOf(N.T_END)}">${svg}</div>`,
		}),
	script: kitScript + latheScript + modelScript + partsScript + LIVE,
});
const name = THEME === "light" ? "plant-light.html" : "plant.html";
writeFileSync(join(HERE, name), page);
console.log(
	"wrote",
	name,
	`${(page.length / 1024).toFixed(0)} KB`,
	`${R.items.length} items`,
	`scale ${P.scale.toFixed(3)}`,
);
A.auditOrExit(R, P, { allow: [["spike.pin", "slot.spike"]] });
