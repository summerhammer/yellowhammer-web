// Reusable physical parts for the Hermes post figures. Each part draws into a Scene and is placed
// by its centre (cx, cy) on the lane plate, whose top is at z = TOP.
//
//   plate        the lane's base plate on feet, with corner screws
//   chevrons     inlaid flow marks on the plate
//   indexCard    a Work Card or a task card: a thin paper slab with a band and ink lines
//   cardHolder   a block with a slot holding one card, and a pencil in front of it
//   cardPad      a pad of blank cards with a pencil on it
//   specBook     an open bound book on a lectern
//   machine      a station: `decomposer` (hopper) or `selector` (rack and gantry); output slots
//   board        a pinboard on legs, with cards pinned to it or empty guide slots
//
// Material codes: "n" neutral (Hermes), "y" brand yellow (Yellowhammer only), "o" olive, "p" paper.

import { circle, front, k, path, rectOn, scrawl, TOP } from "./lib.mjs";

const rectPath = (S, pts) =>
	k.pathOf(
		pts.map((p) => S.at(p)),
		true,
	);

/** Base plate on four feet; the first thing painted in a lane. */
export function plate(S, w, d, x0 = 0) {
	let feet = "";
	for (const [fx, fy] of [
		[10, 10],
		[w - 18, 10],
		[10, d - 18],
		[w - 18, d - 18],
	]) {
		feet += S.slab({ x: x0 + fx, y: fy, w: 8, d: 8, r: 1 }, 0, 5, "n", {
			steps: 3,
		});
	}
	const plan = { x: x0, y: 0, w, d, r: 6 };
	let s = feet + S.slab(plan, 5, 8, "n", { bevel: 1 });
	// A routed groove just inside the edge, and four corner screws.
	s += path("fig-crease", k.planOutline(k.insetPlan(plan, 5), TOP, S.P));
	for (const [sx, sy] of [
		[9, 9],
		[w - 9, 9],
		[9, d - 9],
		[w - 9, d - 9],
	]) {
		s += circle("fig-ink", S.at([x0 + sx, sy, TOP]), 1.4);
	}
	S.addFirst(s);
}

/** Inlaid chevrons on the plate top, pointing +x. `cls` is a fill class. */
export function chevrons(S, xs, cy, cls) {
	let s = "";
	for (const gx of xs) {
		s += S.poly(cls, [
			[gx - 7, cy - 9, TOP + 0.05],
			[gx, cy - 9, TOP + 0.05],
			[gx + 8, cy, TOP + 0.05],
			[gx, cy + 9, TOP + 0.05],
			[gx - 7, cy + 9, TOP + 0.05],
			[gx + 1, cy, TOP + 0.05],
		]);
	}
	S.addFirst(s);
}

/**
 * One index card standing on its bottom edge at (x, y, z), `w` wide, `h` tall, facing +y.
 * `band` is a fill class for the coloured strip along the top; `hand` draws a pen scrawl instead
 * of ruled lines; `pin` adds a pin at the top.
 */
export function indexCard(
	S,
	{ x, y, z, w = 30, h = 24, band, hand = false, lines = 2, pin = false },
) {
	const d = 1.4;
	const F = front(y + d + 0.05);
	let s = S.slab({ x, y, w, d, r: 0 }, z, h, "p", { steps: 2 });
	if (band)
		s += S.poly(band, rectOn(F, x + 0.5, z + h - 5, x + w - 0.5, z + h - 0.5));
	for (let i = 0; i < lines; i++) {
		const zl = z + h - (band ? 10 : 7) - i * 5;
		const x1 = x + w - 4 - (i === lines - 1 ? w * 0.3 : 0);
		s += hand
			? S.line("fig-rule", scrawl(F, x + 4, x1, zl, 1.2, 2.6 + i))
			: S.line("fig-rule", [F(x + 4, zl), F(x1, zl)]);
	}
	if (pin) s += circle("fig-ink", S.at(F(x + w / 2, z + h - 2.6)), 1.7);
	return s;
}

