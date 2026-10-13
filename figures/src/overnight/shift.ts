// The Night, as a pure function of time. Every number the figure shows and every
// move it makes is read from here. Times are minutes after `night_start`.
//
// Spec defaults (G-7, G-13, G-16): night_start 22:00, night_end 06:00,
// build_every_minutes 15 (land on the tick, build one minute after it),
// review_rounds_max 2, attempts_per_work_card 3.

export const NIGHT_START = 22 * 60;
export const NIGHT = 8 * 60;
export const EVERY = 15;
export const ROUNDS_MAX = 2;
export const ATTEMPTS_MAX = 3;

/** Land ticks inside the window, then the Night-closing land at night_end. */
export const LAND_TICKS = Array.from(
	{ length: NIGHT / EVERY - 1 },
	(_, index) => (index + 1) * EVERY,
);
/** Build firings: one minute after each land tick. */
export const BUILD_FIRINGS = LAND_TICKS.map((tick) => tick + 1);
export const BUILDS = BUILD_FIRINGS.length;

/** Every moment `launchd` fires an Act: author, the ticks, the closing land. */
export const FIRINGS = [
	0,
	...LAND_TICKS.flatMap((tick) => [tick, tick + 1]),
	NIGHT,
];

// Minutes of night the machine takes to do each physical thing.
/** The author Act deals the Work Cards from the backlog into their lanes before the first build. */
const DEAL_GAP = 1.6;
const DEAL_TIME = 3.4;
const DEAL_END = 13;
const HOP = 3;
const RUN = 7;
const JUDGE = 5;
const BACK = 5;
const SLIDE = 3;
const HOME = 8;
const LIFT = 2;

export type Verdict = "pass" | "review" | "check";

export interface AttemptPlan {
	work: number;
	/** One verdict per Round; anything but "pass" asks for `rework` minutes. */
	rounds: Verdict[];
	rework?: number;
}

export interface CardPlan {
	id: string;
	attempts: AttemptPlan[];
}

/** One Feature, three Repo Lanes. The front lane carries the card that Blocks. */
export const LANES: CardPlan[][] = [
	[
		{ id: "A1", attempts: [{ work: 62, rounds: ["pass"] }] },
		{
			id: "A2",
			attempts: [{ work: 48, rounds: ["review", "pass"], rework: 22 }],
		},
	],
	[
		{
			id: "B1",
			attempts: [{ work: 96, rounds: ["check", "pass"], rework: 28 }],
		},
	],
	[
		{ id: "C1", attempts: [{ work: 34, rounds: ["pass"] }] },
		{
			id: "C2",
			attempts: [
				{ work: 22, rounds: ["review", "review"], rework: 12 },
				{ work: 20, rounds: ["check", "check"], rework: 10 },
				{ work: 18, rounds: ["review", "review"], rework: 10 },
			],
		},
		{ id: "C3", attempts: [{ work: 30, rounds: ["pass"] }] },
	],
];

export const CARD_COUNT = LANES.reduce((sum, lane) => sum + lane.length, 0);

/**
 * The order the author Act deals the backlog: round the lanes, each lane's bottom card first,
 * so every magazine ends with its first card on top. DEALT[lane][card] is the deal number.
 */
export const DEALT: number[][] = (() => {
	const left = LANES.map((lane) => lane.map((_, index) => index).reverse());
	const order: number[][] = LANES.map(() => []);
	let next = 0;
	while (left.some((queue) => queue.length))
		left.forEach((queue, lane) => {
			const card = queue.shift();
			if (card !== undefined) order[lane][card] = next++;
		});
	return order;
})();

/** Where the carriage stands along its lane. */
export type Station = "home" | "head" | "gate" | "pocket";

/** A piece of a lane's timeline. Positions are stations; moves ease between them. */
export interface Leg {
	from: number;
	to: number;
	kind: "wait" | "hop" | "move" | "work" | "judge" | "slide" | "reject";
	card: number;
	at: Station;
	toward?: Station;
	attempt: number;
	round: number;
	verdict?: Verdict;
}

