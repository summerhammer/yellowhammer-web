import {
	circleRing,
	extrude,
	type Flat,
	insetPlan,
	joinPaths,
	knurl,
	onTop,
	type Plan,
	type Plane,
	type Point3,
	pathOf,
	planOutline,
	radialTicks,
	ring,
	sideArc,
	sideSeam,
	slabOf,
} from "../../kit/iso/iso-kit";
import {
	ARM_H,
	ARM_Y1,
	ARM_Z,
	at,
	BACKLOG,
	BACKLOG_Z,
	BASE,
	BASE_H,
	BED,
	BED_H,
	CARD_H,
	CARD_HALF,
	CARRIAGE_H,
	CARRIAGE_HALF,
	CLOCK,
	CLOCK_STAND,
	COLUMN,
	DIAL_H,
	DIAL_R,
	DIAL_TOP,
	FOOT_H,
	GATE_W,
	GATE_X,
	HEAD_R,
	HEAD_Z,
	LABEL,
	LANE_Y,
	MAG_X,
	MAG_Z,
	P,
	POCKET_FLOOR,
	POCKET_W,
	POCKET_X,
	POST_H,
	RAIL_D,
	RAIL_H,
	RAIL_OFF,
	RAIL_TOP,
	RAIL_X0,
	RAIL_X1,
	REJECT,
	REJECT_FLOOR,
	SEAT_Z,
	SLOT_Y,
	SLOT_Z,
	STAND_H,
	STATIONS,
	STRIKER,
	STRIKER_H,
	STYLUS_Z,
} from "./view";

const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) =>
	slabOf(plan, z, h, P, steps, bevel);
const round = (
	cx: number,
	cy: number,
	r: number,
	z: number,
	h: number,
	steps = 32,
) => extrude(circleRing(cx, cy, r, steps), z, h, P, { convex: true });
const circle = (cx: number, cy: number, r: number, z: number, steps = 32) =>
	ring(cx, cy, r, z, P, steps);
const segment = (a: Point3, b: Point3) => pathOf([at(a), at(b)]);
const dot = (x: number, y: number, z: number): Flat => at([x, y, z]);
const join = (paths: string[]) => joinPaths(paths);
const rect = (cx: number, cy: number, hx: number, hy: number, r = 1): Plan => ({
	x: cx - hx,
	y: cy - hy,
	w: hx * 2,
	d: hy * 2,
	r,
});

// ── Base ────────────────────────────────────────────────────────────────
const FEET: Plane[] = [
	[BASE.x + 22, BASE.y + 20],
	[BASE.x + BASE.w - 22, BASE.y + 20],
	[BASE.x + 22, BASE.y + BASE.d - 20],
	[BASE.x + BASE.w - 22, BASE.y + BASE.d - 20],
];
const BASE_SCREWS: Plane[] = [
	[BASE.x + 9, BASE.y + 9],
	[BASE.x + BASE.w - 9, BASE.y + 9],
	[BASE.x + 9, BASE.y + BASE.d - 9],
	[BASE.x + BASE.w - 9, BASE.y + BASE.d - 9],
];

export const BASE_ART = {
	halo: solid(BASE, -BASE_H - FOOT_H, BASE_H, 8).fill,
	feet: FEET.map(([x, y]) => [
		round(x, y, 8, -BASE_H - FOOT_H, 1.6),
		round(x, y, 6.2, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6),
	]),
	slab: solid(BASE, -BASE_H, BASE_H, 8, 1.6),
	seam: sideSeam(BASE, -BASE_H + 3, P, 8),
	groove: planOutline(insetPlan(BASE, 5), 0, P, 8),
	screws: BASE_SCREWS.map(([x, y]) => dot(x, y, 0)),
	screwRings: join(BASE_SCREWS.map(([x, y]) => circle(x, y, 2.2, 0, 16))),
	plate: solid(LABEL, 0, 0.8, 4),
	plateLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
	plateScrews: [
		dot(LABEL.x + 3.6, LABEL.y + LABEL.d / 2, 0.8),
		dot(LABEL.x + LABEL.w - 3.6, LABEL.y + LABEL.d / 2, 0.8),
	],
	plateRule: join(
		[0, 1, 2].map((row) =>
			onTop(
				[
					[LABEL.x + 8, LABEL.y + 4 + row * 2.6],
					[LABEL.x + [34, 26, 38][row], LABEL.y + 4 + row * 2.6],
				],
				0.8,
				P,
			),
		),
	),
};