/** A pencil lying along +x with its tip toward +x, centre at (cx, cy) on surface height `z`. */
function pencil(S, cx, cy, z) {
	const x = cx - 18;
	let s = S.slab({ x, y: cy - 1.6, w: 26, d: 3.2, r: 1.2 }, z, 3.2, "n", {
		steps: 3,
	});
	s += S.slab({ x: x + 26, y: cy - 1.6, w: 3, d: 3.2, r: 0.4 }, z, 3.2, "d", {
		steps: 2,
	});
	s += S.slab({ x: x - 3.5, y: cy - 1.6, w: 3.5, d: 3.2, r: 1 }, z, 3.2, "d", {
		steps: 2,
	});
	s += S.slab({ x: x + 29, y: cy - 1, w: 5, d: 2, r: 0.4 }, z + 0.6, 2, "p", {
		steps: 2,
	});
	return s;
}

/** A pad of blank cards (several thin sheets, slightly offset) with a pencil on top. */
export function cardPad(S, { cx, cy }) {
	let s = "";
	const x = cx - 22;
	const y = cy - 14;
	for (let i = 0; i < 4; i++) {
		s += S.slab(
			{ x: x + i * 0.6, y: y + i * 0.6, w: 44, d: 28, r: 1 },
			TOP + i * 2,
			2,
			"p",
			{ steps: 3 },
		);
	}
	// Faint ruled lines on the top sheet.
	const zt = TOP + 8.05;
	for (let i = 0; i < 4; i++) {
		s += S.line("fig-rule", [
			[x + 5, y + 7 + i * 5, zt],
			[x + 38 - (i === 3 ? 14 : 0), y + 7 + i * 5, zt],
		]);
	}
	s += pencil(S, cx + 4, cy + 20, TOP);
	S.add([cx, cy, TOP + 4], s);
}

/** A block with a slot and one index card standing in it, a pencil lying in front. */
export function cardHolder(S, { cx, cy, band, hand = true }) {
	const x = cx - 26;
	const y = cy - 9;
	let s = S.slab({ x, y, w: 52, d: 18, r: 2 }, TOP, 8, "n", { bevel: 0.8 });
	// The slot, and the card in it.
	s += S.slab(
		{ x: x + 6, y: cy - 1.6, w: 40, d: 3.2, r: 0.4 },
		TOP + 8,
		0.2,
		"d",
		{ steps: 2, flat: true },
	);
	s += indexCard(S, {
		x: x + 8,
		y: cy - 0.7,
		z: TOP + 8,
		w: 36,
		h: 30,
		band,
		hand,
		lines: 3,
	});
	// Front plate of the block with two rules.
	const F = front(y + 18 + 0.05);
	s += S.poly("fig-n3", rectOn(F, x + 6, TOP + 2.2, x + 22, TOP + 5.8));
	s += S.line("fig-rule", [F(x + 9, TOP + 4.6), F(x + 19, TOP + 4.6)]);
	s += S.line("fig-rule", [F(x + 9, TOP + 3.2), F(x + 15, TOP + 3.2)]);
	s += pencil(S, cx, cy + 24, TOP);
	S.add([cx, cy, TOP + 8], s);
}