export interface CardFate {
	dispatched: number;
	done: number;
	/** When the card came to rest in its pocket, or in the reject tray. */
	settled: number;
	outcome: "landed" | "blocked";
	attempts: number;
	rounds: number;
}

export interface LanePlan {
	legs: Leg[];
	fates: CardFate[];
	free: number;
}

const nextBuild = (after: number) =>
	BUILD_FIRINGS.find((firing) => firing >= after) ?? Number.POSITIVE_INFINITY;

function planLane(cards: CardPlan[]): LanePlan {
	const legs: Leg[] = [];
	const fates: CardFate[] = [];
	let now = DEAL_END;
	const push = (
		kind: Leg["kind"],
		length: number,
		card: number,
		at: Station,
		attempt: number,
		round: number,
		extra: Partial<Leg> = {},
	) => {
		legs.push({
			from: now,
			to: now + length,
			kind,
			card,
			at,
			attempt,
			round,
			...extra,
		});
		now += length;
	};
	cards.forEach((card, index) => {
		let rounds = 0;
		let dispatched = 0;
		let outcome: CardFate["outcome"] = "blocked";
		let settled = 0;
		for (
			let attempt = 0;
			attempt < card.attempts.length && attempt < ATTEMPTS_MAX;
			attempt++
		) {
			const plan = card.attempts[attempt];
			const firing = nextBuild(now);
			push("wait", firing - now, index, "home", attempt, 0);
			if (attempt === 0) {
				dispatched = now;
				push("hop", HOP, index, "home", attempt, 0);
			}
			push("move", RUN, index, "home", attempt, 0, { toward: "head" });
			push("work", plan.work, index, "head", attempt, 0);
			let passed = false;
			for (
				let round = 0;
				round < ROUNDS_MAX && round < plan.rounds.length;
				round++
			) {
				const verdict = plan.rounds[round];
				rounds += 1;
				push("move", RUN, index, "head", attempt, round, { toward: "gate" });
				push("judge", JUDGE, index, "gate", attempt, round + 1, { verdict });
				if (verdict === "pass") {
					passed = true;
					break;
				}
				if (round + 1 < ROUNDS_MAX) {
					push("move", BACK, index, "gate", attempt, round + 1, {
						toward: "head",
					});
					push("work", plan.rework ?? 10, index, "head", attempt, round + 1);
				}
			}
			if (passed) {
				push("move", RUN, index, "gate", attempt, 0, {
					toward: "pocket",
					verdict: "pass",
				});
				push("slide", SLIDE, index, "pocket", attempt, 0);
				settled = now;
				push("move", HOME, index, "pocket", attempt, 0, { toward: "home" });
				outcome = "landed";
				break;
			}
			if (attempt + 1 >= Math.min(card.attempts.length, ATTEMPTS_MAX)) {
				push("reject", LIFT + SLIDE, index, "gate", attempt, 0);
				settled = now;
				push("move", HOME, index, "gate", attempt, 0, { toward: "home" });
			} else {
				push("move", HOME, index, "gate", attempt + 1, 0, { toward: "home" });
			}
		}
		fates.push({
			dispatched,
			done: now,
			settled,
			outcome,
			attempts: Math.min(card.attempts.length, ATTEMPTS_MAX),
			rounds,
		});
	});
	return { legs, fates, free: now };
}

export const PLANS = LANES.map(planLane);

/** Land fires on the first land tick after the Cycle has no unfinished Work Card. */
export const CYCLE_DONE = Math.max(...PLANS.map((plan) => plan.free));
export const LANDED = LAND_TICKS.find((tick) => tick >= CYCLE_DONE) ?? NIGHT;
export const BLOCKED = PLANS.reduce(
	(sum, plan) =>
		sum + plan.fates.filter((fate) => fate.outcome === "blocked").length,
	0,
);
export const REVIEWED = CARD_COUNT - BLOCKED;
export const PULL_REQUESTS = LANES.length;
export const ROUNDS_TOTAL = PLANS.reduce(
	(sum, plan) =>
		sum + plan.fates.reduce((inner, fate) => inner + fate.rounds, 0),
	0,
);