// ── Orca's lane bed: one plate, three Repo Lanes on rails ───────────────
const BED_SCREWS: Plane[] = [
	[BED.x + 5, BED.y + 5],
	[BED.x + BED.w - 5, BED.y + 5],
	[BED.x + 5, BED.y + BED.d - 5],
	[BED.x + BED.w - 5, BED.y + BED.d - 5],
];

export const BED_ART = {
	slab: solid(BED, 0, BED_H, 4, 0.8),
	seam: sideSeam(BED, 1.6, P, 4),
	screws: BED_SCREWS.map(([x, y]) => dot(x, y, BED_H)),
};

export interface LaneArt {
	track: string;
	rails: ReturnType<typeof solid>[];
	stops: ReturnType<typeof solid>[];
	stopScrews: Flat[];
	tag: {
		plate: ReturnType<typeof solid>;
		line: string;
		rule: string;
		screws: Flat[];
	};
	magazine: {
		floor: ReturnType<typeof solid>;
		back: ReturnType<typeof solid>;
		end: ReturnType<typeof solid>;
		screws: Flat[];
		floorLine: string;
	};
	carriage: {
		halo: string;
		plate: ReturnType<typeof solid>;
		seat: string;
		clips: ReturnType<typeof solid>[];
		screws: Flat[];
		rivets: Flat[];
		attempts: Flat[];
		rounds: Flat[];
		pipRings: string;
	};
	card: {
		body: ReturnType<typeof extrude>;
		rules: string;
		holes: Flat[];
		holeRings: string;
	};
	gate: {
		back: ReturnType<typeof solid>;
		front: ReturnType<typeof solid>;
		caps: ReturnType<typeof solid>[];
		capScrews: Flat[];
		bar: ReturnType<typeof solid>;
		barLine: string;
		slots: string;
	};
	pocket: {
		floor: ReturnType<typeof solid>;
		floorLine: string;
		fence: ReturnType<typeof solid>;
		stop: ReturnType<typeof solid>;
		stopScrews: Flat[];
		post: ReturnType<typeof round>;
		postCap: ReturnType<typeof round>;
		flag: ReturnType<typeof solid>;
		flagLine: string;
	};
}

function cardRing(cx: number, cy: number, z: number) {
	const [hx, hy] = CARD_HALF;
	const cut = 3.2;
	const ringPoints: Plane[] = [
		[cx - hx, cy - hy],
		[cx + hx, cy - hy],
		[cx + hx, cy + hy],
		[cx - hx + cut, cy + hy],
		[cx - hx, cy + hy - cut],
	];
	return extrude(ringPoints, z, CARD_H, P, { convex: true });
}