/** An open bound book on a lectern. `cover` is the cover material ("y" for Yellowhammer). */
export function specBook(S, { cx, cy, cover = "y" }) {
	const x = cx - 38;
	const y = cy - 22;
	let s = S.slab({ x: x + 22, y: y + 12, w: 32, d: 20, r: 1.5 }, TOP, 14, "n", {
		bevel: 0.8,
	});
	s += S.slab({ x: x + 8, y: y + 4, w: 60, d: 36, r: 2 }, TOP + 14, 4, "n", {
		bevel: 0.8,
	});
	// The cover, the two page blocks and the spine.
	const zc = TOP + 18;
	s += S.slab({ x: x + 11, y: y + 7, w: 54, d: 30, r: 1.5 }, zc, 2, cover, {
		bevel: 0.6,
	});
	s += S.slab({ x: x + 13, y: y + 9, w: 24, d: 26, r: 0.6 }, zc + 2, 4, "p", {
		steps: 3,
	});
	s += S.slab({ x: x + 39, y: y + 9, w: 24, d: 26, r: 0.6 }, zc + 2, 4, "p", {
		steps: 3,
	});
	// Page-edge lines on the front of each block, running edge to edge.
	for (const bx of [x + 13, x + 39]) {
		for (const zl of [zc + 3.2, zc + 4.4]) {
			s += S.line("fig-crease", [
				[bx + 0.6, y + 35.05, zl],
				[bx + 23.4, y + 35.05, zl],
			]);
		}
	}
	// Ruled text lines on the top faces, and a ribbon.
	const zt = zc + 6.05;
	for (const bx of [x + 13, x + 39]) {
		for (let i = 0; i < 5; i++) {
			s += S.line("fig-rule", [
				[bx + 3, y + 13 + i * 4.6, zt],
				[bx + 21 - (i === 4 ? 9 : 0), y + 13 + i * 4.6, zt],
			]);
		}
	}
	s += S.poly("fig-o2", [
		[x + 49, y + 33, zt],
		[x + 52, y + 33, zt],
		[x + 52, y + 40, zt - 2],
		[x + 50.5, y + 38.6, zt - 1.6],
		[x + 49, y + 40, zt - 2],
	]);
	// A heavier line down the gutter marks the binding.
	s += S.line("fig-edge", [
		[x + 38, y + 9, zt],
		[x + 38, y + 35, zt],
	]);
	S.add([cx, cy, TOP + 14], s);
}

/** Three slots in the +x face of a machine, each with a card sliding out of it. */
function outputSlots(S, { xr, cy, zs, lens, tip }) {
	let s = "";
	const G = (yy, zz) => [xr + 0.05, yy, zz];
	for (const z of zs) {
		s += S.poly("fig-n1", [
			G(cy - 13, z),
			G(cy + 13, z),
			G(cy + 13, z + 3.4),
			G(cy - 13, z + 3.4),
		]);
	}
	zs.forEach((z, i) => {
		const len = lens[i];
		s += S.slab({ x: xr - 1, y: cy - 11, w: len, d: 22, r: 0.6 }, z, 1, "p", {
			steps: 3,
		});
		s += S.poly(tip, [
			[xr - 1 + len - 4.5, cy - 10.6, z + 1.05],
			[xr - 1 + len - 0.4, cy - 10.6, z + 1.05],
			[xr - 1 + len - 0.4, cy + 10.6, z + 1.05],
			[xr - 1 + len - 4.5, cy + 10.6, z + 1.05],
		]);
		s += S.line("fig-rule", [
			[xr + 2, cy - 5, z + 1.05],
			[xr + len - 8, cy - 5, z + 1.05],
		]);
	});
	return s;
}

/**
 * A station. `kind` "decomposer": a hopper on top with one card dropping in. `kind` "selector":
 * a rack of four feature cards under a gantry that has lifted one clear. Both fan three cards out
 * of slots on the right.
 */
