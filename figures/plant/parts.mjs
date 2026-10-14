// Geometry shared by the build and the page: where every station is, where a sheet sits in
// each slot, and the few parts rebuilt per frame (clock hands, flywheel, cylinder, spike pin).
// `makeParts(k, G, P)` takes the kit, the lathe module and the projection, so the page can
// inline this file and call it with the same P the build used.

export const L = {
	floor: { x: -182, y: -60, w: 382, d: 92, r: 6 },
	floorH: 6,
	footH: 5,
	wall: { x: -178, y: -60, w: 274, d: 4, r: 0 },
	wallH: 62,
	window: { x0: -152, x1: -112, z0: 30, z1: 52 },
	clock: { x: -8, z: 50, r: 10, depth: 2.2 },
	// Station 1: the wire desk and the spike.
	desk: { x: -174, y: -30, w: 46, d: 32, r: 1.5 },
	deskTop: 17,
	deskThick: 3,
	printer: { x: -172, y: -29, w: 22, d: 14, r: 1.5 },
	printerH: 10,
	roll: { x: -161, y: -22, z: 32.5, r: 3.5, half: 7 },
	slotZ: 19.6,
	spike: { x: -144, y: -9, baseR: 4.5, pinR: 0.55, top: 36 },
	rail: { x: -150, y: 14, w: 62, d: 4, r: 1 },
	railH: 3,
	trolley: { w: 12, d: 9, h: 4, from: -144, to: -96 },
	// Station 2: the typesetter.
	ts: { x: -118, y: -36, w: 54, d: 46, r: 2 },
	tsH: 14,
	magazine: { x: -116, y: -36, w: 42, d: 10, r: 1.5 },
	magazineH: 26,
	keyboard: { x: -116, y: -2, w: 26, d: 12, r: 1.5 },
	keyboardH: 3.5,
	clip: { x: -102, w: 14, z: 27, h: 10 },
	galley: { x: -104, y: -22, w: 18, d: 16, r: 1 },
	trayH: 1.5,
	lineY0: -20.6,
	linePitch: 1.42,
	lineW: 14,
	head: { x: -95, w: 4, d: 3, h: 4.8 },
	bar: { x: -96, y: -25, w: 2, d: 21, r: 0.4 },
	barZ: 20.5,
	rails: [{ y: -20 }, { y: -8 }],
	railsX: [-64, -28],
	railsZ: 12,
	hopper: { x: -62, y: -50, w: 14, d: 10, r: 0.8 },
	hopperH: 30,
	// Station 3: the press.
	press: { x: -30, y: -36, w: 60, d: 44, r: 2 },
	pressH: 11,
	bed: { x: -26, y: -30, w: 40, d: 30, r: 1 },
	bedZ: 11,
	bedH: 3,
	bedStroke: 6,
	uprights: [
		{ x: -5, y: -37, w: 10, d: 4, r: 0.8 },
		{ x: -5, y: 1, w: 10, d: 4, r: 0.8 },
	],
	uprightH: 26,
	cyl: { x: 0, y: -16, z: 23, r: 8, half: 17 },
	inkers: [-10.2, 10.2],
	inkerZ: 23,
	inkerR: 2.2,
	flywheel: { x: 0, y: 5, z: 23, r: 11, thick: 3 },
	delivery: { x: 30, y: -26, w: 10, d: 24, r: 1 },
	deliveryZ: 9,
	// Station 4: the incline, the gallery and the proof desk.
	incline: { from: [44, -14, 11], to: [82, -14, 40], w: 20 },
	gallery: { x: 86, y: -36, w: 38, d: 44, r: 1.5 },
	galleryZ: 38,
	galleryH: 3,
	proofDesk: { x: 92, y: -28, w: 28, d: 26, r: 1.2 },
	proofTop: 51,
	lamp: { post: [118, -26], shade: [106, -18], z: 66 },
	stamp: {
		post: { x: 95, y: -28, w: 4, d: 4, r: 0.4 },
		arm: { x: 95, y: -28, w: 4, d: 16, r: 0.4 },
		armZ: 61,
		plunger: [97, -14],
		travel: 0.9,
	},
	// The return chute, behind the press, and the dock chute.
	chute: { from: [98, -46, 46], to: [-55, -46, 33], w: 13 },
	dockChute: { from: [125.2, -14, 41], to: [139, -14, 12.9], w: 13 },
	// Station 5: the dock.
	dock: { x: 130, y: -44, w: 66, d: 74, r: 2 },
	dockH: 8,
	table: { x: 136, y: -24, w: 22, d: 20, r: 1 },
	tableH: 4,
	spool: { x: 156, y: -22 },
	pile: [
		[165, -30],
		[181, -30],
		[165, -14],
		[181, -14],
		[165, 2],
		[181, 2],
	],
	sheet: { w: 14, d: 10, h: 0.8, pitch: 0.9 },
};