function laneArt(ly: number): LaneArt {
	const rails = RAIL_OFF.map((off) => ({
		x: RAIL_X0,
		y: ly + off,
		w: RAIL_X1 - RAIL_X0,
		d: RAIL_D,
		r: 0.8,
	}));
	const stops = rails.flatMap((rail) => [
		{ x: RAIL_X0 - 4, y: rail.y - 0.8, w: 4, d: RAIL_D + 1.6, r: 0.6 },
		{ x: RAIL_X1, y: rail.y - 0.8, w: 4, d: RAIL_D + 1.6, r: 0.6 },
	]);
	const [chx, chy] = CARRIAGE_HALF;
	const home = STATIONS.home;
	const carriagePlan = rect(home, ly, chx, chy, 2);
	const seat = rect(home, ly, CARD_HALF[0] + 0.8, CARD_HALF[1] + 0.8, 1);
	const clipPlans = [-1, 1].map((side) =>
		rect(home, ly + side * (CARD_HALF[1] + 1.8), 5, 1, 0.5),
	);
	const magFloor = rect(MAG_X, ly, CARD_HALF[0] + 3, CARD_HALF[1] + 3, 1.5);
	const magBack: Plan = {
		x: magFloor.x,
		y: magFloor.y,
		w: magFloor.w,
		d: 2,
		r: 0.6,
	};
	const magEnd: Plan = {
		x: magFloor.x,
		y: magFloor.y + 2,
		w: 2,
		d: magFloor.d - 2,
		r: 0.6,
	};
	const gateBack: Plan = { x: GATE_X, y: ly - 15, w: GATE_W, d: 3, r: 0.6 };
	const gateFront: Plan = { x: GATE_X, y: ly + 12, w: GATE_W, d: 3, r: 0.6 };
	const bar: Plan = { x: GATE_X, y: ly - 12, w: GATE_W, d: 24, r: 0.6 };
	const barZ = RAIL_TOP + 0.6;
	const pocketFloor: Plan = {
		x: POCKET_X,
		y: ly - 11,
		w: POCKET_W,
		d: 22,
		r: 1.5,
	};
	const fence: Plan = {
		x: POCKET_X,
		y: ly - 11,
		w: POCKET_W - 2.5,
		d: 2,
		r: 0.6,
	};
	const stop: Plan = {
		x: POCKET_X + POCKET_W - 2.5,
		y: ly - 11,
		w: 2.5,
		d: 22,
		r: 0.6,
	};
	const stopTop = POCKET_FLOOR + 9;
	const postX = stop.x + 1.25;
	const postY = ly + 7;
	const flag: Plan = { x: postX - 0.5, y: postY - 9.1, w: 1, d: 8.2, r: 0.3 };
	const floorTop = BED_H + 2;
	const cardZ = MAG_Z;
	const [hx, hy] = CARD_HALF;
	return {
		track: planOutline(
			rect((RAIL_X0 + RAIL_X1) / 2, ly, (RAIL_X1 - RAIL_X0) / 2 + 6, 13.5, 2),
			BED_H,
			P,
			4,
		),
		rails: rails.map((plan) => solid(plan, BED_H, RAIL_H, 3, 0.4)),
		stops: stops.map((plan) => solid(plan, BED_H, RAIL_H + 1.4, 3, 0.4)),
		stopScrews: stops.map((plan) =>
			dot(plan.x + plan.w / 2, plan.y + plan.d / 2, BED_H + RAIL_H + 1.4),
		),
		tag: (() => {
			const plan: Plan = { x: MAG_X - 15, y: ly + 14.5, w: 24, d: 5, r: 1 };
			return {
				plate: solid(plan, BED_H, 0.7, 3),
				line: planOutline(insetPlan(plan, 1), BED_H + 0.7, P, 3),
				rule: join(
					[0, 1].map((row) =>
						onTop(
							[
								[plan.x + 5, plan.y + 1.9 + row * 1.4],
								[plan.x + [17, 12][row], plan.y + 1.9 + row * 1.4],
							],
							BED_H + 0.7,
							P,
						),
					),
				),
				screws: [
					dot(plan.x + 2.4, plan.y + plan.d / 2, BED_H + 0.7),
					dot(plan.x + plan.w - 2.4, plan.y + plan.d / 2, BED_H + 0.7),
				],
			};
		})(),
		magazine: {
			floor: solid(magFloor, BED_H, 2, 4, 0.5),
			floorLine: planOutline(insetPlan(magFloor, 4.2), floorTop, P, 3),
			back: solid(magBack, floorTop, 8, 3, 0.4),
			end: solid(magEnd, floorTop, 8, 3, 0.4),
			screws: [
				dot(
					magFloor.x + magFloor.w - 2.4,
					magFloor.y + magFloor.d - 1.6,
					floorTop,
				),
				dot(magFloor.x + magFloor.w - 2.4, magFloor.y + 3.6, floorTop),
			],
		},
		carriage: {
			halo: solid(insetPlan(carriagePlan, 2), RAIL_TOP, 0.1).fill,
			plate: solid(carriagePlan, RAIL_TOP, CARRIAGE_H, 4, 0.6),
			seat: planOutline(seat, SEAT_Z, P, 3),
			clips: clipPlans.map((plan) => solid(plan, SEAT_Z, 2.2, 3, 0.3)),
			screws: [-1, 1].flatMap((sx) =>
				[-1, 1].map((sy) =>
					dot(home + sx * (chx - 2.4), ly + sy * (chy - 2.2), SEAT_Z),
				),
			),
			rivets: [-8, -4, 0, 4, 8].map((dx) =>
				at([home + dx, ly + chy, SEAT_Z - 1.6]),
			),
			// Both counters sit on the near end, where the raised card can't hide them.
			attempts: [-6.2, -3.8, -1.4].map((dy) =>
				dot(home + chx - 1.5, ly + dy, SEAT_Z),
			),
			rounds: [2.6, 5].map((dy) => dot(home + chx - 1.5, ly + dy, SEAT_Z)),
			pipRings: join(
				[-6.2, -3.8, -1.4, 2.6, 5].map((dy) =>
					circle(home + chx - 1.5, ly + dy, 0.9, SEAT_Z, 12),
				),
			),
		},
		card: {
			body: cardRing(MAG_X, ly, cardZ),
			rules: join(
				[0, 1, 2].map((row) =>
					onTop(
						[
							[MAG_X - hx + 4, ly - hy + 3 + row * 2.2],
							[MAG_X - hx + [16, 11, 19][row], ly - hy + 3 + row * 2.2],
						],
						cardZ + CARD_H,
						P,
					),
				),
			),
			holes: [0, 1, 2, 3, 4, 5, 6, 7].map((k) =>
				dot(
					MAG_X - 2 + k * 1.9,
					ly + hy - 2.6 - ((k * 5) % 3) * 1.2,
					cardZ + CARD_H,
				),
			),
			// Where the agent will punch: faint rings, filled one by one as the work goes.
			holeRings: join(
				[0, 1, 2, 3, 4, 5, 6, 7].map((k) =>
					circle(
						MAG_X - 2 + k * 1.9,
						ly + hy - 2.6 - ((k * 5) % 3) * 1.2,
						0.62,
						cardZ + CARD_H,
						10,
					),
				),
			),
		},
		gate: {
			back: solid(gateBack, BED_H, POST_H, 3, 0.4),
			front: solid(gateFront, BED_H, POST_H, 3, 0.4),
			caps: [gateBack, gateFront].map((plan) =>
				solid(insetPlan(plan, -0.8), BED_H + POST_H, 1.6, 3, 0.3),
			),
			capScrews: [gateBack, gateFront].map((plan) =>
				dot(plan.x + plan.w / 2, plan.y + plan.d / 2, BED_H + POST_H + 1.6),
			),
			bar: solid(bar, barZ, 3, 3, 0.4),
			barLine: sideSeam(bar, barZ + 1.5, P, 3),
			slots: join(
				[gateBack, gateFront].map((plan) =>
					segment(
						[plan.x + plan.w, plan.y + plan.d / 2, BED_H + 2.5],
						[plan.x + plan.w, plan.y + plan.d / 2, BED_H + POST_H - 2.5],
					),
				),
			),
		},
		pocket: {
			floor: solid(pocketFloor, BED_H, 2, 4, 0.5),
			floorLine: planOutline(
				rect(POCKET_X + POCKET_W / 2 - 1.5, ly, hx + 1.4, hy + 1.4, 1),
				floorTop,
				P,
				3,
			),
			fence: solid(fence, floorTop, 5, 3, 0.4),
			stop: solid(stop, floorTop, stopTop - floorTop, 3, 0.4),
			stopScrews: [
				dot(stop.x + 1.25, ly - 7, stopTop),
				dot(stop.x + 1.25, ly + 1, stopTop),
			],
			post: round(postX, postY, 0.9, stopTop, 16, 14),
			postCap: round(postX, postY, 1.4, stopTop + 16, 1.2, 14),
			flag: solid(flag, stopTop + 1.2, 5, 2),
			flagLine: segment(
				[flag.x + flag.w, flag.y + 1.4, stopTop + 3.7],
				[flag.x + flag.w, flag.y + flag.d, stopTop + 3.7],
			),
		},
	};
}