export function machine(
	S,
	{ cx, cy, kind, mat = "n", tip = "fig-n1", lamp = false },
) {
	const w = 78;
	const d = 50;
	const x = cx - w / 2;
	const y = cy - d / 2;
	const zb = TOP + 4;
	const zt = zb + 34;
	let s = S.slab(
		{ x: x - 3, y: y - 3, w: w + 6, d: d + 6, r: 3 },
		TOP,
		4,
		"n",
		{ bevel: 0.6 },
	);
	s += S.slab({ x, y, w, d, r: 3 }, zb, 34, "n", { bevel: 1 });
	const yf = y + d + 0.05;
	const F = front(yf);
	// Dial on the front face: face, rim, three spokes, hub.
	const dx = x + 22;
	const dz = zb + 21;
	const ring = (r, n = 24) =>
		k.pathOf(
			Array.from({ length: n }, (_, i) =>
				S.at(
					F(
						dx + Math.cos((i / n) * 6.2832) * r,
						dz + Math.sin((i / n) * 6.2832) * r,
					),
				),
			),
			true,
		);
	s += path("fig-n4", ring(10));
	s += path("fig-edge", ring(10));
	s += path("fig-crease", ring(7.4));
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * 6.2832;
		s += S.line("fig-crease", [
			F(dx + Math.cos(a) * 8.2, dz + Math.sin(a) * 8.2),
			F(dx + Math.cos(a) * 9.6, dz + Math.sin(a) * 9.6),
		]);
	}
	s += S.line("fig-edge", [F(dx, dz), F(dx + 5.2, dz + 4.6)]);
	s += circle("fig-ink", S.at(F(dx, dz)), 1.6);
	// Label plate with three rules, and an indicator lamp.
	s += S.poly("fig-n3", rectOn(F, x + 42, zb + 15, x + 68, zb + 27));
	s += path(
		"fig-crease",
		rectPath(S, rectOn(F, x + 42, zb + 15, x + 68, zb + 27)),
	);
	for (const [i, e] of [
		[0, 62],
		[1, 62],
		[2, 55],
	]) {
		s += S.line("fig-rule", [
			F(x + 45, zb + 24 - i * 3.2),
			F(x + e, zb + 24 - i * 3.2),
		]);
	}
	s += circle(lamp ? "fig-y3" : "fig-n3", S.at(F(x + 72, zb + 29)), 2.4);
	s += circle("fig-edge", S.at(F(x + 72, zb + 29)), 2.4);
	// Two vent slots low on the front.
	for (const zv of [zb + 5.5, zb + 9]) {
		s += S.poly("fig-n1", rectOn(F, x + 8, zv, x + 36, zv + 1.8));
	}
	// Output slots on the right face, with their cards.
	s += outputSlots(S, {
		xr: x + w,
		cy,
		zs: [zb + 7, zb + 15, zb + 23],
		lens: [13, 17, 11],
		tip,
	});

	if (kind === "decomposer") {
		s += S.slab({ x: x + 10, y: y + 8, w: 38, d: 34, r: 2 }, zt, 8, "n", {
			bevel: 0.8,
		});
		s += S.poly("fig-n1", [
			[x + 14, y + 12, zt + 8.05],
			[x + 44, y + 12, zt + 8.05],
			[x + 44, y + 38, zt + 8.05],
			[x + 14, y + 38, zt + 8.05],
		]);
		s += indexCard(S, {
			x: x + 15,
			y: cy - 0.7,
			z: zt + 8.05,
			w: 28,
			h: 18,
			hand: true,
			lines: 2,
		});
	} else {
		const rx = x + 10;
		const ry = cy - 6;
		s += S.slab({ x: rx, y: ry, w: 54, d: 12, r: 1.5 }, zt, 4, "n", {
			bevel: 0.6,
		});
		// Gantry: two posts, a crossbar and a hanger over the lifted card.
		s += S.slab({ x: x + 5, y: ry + 4, w: 3, d: 3, r: 0.4 }, zt + 4, 30, "o", {
			steps: 2,
		});
		s += S.slab(
			{ x: x + w - 8, y: ry + 4, w: 3, d: 3, r: 0.4 },
			zt + 4,
			30,
			"o",
			{ steps: 2 },
		);
		const lifted = 2;
		for (let i = 0; i < 4; i++) {
			const up = i === lifted ? 9 : 0;
			s += indexCard(S, {
				x: rx + 3 + i * 13,
				y: ry + 5.3,
				z: zt + 4 + up,
				w: 11,
				h: 18,
				band: i === lifted ? "fig-y3" : "fig-n1",
				lines: 0,
			});
		}
		s += S.slab(
			{ x: x + 5, y: ry + 4, w: w - 10, d: 3, r: 0.6 },
			zt + 34,
			3,
			"o",
			{ steps: 2 },
		);
		s += S.slab(
			{ x: rx + 3 + lifted * 13 + 4.5, y: ry + 4.5, w: 2, d: 2, r: 0.3 },
			zt + 31,
			3,
			"n",
			{ steps: 2 },
		);
		s += S.slab(
			{ x: rx + 3 + lifted * 13 + 2, y: ry + 4, w: 7, d: 3, r: 0.5 },
			zt + 29,
			2,
			"n",
			{ steps: 2 },
		);
		void mat;
	}
	S.add([cx, cy, TOP + 20], s);
}