// The span the figure shows: a little of the evening before, a little of the morning after.
export const T_FIRST = -15;
export const T_LAST = NIGHT + 60;

export const clock = (t: number) => {
	const minutes = (((NIGHT_START + Math.round(t)) % 1440) + 1440) % 1440;
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

const clamp = (value: number, low: number, high: number) =>
	Math.min(high, Math.max(low, value));
export const smooth = (value: number) => {
	const u = clamp(value, 0, 1);
	return u * u * (3 - 2 * u);
};

/** Distance along a lane, in world units, for each station. Set by the view. */
export type Stations = Record<Station, number>;

export interface CardPose {
	/** Which holder the card is in: drives its painter's slot. */
	holder:
		| "backlog"
		| "deal"
		| "drop"
		| "magazine"
		| "hop"
		| "carriage"
		| "slide"
		| "pocket"
		| "fly"
		| "reject";
	/** World offset from the card's rest spot in the magazine. */
	dx: number;
	dy: number;
	dz: number;
	/** 0..1: the card's opacity (only the day between Nights changes it). */
	shown: number;
	/** 0..1: how much of the current Attempt's work the agent has done: the punched holes. */
	punched: number;
}

export interface LanePose {
	carriage: number;
	/** 0..1: the agent head is working; its stylus bobs. */
	working: number;
	/** 0..1: the review gate bar is raised. */
	gate: number;
	/** 0..1: the gate is judging (a Round in progress). */
	judging: number;
	/** 0..1: the PR flag is up. */
	flag: number;
	cards: CardPose[];
	attempt: number;
	round: number;
	active: number;
}

export interface NightPose {
	t: number;
	lanes: LanePose[];
	/** 0..1: the striker's lift, a decaying pop at each firing. */
	strike: number;
	/** 0..1: the Night Card out of its slot. */
	nightCard: number;
}

/** Geometry the model needs to place cards: set once by the view. */
export interface Layout {
	stations: Stations;
	/** Offset from the magazine to the carriage seat, and the stack pitch. */
	seat: number;
	pitch: number;
	/** The card's height above the magazine floor when it rests on the carriage. */
	seatRise: number;
	/** Offsets of the k-th card in the pocket and the reject tray. */
	pocket: (k: number) => [number, number, number];
	reject: (k: number) => [number, number, number];
	/** Offset from a lane's magazine spot to the d-th card of the backlog stack (0 = top). */
	backlog: (lane: number, d: number) => [number, number, number];
	/** Height above its magazine from which a dealt card drops straight in. */
	above: number;
}

function legAt(legs: Leg[], t: number) {
	for (const leg of legs) if (t >= leg.from && t < leg.to) return leg;
	return null;
}

function stationAt(plan: LanePlan, t: number, S: Stations) {
	const leg = legAt(plan.legs, t);
	if (!leg) return S.home;
	if (leg.kind === "move" && leg.toward)
		return (
			S[leg.at] +
			(S[leg.toward] - S[leg.at]) * smooth((t - leg.from) / (leg.to - leg.from))
		);
	return S[leg.at];
}

/** How much of the card's current Attempt has been worked: 0 at dispatch, 1 once it passes. */
function punchedOf(plan: LanePlan, index: number, t: number) {
	const mine = plan.legs.filter((leg) => leg.card === index && leg.from <= t);
	const last = mine.at(-1);
	if (!last) return 0;
	if (mine.some((leg) => leg.kind === "slide")) return 1;
	const work = plan.legs.filter(
		(leg) =>
			leg.card === index && leg.kind === "work" && leg.attempt === last.attempt,
	);
	const total = work.reduce((sum, leg) => sum + (leg.to - leg.from), 0);
	const done = work.reduce(
		(sum, leg) => sum + clamp(t - leg.from, 0, leg.to - leg.from),
		0,
	);
	return total ? done / total : 0;
}

export function backlogPose(
	lane: number,
	index: number,
	layout: Layout,
): CardPose {
	const [dx, dy, dz] = layout.backlog(lane, DEALT[lane][index]);
	return { holder: "backlog", dx, dy, dz, shown: 1, punched: 0 };
}

function cardPose(
	lane: number,
	plan: LanePlan,
	index: number,
	total: number,
	t: number,
	layout: Layout,
	carriage: number,
	landedBefore: number[],
	blockedBefore: number[],
): CardPose {
	const S = layout.stations;
	const stackZ = (total - 1 - index) * layout.pitch;
	const lift = (u: number) => Math.sin(Math.PI * u) * 6;
	const punched = punchedOf(plan, index, t);
	// Before the author Act the card waits in the backlog; then it is dealt to its lane.
	const dealt = DEALT[lane][index] * DEAL_GAP;
	if (t < dealt) return backlogPose(lane, index, layout);
	if (t < dealt + DEAL_TIME) {
		const u = (t - dealt) / DEAL_TIME;
		const [bx, by, bz] = layout.backlog(lane, DEALT[lane][index]);
		const top = stackZ + layout.above;
		if (u < 0.68) {
			const v = smooth(u / 0.68);
			return {
				holder: "deal",
				dx: bx * (1 - v),
				dy: by * (1 - v),
				dz: bz + (top - bz) * v + Math.sin(Math.PI * v) * 10,
				shown: 1,
				punched: 0,
			};
		}
		const v = smooth((u - 0.68) / 0.32);
		return {
			holder: "drop",
			dx: 0,
			dy: 0,
			dz: top + (stackZ - top) * v,
			shown: 1,
			punched: 0,
		};
	}
	const hop = plan.legs.find((leg) => leg.card === index && leg.kind === "hop");
	// Waiting in the magazine: the top card leaves first, so the rest never move.
	if (!hop || t < hop.from)
		return { holder: "magazine", dx: 0, dy: 0, dz: stackZ, shown: 1, punched };
	if (t < hop.to) {
		const u = smooth((t - hop.from) / (hop.to - hop.from));
		return {
			holder: "hop",
			dx: layout.seat * u,
			dy: 0,
			dz: stackZ + (layout.seatRise - stackZ) * u + lift(u),
			shown: 1,
			punched,
		};
	}
	const end = plan.legs.find(
		(leg) =>
			leg.card === index && (leg.kind === "slide" || leg.kind === "reject"),
	);
	if (!end || t < end.from)
		return {
			holder: "carriage",
			dx: carriage - S.home + layout.seat,
			dy: 0,
			dz: layout.seatRise,
			shown: 1,
			punched,
		};
	const u = smooth((t - end.from) / (end.to - end.from));
	if (end.kind === "slide") {
		const [px, py, pz] = layout.pocket(landedBefore[index]);
		const sx = S.pocket - S.home + layout.seat;
		if (t < end.to)
			return {
				holder: "slide",
				dx: sx + (px - sx) * u,
				dy: py * u,
				dz: layout.seatRise + (pz - layout.seatRise) * u + lift(u) * 0.4,
				shown: 1,
				punched,
			};
		return { holder: "pocket", dx: px, dy: py, dz: pz, shown: 1, punched };
	}
	const [rx, ry, rz] = layout.reject(blockedBefore[index]);
	const gx = S.gate - S.home + layout.seat;
	if (t < end.to)
		return {
			holder: "fly",
			dx: gx + (rx - gx) * u,
			dy: ry * u,
			dz: layout.seatRise + (rz - layout.seatRise) * u + lift(u) * 1.6,
			shown: 1,
			punched,
		};
	return { holder: "reject", dx: rx, dy: ry, dz: rz, shown: 1, punched };
}

const pulse = (t: number, at: number, rise: number, fall: number) => {
	if (t < at) return 0;
	if (t < at + rise) return smooth((t - at) / rise);
	return Math.exp(-(t - at - rise) / fall);
};

export function poseAt(t: number, layout: Layout): NightPose {
	const lanes = PLANS.map((plan, lane): LanePose => {
		const carriage = stationAt(plan, t, layout.stations);
		const leg = legAt(plan.legs, t);
		const landedBefore: number[] = [];
		const blockedBefore: number[] = [];
		let landed = 0;
		let blocked = 0;
		plan.fates.forEach((fate, index) => {
			landedBefore[index] = landed;
			blockedBefore[index] = blocked;
			if (fate.outcome === "landed") landed += 1;
			else blocked += 1;
		});
		const cards = plan.fates.map((_, index) =>
			cardPose(
				lane,
				plan,
				index,
				plan.fates.length,
				t,
				layout,
				carriage,
				landedBefore,
				blockedBefore,
			),
		);
		const ramp = (from: number, to: number, edge: number) =>
			smooth((t - from) / edge) * smooth((to - t) / edge);
		const working = leg?.kind === "work" ? ramp(leg.from, leg.to, 1.5) : 0;
		const judging = leg?.kind === "judge" ? ramp(leg.from, leg.to, 1) : 0;
		// The bar rises only for a pass, at the end of the judging Round, and drops once the carriage is through.
		let gate = 0;
		for (const item of plan.legs) {
			if (item.kind === "judge" && item.verdict === "pass") {
				const up = item.to - 1.5;
				const through = plan.legs.find(
					(next) =>
						next.kind === "move" &&
						next.from >= item.to &&
						next.toward === "pocket",
				);
				const down = through ? through.to : item.to + 6;
				if (t >= up && t < down + 2)
					gate = Math.max(
						gate,
						smooth((t - up) / 1.5) * smooth((down + 2 - t) / 2),
					);
			}
		}
		const flag = smooth((t - LANDED) / 3);
		return {
			carriage,
			working,
			gate,
			judging,
			flag,
			cards,
			attempt: leg ? leg.attempt + 1 : 0,
			round: leg ? leg.round : 0,
			active: leg && leg.kind !== "wait" ? leg.card : -1,
		};
	});
	let strike = 0;
	for (const firing of FIRINGS)
		strike = Math.max(strike, pulse(t, firing - 0.6, 0.6, 1.2));
	return { t, lanes, strike, nightCard: smooth((t - NIGHT) / 6) };
}

export interface Tally {
	done: number;
	blocked: number;
	inPockets: number;
	prs: number;
	build: number;
}

export function tallyAt(t: number): Tally {
	let done = 0;
	let blocked = 0;
	for (const plan of PLANS)
		for (const fate of plan.fates)
			if (t >= fate.settled) {
				if (fate.outcome === "landed") done += 1;
				else blocked += 1;
			}
	const build = BUILD_FIRINGS.filter((firing) => firing <= t).length;
	return {
		done,
		blocked,
		inPockets: done,
		prs: t >= LANDED ? PULL_REQUESTS : 0,
		build,
	};
}

/** The story in one line, ending on the result. */
export function readoutOf(t: number) {
	const time = clock(t);
	if (t < 0) return `${time} · ${CARD_COUNT} issues waiting in Linear`;
	if (t < DEAL_END) return `${time} · picking up ${CARD_COUNT} issues`;
	const blocked = `${BLOCKED} card Blocked`;
	if (t >= NIGHT)
		return `${time} · ${BUILDS} builds · ${blocked} · ${PULL_REQUESTS} PRs ready for review`;
	if (t >= LANDED) return `${time} · land · ${PULL_REQUESTS} PRs opened`;
	const tally = tallyAt(t);
	const set = tally.blocked ? ` · ${blocked}` : "";
	return `${time} · build ${tally.build} of ${BUILDS} · ${tally.done} of ${CARD_COUNT} reviewed${set}`;
}

export const LAND_TEXT = clock(LANDED);