export const LANE_ART = LANE_Y.map(laneArt);

// ── Reject tray for a Blocked Work Card, in front of the front lane ─────
const rejectInner = insetPlan(REJECT, 1.5);
// ── Backlog: tonight's issues from Linear, waiting in a tray left of the bed ──
export const BACKLOG_ART = {
	floor: solid(BACKLOG, 0, BACKLOG_Z, 4, 0.5),
	floorLine: planOutline(insetPlan(BACKLOG, 3.4), BACKLOG_Z, P, 3),
	back: solid(
		{ x: BACKLOG.x, y: BACKLOG.y, w: BACKLOG.w, d: 2, r: 0.6 },
		BACKLOG_Z,
		12,
		3,
		0.4,
	),
	end: solid(
		{ x: BACKLOG.x, y: BACKLOG.y + 2, w: 2, d: BACKLOG.d - 2, r: 0.6 },
		BACKLOG_Z,
		12,
		3,
		0.4,
	),
	screws: [
		dot(BACKLOG.x + BACKLOG.w - 2.2, BACKLOG.y + 3.4, BACKLOG_Z),
		dot(BACKLOG.x + BACKLOG.w - 2.2, BACKLOG.y + BACKLOG.d - 2.2, BACKLOG_Z),
	],
	fenceScrews: [
		dot(BACKLOG.x + 6, BACKLOG.y + 1, BACKLOG_Z + 12),
		dot(BACKLOG.x + BACKLOG.w - 4, BACKLOG.y + 1, BACKLOG_Z + 12),
	],
};