/**
 * A pinboard on legs. `cards` is a list of { dz, band, hand } for the cards pinned on it (three
 * columns, left to right); `ghost` draws empty dashed card slots instead.
 */
export function board(S, { cx, cy, cards = [], ghost = false }) {
	const w = 120;
	const h = 66;
	const x = cx - w / 2;
	const y = cy - 2.5;
	const zf = TOP + 12;
	let s = "";
	for (const lx of [x + 10, x + w - 18]) {
		s += S.slab({ x: lx, y: y - 7, w: 8, d: 19, r: 1 }, TOP, 13, "n", {
			steps: 3,
		});
	}
	s += S.slab({ x, y, w, d: 5, r: 1.5 }, zf, h, "n", { bevel: 0.8 });
	s += S.slab({ x: x - 2, y: y - 1, w: w + 4, d: 7, r: 1.5 }, zf + h, 3, "n", {
		bevel: 0.6,
	});
	const yf = y + 5 + 0.05;
	const F = front(yf);
	const panel = rectOn(F, x + 5, zf + 5, x + w - 5, zf + h - 5);
	s += S.poly("fig-n3", panel);
	s += path("fig-crease", rectPath(S, panel));
	// Screws in the frame corners.
	for (const [sx, sz] of [
		[x + 2.6, zf + 2.6],
		[x + w - 2.6, zf + 2.6],
		[x + 2.6, zf + h - 2.6],
		[x + w - 2.6, zf + h - 2.6],
	]) {
		s += circle("fig-ink", S.at(F(sx, sz)), 1);
	}
	const cw = 30;
	const ch = 24;
	const xs = [x + 11, x + 45, x + 79];
	const z0 = zf + 5 + (h - 10 - ch) / 2;
	const dzs = [3, -3, 5];
	if (ghost) {
		for (let i = 0; i < 3; i++) {
			const q = rectOn(F, xs[i], z0 + dzs[i], xs[i] + cw, z0 + dzs[i] + ch);
			s += path("fig-guide", rectPath(S, q));
		}
	}
	cards.forEach((c, i) => {
		if (!c) return;
		s += indexCard(S, {
			x: xs[i],
			y: yf - 0.05,
			z: z0 + dzs[i] + (c.dz ?? 0),
			w: cw,
			h: ch,
			band: c.band,
			hand: c.hand,
			lines: 3,
			pin: true,
		});
	});
	S.add([cx, cy, TOP + 20], s);
}

/** A filled disc lying flat at height z, as a polygon class `cls`. */
function discFlat(S, cls, cx, cy, z, r, n = 12) {
	return S.poly(
		cls,
		Array.from({ length: n }, (_, i) => {
			const a = (i / n) * Math.PI * 2;
			return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
		}),
	);
}

/**
 * A sealed envelope (a pull request) lying flat: the flap as a V of lines, and a seal. `seal` is a
 * fill class, or null for an unsealed one.
 */
export function envelope(S, { x, y, z, w = 34, d = 22, seal = "fig-y3" }) {
	const h = 1.8;
	const zt = z + h + 0.05;
	let s = S.slab({ x, y, w, d, r: 1 }, z, h, "p", { steps: 3 });
	s += S.line("fig-rule", [
		[x + 1.5, y + d - 1.5, zt],
		[x + w / 2, y + d * 0.45, zt],
		[x + w - 1.5, y + d - 1.5, zt],
	]);
	s += S.line("fig-rule", [
		[x + 1.5, y + 1.5, zt],
		[x + w / 2, y + d * 0.55, zt],
		[x + w - 1.5, y + 1.5, zt],
	]);
	if (seal) {
		s += discFlat(S, seal, x + w / 2, y + d * 0.5, zt, 2.8);
		s += path(
			"fig-edge",
			k.pathOf(
				Array.from({ length: 12 }, (_, i) => {
					const a = (i / 12) * Math.PI * 2;
					return S.at([
						x + w / 2 + Math.cos(a) * 2.8,
						y + d * 0.5 + Math.sin(a) * 2.8,
						zt,
					]);
				}),
				true,
			),
		);
	}
	return s;
}