/** Slots whose paper lies on a tilted run; the copy is built along that run from its start. */
export const RUN_SLOTS = { up: "incline", back: "chute", down: "dockChute" };
/** Slots whose paper stands upright in the clip on the magazine. */
export const UP_SLOTS = ["holder", "rework"];

export function makeParts(k, G, P) {
	const at = (p) => k.iso(p, P);
	const TAU = Math.PI * 2;
	const lerp = (a, b, t) => a + (b - a) * t;
	const lerp3 = (a, b, t) => [
		lerp(a[0], b[0], t),
		lerp(a[1], b[1], t),
		lerp(a[2], b[2], t),
	];
	const bump = (u, h) => Math.sin(Math.PI * u) * h;
	const S = L.sheet;

	// Fixed resting places of a sheet's centre (its underside at the surface it lies on).
	const SPIKE_Z = L.deskTop + 1.2;
	const trolleyTop = L.railH + L.trolley.h;
	const spikeAt = (n) => [L.spike.x, L.spike.y, SPIKE_Z + n * S.pitch];
	const trolleyAt = (u) => [
		lerp(L.trolley.from, L.trolley.to, u),
		L.rail.y + L.rail.d / 2,
		trolleyTop,
	];
	const clipFace = L.magazine.y + L.magazine.d;
	const clipAt = [L.clip.x + L.clip.w / 2, clipFace, L.clip.z];
	const galleyAt = [
		L.galley.x + L.galley.w / 2,
		L.galley.y + L.galley.d / 2,
		L.tsH,
	];
	const bedAt = [L.bed.x + L.bed.w / 2, L.bed.y + L.bed.d / 2, L.bedZ + L.bedH];
	const outFrom = [L.cyl.x + 6, L.cyl.y, L.bedZ + L.bedH + L.trayH];
	const outTo = [L.delivery.x + 6, L.cyl.y, L.deliveryZ + 2];
	const tableTop = L.dockH + L.tableH;
	const stackAt = (n) => [
		L.table.x + L.table.w / 2,
		L.table.y + L.table.d / 2,
		tableTop + n * S.pitch,
	];
	const bundleAt = (b) => [L.pile[b][0], L.pile[b][1], L.dockH];
	const slotOut = [
		L.printer.x + L.printer.w / 2,
		L.printer.y + L.printer.d,
		L.slotZ,
	];
	const deskAt = [L.proofDesk.x + 14, L.proofDesk.y + 13, L.proofTop];
	/** A frame along a run with `u` across (world y) and `v` up; the kit's prisms are built in it. */
	function runFrame(from, to) {
		const a = G.unit3(G.sub3(to, from));
		// Across the run, level, and up: the kit's prisms are built in (u, v) and extruded along a.
		let u = G.unit3(G.cross3([0, 0, 1], a));
		if (u[1] < 0) u = G.mul3(u, -1);
		let v = G.unit3(G.cross3(u, a));
		if (v[2] < 0) v = G.mul3(v, -1);
		return {
			F: G.frameOf(from, a, u, v),
			length: G.len3(G.sub3(to, from)),
			a,
			v,
		};
	}
	const RUNS = {
		incline: { ...runFrame(L.incline.from, L.incline.to), lift: 1.6 },
		chute: { ...runFrame(L.chute.from, L.chute.to), lift: 0 },
		dockChute: { ...runFrame(L.dockChute.from, L.dockChute.to), lift: 0 },
	};
	/** Where a copy built along a run has its origin: the run's start point. */
	const originOf = (slot) =>
		RUN_SLOTS[slot] ? L[RUN_SLOTS[slot]].from : [0, 0, 0];
	const along = (name, s) => {
		const run = RUNS[name];
		return G.add3(
			G.add3(L[name].from, G.mul3(run.a, s)),
			G.mul3(run.v, run.lift),
		);
	};

	/** Where a sheet's origin is for a model pose (its centre, or its run start for a tilted copy). */
	function poseOf(pose) {
		const { slot, u = 0, k: n = 0 } = pose;
		switch (slot) {
			case "wire": {
				// Out of the slot, across the desk, and down onto the spike.
				if (u < 0.55) {
					const v = u / 0.55;
					return [slotOut[0], slotOut[1] + 8 * v, slotOut[2] - 0.6];
				}
				const v = (u - 0.55) / 0.45;
				const start = [slotOut[0], slotOut[1] + 8, slotOut[2] - 0.6];
				const end = spikeAt(n);
				const p = lerp3(start, end, v);
				return [p[0], p[1], p[2] + bump(v, 20)];
			}
			case "spike":
				return spikeAt(n);
			case "lift": {
				const from = spikeAt(n);
				const to = trolleyAt(0);
				const p = lerp3(from, to, u);
				return [
					p[0],
					p[1],
					p[2] +
						bump(u, 22) +
						(L.spike.top + 1 - from[2]) *
							Math.sin(Math.PI * Math.min(u * 2, 1)) *
							0.5,
				];
			}
			case "roll":
				return trolleyAt(u);
			case "load": {
				const p = lerp3(
					trolleyAt(1),
					[clipAt[0], clipAt[1] + 3, clipAt[2] + 4],
					u,
				);
				return [p[0], p[1], p[2] + bump(u, 8)];
			}
			case "holder":
			case "rework":
				return clipAt;
			case "toPress":
				return lerp3(galleyAt, bedAt, u);
			case "bed":
				return bedAt;
			case "out":
				return lerp3(outFrom, outTo, u);
			case "up":
				return along("incline", 7 + (RUNS.incline.length - 14) * u);
			case "desk":
				return deskAt;
			case "back": {
				if (u < 0.12)
					return lerp3(
						[deskAt[0] - 6, deskAt[1] - 8, deskAt[2] + 3],
						along("chute", 7),
						u / 0.12,
					);
				return along(
					"chute",
					7 + (RUNS.chute.length - 14) * ((u - 0.12) / 0.88),
				);
			}
			case "hopper":
				return lerp3(
					along("chute", RUNS.chute.length - 7),
					[
						L.hopper.x + L.hopper.w / 2,
						L.hopper.y + L.hopper.d / 2,
						L.hopperH - 9,
					],
					u,
				);
			case "down": {
				if (u < 0.8)
					return along(
						"dockChute",
						7 + (RUNS.dockChute.length - 14) * (u / 0.8),
					);
				return lerp3(
					along("dockChute", RUNS.dockChute.length - 7),
					stackAt(n),
					(u - 0.8) / 0.2,
				);
			}
			case "stack":
				return stackAt(n);
			default:
				return bundleAt(n);
		}
	}

	// The wall clock: a 12-hour dial on the wall's front face, hands in that plane.
	const WALL_FACE = L.wall.y + L.wall.d;
	const CLOCK_Y = WALL_FACE + L.clock.depth + 0.15;
	const onClock = (angle, r) => [
		L.clock.x + Math.sin(angle) * r,
		CLOCK_Y,
		L.clock.z + Math.cos(angle) * r,
	];
	function handsOf(minuteOfDay) {
		const hour = ((minuteOfDay % 720) / 720) * TAU;
		const minute = ((minuteOfDay % 60) / 60) * TAU;
		const hub = onClock(0, 0);
		return {
			hour: k.pathOf([at(hub), at(onClock(hour, L.clock.r * 0.5))]),
			minute: k.pathOf([at(hub), at(onClock(minute, L.clock.r * 0.74))]),
		};
	}

	// The press cylinder's ribs and the flywheel's spokes turn with the model's `turns`.
	const CYL = G.frameOf(
		[L.cyl.x, L.cyl.y, L.cyl.z],
		[0, 1, 0],
		[0, 0, 1],
		[1, 0, 0],
	);
	const FLY = G.frameOf(
		[L.flywheel.x, L.flywheel.y, L.flywheel.z],
		[0, 1, 0],
		[0, 0, 1],
		[1, 0, 0],
	);
	const flyFace = L.flywheel.thick + 0.05;
	function cylinderRibs(turns) {
		return k.fadedSvg(
			G.ribsOf(CYL, -L.cyl.half + 1.2, L.cyl.half - 1.2, L.cyl.r, 18, P, {
				phase: turns * TAU,
				fade: [0.08, 0.5],
			}),
			{ tone: "lo" },
		);
	}
	function flywheelSpokes(turns) {
		return k.lineSvg(
			G.spokesOf(FLY, flyFace, 3, L.flywheel.r - 1.6, 6, P, {
				phase: turns * TAU * 0.5,
			}),
			{ tone: "mid" },
		);
	}
	// The spike's pin above whatever lies on it.
	function pinAbove(top) {
		return k.cylinder(
			L.spike.x,
			L.spike.y,
			L.spike.pinR,
			top,
			L.spike.top - top,
			P,
			12,
		);
	}

	return {
		poseOf,
		originOf,
		RUNS,
		runFrame,
		handsOf,
		cylinderRibs,
		flywheelSpokes,
		pinAbove,
		spikeAt,
		trolleyAt,
		galleyAt,
		bedAt,
		stackAt,
		bundleAt,
		clipAt,
		deskAt,
		tableTop,
		CYL,
		FLY,
		SPIKE_Z,
	};
}