export const REJECT_ART = {
	floor: solid(REJECT, 0, REJECT_FLOOR, 4, 0.5),
	floorLine: planOutline(insetPlan(REJECT, 4), REJECT_FLOOR, P, 3),
	back: solid(
		{ x: REJECT.x, y: REJECT.y, w: REJECT.w, d: 1.5, r: 0.5 },
		REJECT_FLOOR,
		4,
		3,
		0.3,
	),
	left: solid(
		{ x: REJECT.x, y: rejectInner.y, w: 1.5, d: rejectInner.d, r: 0.5 },
		REJECT_FLOOR,
		4,
		3,
		0.3,
	),
	right: solid(
		{
			x: REJECT.x + REJECT.w - 1.5,
			y: rejectInner.y,
			w: 1.5,
			d: rejectInner.d,
			r: 0.5,
		},
		REJECT_FLOOR,
		4,
		3,
		0.3,
	),
	front: solid(
		{ x: REJECT.x, y: REJECT.y + REJECT.d - 1.5, w: REJECT.w, d: 1.5, r: 0.5 },
		REJECT_FLOOR,
		4,
		3,
		0.3,
	),
	screws: [
		dot(REJECT.x + 0.75, REJECT.y + 0.75, REJECT_FLOOR + 4),
		dot(REJECT.x + REJECT.w - 0.75, REJECT.y + 0.75, REJECT_FLOOR + 4),
	],
};

// ── Gantry: a column behind the bed and an arm carrying one agent head per lane ──
const FOOT: Plan = insetPlan(COLUMN, -4);
const ARM: Plan = { x: -5, y: COLUMN.y, w: 10, d: ARM_Y1 - COLUMN.y, r: 1.5 };

export const GANTRY_ART = {
	foot: solid(FOOT, 0, 2, 4, 0.5),
	footScrews: [
		dot(FOOT.x + 2, FOOT.y + 2, 2),
		dot(FOOT.x + FOOT.w - 2, FOOT.y + 2, 2),
		dot(FOOT.x + 2, FOOT.y + FOOT.d - 2, 2),
		dot(FOOT.x + FOOT.w - 2, FOOT.y + FOOT.d - 2, 2),
	],
	column: solid(COLUMN, 2, ARM_Z - 2, 4, 0.6),
	columnSeams: join([12, 26].map((z) => sideSeam(COLUMN, z, P, 4))),
	arm: solid(ARM, ARM_Z, ARM_H, 4, 0.6),
	armSeam: sideSeam(ARM, ARM_Z + 2.4, P, 4),
	armScrews: [COLUMN.y + 6, ...LANE_Y.flatMap((y) => [y - 9, y + 9])].map((y) =>
		dot(0, y, ARM_Z + ARM_H),
	),
	armCap: solid(
		{ x: -5.6, y: ARM_Y1 - 1.2, w: 11.2, d: 2.4, r: 0.8 },
		ARM_Z - 0.6,
		ARM_H + 1.2,
		3,
		0.3,
	),
};