/**
 * An open tray. `contents(S, inner)` returns the svg of what lies in it (inner = floor box and
 * floor z); it is painted after the back and side walls and before the low front wall.
 */
export function tray(S, { cx, cy, w = 58, d = 42, contents }) {
	const x = cx - w / 2;
	const y = cy - d / 2;
	const t = 3;
	let s = S.slab({ x, y, w, d, r: 2 }, TOP, 2, "n", { steps: 3 });
	const zf = TOP + 2;
	s += S.slab({ x, y, w, d: t, r: 0.6 }, zf, 12, "n", { steps: 2 });
	s += S.slab({ x, y: y + t, w: t, d: d - t * 2, r: 0.6 }, zf, 12, "n", {
		steps: 2,
	});
	s += S.slab(
		{ x: x + w - t, y: y + t, w: t, d: d - t * 2, r: 0.6 },
		zf,
		12,
		"n",
		{
			steps: 2,
		},
	);
	if (contents)
		s += contents(S, { x: x + t, y: y + t, w: w - t * 2, d: d - t * 2, z: zf });
	s += S.slab({ x, y: y + d - t, w, d: t, r: 0.6 }, zf, 7, "n", { steps: 2 });
	S.add([cx, cy, TOP + 6], s);
}

/** A card standing in a tray or on a surface, with `n` pips on its face (attempt count). */
function pipCard(S, { x, y, z, n }) {
	const w = 22;
	const h = 26;
	let s = indexCard(S, { x, y, z, w, h, band: "fig-n1", lines: 0 });
	const F = front(y + 1.45);
	for (let i = 0; i < n; i++) {
		s += circle(
			"fig-ink",
			S.at(F(x + w / 2 + (i - (n - 1) / 2) * 5, z + 11)),
			1.7,
		);
	}
	return s;
}

/** A rack with three cards marked with one, two and three pips: attempts on one station. */
export function attemptRack(S, { cx, cy }) {
	const x = cx - 38;
	const y = cy - 7;
	let s = S.slab({ x, y, w: 76, d: 14, r: 2 }, TOP, 6, "n", { bevel: 0.6 });
	for (let i = 0; i < 3; i++) {
		s += pipCard(S, { x: x + 4 + i * 24, y: y + 6, z: TOP + 6, n: i + 1 });
	}
	S.add([cx, cy, TOP + 6], s);
}

/**
 * A routing station: plinth, body, three knobs on top (CLI, model, effort), a dial, a lamp and
 * an output slot. `tally` lights that many small lamps in a row; `lit` lights the lamp in
 * Yellowhammer yellow; `tried` leans a crossed-out tag against the front.
 */