export const HEAD_ART = LANE_Y.map((ly) => ({
	stylusClip: round(0, ly, 3, STYLUS_Z - 6, HEAD_Z - STYLUS_Z + 6, 24).fill,
	stylus: round(0, ly, 1.2, STYLUS_Z + 1.2, HEAD_Z - STYLUS_Z - 1.2 + 2, 16),
	stylusMarks: join(
		[4, 6].map((rise) => sideArc(0, ly, 1.2, STYLUS_Z + 1.2 + rise, P, 10)),
	),
	pad: round(0, ly, 2.4, STYLUS_Z, 1.2, 20),
	collar: round(0, ly, HEAD_R + 0.9, HEAD_Z, 2, 32),
	housing: round(0, ly, HEAD_R, HEAD_Z + 2, ARM_Z - HEAD_Z - 4.4, 32),
	knurl: knurl(0, ly, HEAD_R, HEAD_Z + 6, HEAD_Z + 11, 22, P),
	seams: join(
		[HEAD_Z + 6, HEAD_Z + 11].map((z) => sideArc(0, ly, HEAD_R, z, P, 24)),
	),
	cap: round(0, ly, HEAD_R + 0.9, ARM_Z - 2.4, 2.4, 32),
	lamp: round(
		HEAD_R * Math.cos((57 * Math.PI) / 180) * 0.2 + 3.3,
		ly + 4.4,
		0.9,
		HEAD_Z + 13.4,
		0.8,
		12,
	),
}));

// ── Time clock: a 24-hour dial on a stand, the launchd striker beside it ──
const [CX, CY] = CLOCK;
const DEG = Math.PI / 180;
/** Midnight points at the viewer, so the Night's sector faces us. */
export const MIDNIGHT = 147 * DEG;
export const angleOf = (minutesOfDay: number) =>
	MIDNIGHT + (minutesOfDay / 1440) * Math.PI * 2;
const onDial = (angle: number, r: number): Plane => [
	CX + Math.sin(angle) * r,
	CY - Math.cos(angle) * r,
];
const TICK_R = DIAL_R - 2.6;
const ticks = radialTicks(
	CX,
	CY,
	TICK_R,
	96,
	4,
	DIAL_TOP,
	[1.3, 2.8],
	P,
	MIDNIGHT,
);

function sector(a0: number, a1: number, r0: number, r1: number) {
	const points: Plane[] = [];
	const steps = 28;
	for (let k = 0; k <= steps; k++)
		points.push(onDial(a0 + ((a1 - a0) * k) / steps, r1));
	for (let k = steps; k >= 0; k--)
		points.push(onDial(a0 + ((a1 - a0) * k) / steps, r0));
	return points;
}

const NIGHT_BAND = sector(
	angleOf(22 * 60),
	angleOf(30 * 60),
	TICK_R - 6.2,
	TICK_R - 3.6,
);
const STAND_TOP = STAND_H;
const SLOT_HALF = CARD_HALF[0] + 1.6;

export const CLOCK_ART = {
	stand: solid(CLOCK_STAND, 0, STAND_H, 5, 0.8),
	standSeam: sideSeam(CLOCK_STAND, 7.2, P, 5),
	standScrews: [
		dot(CLOCK_STAND.x + 3.4, CLOCK_STAND.y + 3.4, STAND_TOP),
		dot(CLOCK_STAND.x + CLOCK_STAND.w - 3.4, CLOCK_STAND.y + 3.4, STAND_TOP),
		dot(CLOCK_STAND.x + 3.4, CLOCK_STAND.y + CLOCK_STAND.d - 3.4, STAND_TOP),
		dot(
			CLOCK_STAND.x + CLOCK_STAND.w - 3.4,
			CLOCK_STAND.y + CLOCK_STAND.d - 3.4,
			STAND_TOP,
		),
	],
	slot: pathOf(
		[
			[CX - SLOT_HALF, SLOT_Z - 0.7],
			[CX + SLOT_HALF, SLOT_Z - 0.7],
			[CX + SLOT_HALF, SLOT_Z + CARD_H + 0.7],
			[CX - SLOT_HALF, SLOT_Z + CARD_H + 0.7],
		].map(([x, z]) => at([x, SLOT_Y, z])),
		true,
	),
	puck: round(CX, CY, DIAL_R, STAND_TOP, DIAL_H, 64),
	knurl: knurl(CX, CY, DIAL_R, STAND_TOP + 0.4, STAND_TOP + 2.6, 64, P),
	band: sideArc(CX, CY, DIAL_R, STAND_TOP + 2.6, P, 40),
	bezel: circle(CX, CY, DIAL_R - 1, DIAL_TOP, 64),
	face: circle(CX, CY, TICK_R + 0.2, DIAL_TOP, 64),
	night: extrude(NIGHT_BAND, DIAL_TOP, 0.25, P, { convex: false }),
	minor: ticks.minor,
	major: ticks.major,
	hub: round(CX, CY, 1.6, DIAL_TOP, 0.9, 16),
	crown: solid(
		{ x: CX - 2.4, y: CY - DIAL_R - 3.6, w: 4.8, d: 4.2, r: 1 },
		STAND_TOP + 0.8,
		3.4,
		3,
	),
	crownCap: round(CX, CY - DIAL_R - 4.6, 2.4, STAND_TOP + 0.4, 4.2, 18),
	crownKnurl: knurl(
		CX,
		CY - DIAL_R - 4.6,
		2.4,
		STAND_TOP + 0.4,
		STAND_TOP + 4.6,
		14,
		P,
	),
};