export function routeStation(
	S,
	{ cx, cy, tally = 0, lit = false, tried = false },
) {
	const w = 66;
	const d = 44;
	const x = cx - w / 2;
	const y = cy - d / 2;
	const zb = TOP + 4;
	const zt = zb + 30;
	let s = S.slab(
		{ x: x - 3, y: y - 3, w: w + 6, d: d + 6, r: 3 },
		TOP,
		4,
		"n",
		{
			bevel: 0.6,
		},
	);
	s += S.slab({ x, y, w, d, r: 3 }, zb, 30, "n", { bevel: 1 });
	// Three knobs of different heights.
	[8, 12, 6].forEach((kh, i) => {
		s += S.cyl(x + 14 + i * 19, cy, 5, zt, kh, "n", { bevel: 0.4 });
		s += S.line("fig-edge", [
			[x + 14 + i * 19, cy - 0.2, zt + kh + 0.1],
			[x + 14 + i * 19 + 3.4, cy + 2.4, zt + kh + 0.1],
		]);
	});
	const F = front(y + d + 0.05);
	const dx = x + 20;
	const dz = zb + 17;
	const ring = (r, n = 22) =>
		k.pathOf(
			Array.from({ length: n }, (_, i) =>
				S.at(
					F(
						dx + Math.cos((i / n) * 6.2832) * r,
						dz + Math.sin((i / n) * 6.2832) * r,
					),
				),
			),
			true,
		);
	s += path("fig-n4", ring(9));
	s += path("fig-edge", ring(9));
	s += S.line("fig-edge", [F(dx, dz), F(dx + 4.6, dz + 4)]);
	s += circle("fig-ink", S.at(F(dx, dz)), 1.5);
	// Lamp, and the tally row under it.
	s += circle(lit ? "fig-y3" : "fig-n3", S.at(F(x + 50, zb + 22)), 3);
	s += circle("fig-edge", S.at(F(x + 50, zb + 22)), 3);
	for (let i = 0; i < 3; i++) {
		const on = i < tally;
		s += circle(on ? "fig-ink" : "fig-n3", S.at(F(x + 40 + i * 7, zb + 10)), 2);
		s += circle("fig-edge", S.at(F(x + 40 + i * 7, zb + 10)), 2);
	}
	// A single output slot on the right face.
	const xr = x + w + 0.05;
	s += S.poly("fig-n1", [
		[xr, cy - 10, zb + 13],
		[xr, cy + 10, zb + 13],
		[xr, cy + 10, zb + 16.4],
		[xr, cy - 10, zb + 16.4],
	]);
	if (tried) {
		// The tag: a card leaning on the floor in front of the station, crossed through.
		const tx = x + 6;
		const ty = y + d + 4;
		s += indexCard(S, {
			x: tx,
			y: ty,
			z: TOP,
			w: 24,
			h: 17,
			band: "fig-n1",
			lines: 0,
		});
		const G = front(ty + 1.45);
		s += S.line("fig-edge", [G(tx + 4, TOP + 2.5), G(tx + 20, TOP + 11)]);
		s += S.line("fig-edge", [G(tx + 4, TOP + 11), G(tx + 20, TOP + 2.5)]);
	}
	S.add([cx, cy, TOP + 20], s);
}

/** A flat inlaid strip along the plate, with its colour class: the feed from one stop to the next. */
export function rail(S, x0, x1, cy, cls) {
	S.addFirst(
		S.poly(cls, [
			[x0, cy - 2, TOP + 0.05],
			[x1, cy - 2, TOP + 0.05],
			[x1, cy + 2, TOP + 0.05],
			[x0, cy + 2, TOP + 0.05],
		]),
	);
}

/**
 * A back wall with a lit window and a moon, standing along y = 0 from x0 to x1. Cover only.
 */
export function nightWall(S, { x0, x1, z0 = TOP, h = 92 }) {
	const d = 4;
	let s = S.slab({ x: x0, y: 0, w: x1 - x0, d, r: 0 }, z0, h, "n", {
		steps: 2,
	});
	const F = front(d + 0.05);
	const wx0 = x0 + (x1 - x0) * 0.58;
	const wx1 = wx0 + 56;
	const wz0 = z0 + 30;
	const wz1 = wz0 + 46;
	s += S.poly("fig-y4", rectOn(F, wx0, wz0, wx1, wz1));
	s += path("fig-edge", rectPath(S, rectOn(F, wx0, wz0, wx1, wz1)));
	s += S.line("fig-edge", [F((wx0 + wx1) / 2, wz0), F((wx0 + wx1) / 2, wz1)]);
	s += S.line("fig-edge", [F(wx0, (wz0 + wz1) / 2), F(wx1, (wz0 + wz1) / 2)]);
	// The moon: a disc on the glass.
	const mc = [wx0 + 18, wz1 - 14];
	const disc = Array.from({ length: 20 }, (_, i) => {
		const a = (i / 20) * Math.PI * 2;
		return F(mc[0] + Math.cos(a) * 8, mc[1] + Math.sin(a) * 8);
	});
	s += S.poly("fig-paper", disc);
	s += path(
		"fig-edge",
		k.pathOf(
			disc.map((p) => S.at(p)),
			true,
		),
	);
	S.addFirst(s);
}