export const STRIKER_X = STRIKER.x + STRIKER.w / 2;
export const STRIKER_Y = STRIKER.y + STRIKER.d / 2;

export const STRIKER_ART = {
	housing: solid(STRIKER, 0, STRIKER_H, 3, 0.6),
	seam: sideSeam(STRIKER, 4, P, 3),
	screws: [
		dot(STRIKER.x + 2.4, STRIKER.y + 2.4, STRIKER_H),
		dot(STRIKER.x + STRIKER.w - 2.4, STRIKER.y + STRIKER.d - 2.4, STRIKER_H),
	],
	seal: circle(STRIKER_X, STRIKER_Y, 2.4, STRIKER_H, 18),
	// What shows above the housing: the rod from the top face, the cap from where it can sink to.
	clip: [
		round(STRIKER_X, STRIKER_Y, 1.55, STRIKER_H, 30, 20).fill,
		round(STRIKER_X, STRIKER_Y, 2.85, STRIKER_H + 2.5, 30, 20).fill,
	],
	rod: round(STRIKER_X, STRIKER_Y, 1.5, STRIKER_H - 6, 9, 16),
	cap: round(STRIKER_X, STRIKER_Y, 2.8, STRIKER_H + 3, 1.6, 20),
};

// The Night Card, printed at night_end, comes out of the slot in the stand.
const NIGHT_CARD_Y = SLOT_Y - CARD_HALF[1] - 1;
export const NIGHT_CARD_ART = {
	clip: solid(
		{ x: CX - SLOT_HALF - 4, y: SLOT_Y, w: (SLOT_HALF + 4) * 2, d: 40, r: 0 },
		SLOT_Z - 0.2,
		CARD_H + 0.4,
		1,
	).fill,
	body: extrude(
		[
			[CX - CARD_HALF[0], NIGHT_CARD_Y - CARD_HALF[1]],
			[CX + CARD_HALF[0], NIGHT_CARD_Y - CARD_HALF[1]],
			[CX + CARD_HALF[0], NIGHT_CARD_Y + CARD_HALF[1]],
			[CX - CARD_HALF[0] + 3.2, NIGHT_CARD_Y + CARD_HALF[1]],
			[CX - CARD_HALF[0], NIGHT_CARD_Y + CARD_HALF[1] - 3.2],
		],
		SLOT_Z,
		CARD_H,
		P,
		{ convex: true },
	),
	rules: join(
		[0, 1, 2, 3].map((row) =>
			onTop(
				[
					[CX - CARD_HALF[0] + 4, NIGHT_CARD_Y - 2 + row * 2.2],
					[
						CX - CARD_HALF[0] + [20, 14, 17, 9][row],
						NIGHT_CARD_Y - 2 + row * 2.2,
					],
				],
				SLOT_Z + CARD_H,
				P,
			),
		),
	),
};

/** The needle, rebuilt each frame from the time of day. */
export function needleOf(minutesOfDay: number) {
	const angle = angleOf(minutesOfDay);
	const tip = onDial(angle, TICK_R - 0.6);
	const tail = onDial(angle + Math.PI, 3.6);
	return {
		body: pathOf([
			at([tip[0], tip[1], DIAL_TOP + 1]),
			at([CX, CY, DIAL_TOP + 1]),
		]),
		tail: pathOf([
			at([CX, CY, DIAL_TOP + 1]),
			at([tail[0], tail[1], DIAL_TOP + 1]),
		]),
	};
}
