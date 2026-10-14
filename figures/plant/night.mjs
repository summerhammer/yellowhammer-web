// The Night as a pure function of time, in minutes after 22:00. Every number the figure
// shows and every move it makes is read from here; nothing in it knows about pixels.
//
// Spec defaults: night_start 22:00, night_end 06:00, build_every_minutes 15 (land on the
// tick, build one minute after it), review_rounds_max 2. One pull request per Repo Lane.

export const START = 22 * 60;
export const NIGHT_END = 8 * 60;
export const T_END = 9 * 60;
export const EVERY = 15;

/** Land ticks inside the Night, the Night-closing land at 06:00 included. */
export const LAND_TICKS = Array.from(
	{ length: NIGHT_END / EVERY },
	(_, index) => (index + 1) * EVERY,
);
/** Build firings: one minute after each land tick, inside the Night. */
export const BUILD_FIRINGS = LAND_TICKS.filter((tick) => tick < NIGHT_END).map(
	(tick) => tick + 1,
);

// Minutes the plant takes for each physical thing.
export const LIFT = 1.2;
export const ROLL = 1.6;
export const LOAD = 0.8;
export const TO_PRESS = 2;
export const RUN = 4;
export const OUT = 1.2;
export const UP = 3;
export const PROOF = 3;
export const STAMP = 1;
export const DOWN = 3;
export const BACK = 6;
export const HOPPER = 1;
export const TO_GALLEY = 2;
export const TIE = 2;
export const CARRY = 3;
export const LINES = 10;

/**
 * The story sheets, in the order the typesetter takes them off the spike (the top sheet
 * first, so the wire prints them in reverse). `bundle` is the Repo Lane, so the pull
 * request, each one lands in. `rounds` holds one verdict per Round; "back" is a Round that
 * requests changes, and the sheet goes down the return chute for `rework` minutes.
 */
export const SHEETS = [
	{ bundle: 0, compose: 30, rounds: ["pass"] },
	{ bundle: 0, compose: 33, rounds: ["pass"] },
	{ bundle: 1, compose: 28, rounds: ["back", "pass"], rework: 8 },
	{ bundle: 1, compose: 27, rounds: ["back", "pass"], rework: 10, lit: true },
	{ bundle: 2, compose: 14, rounds: ["pass"] },
	{ bundle: 3, compose: 15, rounds: ["pass"] },
	{ bundle: 4, compose: 12, rounds: ["back", "pass"], rework: 5 },
	{ bundle: 5, compose: 12, rounds: ["pass"] },
];
export const LIT = SHEETS.findIndex((sheet) => sheet.lit);
export const BUNDLES = Math.max(...SHEETS.map((sheet) => sheet.bundle)) + 1;
export const BUNDLE_SIZE = Array.from(
	{ length: BUNDLES },
	(_, b) => SHEETS.filter((sheet) => sheet.bundle === b).length,
);

/** When each sheet comes off the wire: the bottom of the spike first, the top last. */
export const WIRE_AT = SHEETS.map(
	(_, index) => -26 + (SHEETS.length - 1 - index) * 3.6,
);
export const WIRE_OUT = 1.4;

const nextBuild = (after) =>
	BUILD_FIRINGS.find((firing) => firing >= after) ?? Number.POSITIVE_INFINITY;
const nextLand = (after) =>
	LAND_TICKS.find((tick) => tick >= after) ?? Number.POSITIVE_INFINITY;

/**
 * Every leg of every sheet, laid end to end: the typesetter takes the next sheet the moment
 * the current one is approved, and the press runs only when the build fires.
 */
function plan() {
	const sheets = [];
	let free = 1;
	for (const [index, sheet] of SHEETS.entries()) {
		const legs = [];
		let now = Math.max(free, WIRE_AT[index] + WIRE_OUT);
		const push = (kind, length, extra = {}) => {
			legs.push({ kind, from: now, to: now + length, ...extra });
			now += length;
		};
		push("lift", LIFT);
		push("roll", ROLL);
		push("load", LOAD);
		push("compose", sheet.compose, { round: 1 });
		let approved = 0;
		for (const [round, verdict] of sheet.rounds.entries()) {
			push("toPress", TO_PRESS, { round: round + 1 });
			push("wait", nextBuild(now) - now, { round: round + 1 });
			push("run", RUN, { round: round + 1 });
			push("out", OUT, { round: round + 1 });
			push("up", UP, { round: round + 1 });
			push("proof", PROOF, { round: round + 1, verdict });
			if (verdict === "pass") {
				approved = now;
				push("stamp", STAMP, { round: round + 1 });
				push("down", DOWN, { round: round + 1 });
				break;
			}
			push("back", BACK, { round: round + 2 });
			push("hopper", HOPPER, { round: round + 2 });
			push("rework", sheet.rework ?? 10, { round: round + 2 });
		}
		free = approved;
		sheets.push({ legs, landed: now, approved });
	}
	return sheets;
}

export const PLAN = plan();

/** When each bundle's last paper lands, and the land tick that ties it. */
export const BUNDLE_DONE = Array.from({ length: BUNDLES }, (_, b) =>
	Math.max(
		...PLAN.filter((_, index) => SHEETS[index].bundle === b).map(
			(sheet) => sheet.landed,
		),
	),
);
export const TIED_AT = BUNDLE_DONE.map((done) => nextLand(done));
export const ALL_TIED = Math.max(...TIED_AT);
export const RUNS = PLAN.flatMap((sheet) =>
	sheet.legs.filter((leg) => leg.kind === "run"),
);
export const ROUNDS = PLAN.reduce(
	(sum, sheet) => sum + sheet.legs.filter((leg) => leg.kind === "proof").length,
	0,
);
export const BACKS = PLAN.reduce(
	(sum, sheet) => sum + sheet.legs.filter((leg) => leg.kind === "back").length,
	0,
);

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const smooth = (value) => {
	const u = clamp(value, 0, 1);
	return u * u * (3 - 2 * u);
};
export const clock = (t) => {
	const minutes = (((START + Math.round(t)) % 1440) + 1440) % 1440;
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

const legAt = (legs, t) =>
	legs.find((leg) => t >= leg.from && t < leg.to) ?? null;

/**
 * Where sheet `index` is at `t`: a slot name and a 0..1 progress through it, plus which
 * form it has (sheet, plate or print), how many type lines its plate carries, and its Round.
 */
export function sheetAt(index, t) {
	const sheet = PLAN[index];
	const legs = sheet.legs;
	const first = legs[0];
	const wire = WIRE_AT[index];
	const lines = (leg) => {
		if (!leg) return 0;
		const composed = legs.filter(
			(item) => item.kind === "compose" && item.to <= leg.from,
		).length;
		if (leg.kind === "compose")
			return clamp((t - leg.from) / (leg.to - leg.from), 0, 1);
		if (leg.kind === "rework") {
			// The agent strikes a few lines and sets them again.
			const u = clamp((t - leg.from) / (leg.to - leg.from), 0, 1);
			return u < 0.3
				? 1 - 0.3 * smooth(u / 0.3)
				: 0.7 + 0.3 * smooth((u - 0.3) / 0.7);
		}
		return composed ? 1 : 0;
	};
	if (t < wire) return { slot: "wire", u: 0, form: "none", lines: 0, round: 0 };
	if (t < wire + WIRE_OUT)
		return {
			slot: "wire",
			u: smooth((t - wire) / WIRE_OUT),
			form: "sheet",
			lines: 0,
			round: 0,
		};
	if (t < first.from) {
		// Waiting on the spike: how many sheets lie under it is how many came off the wire before it and are still there.
		const under = SHEETS.filter(
			(_, other) => WIRE_AT[other] < wire && t < PLAN[other].legs[0].from,
		).length;
		return { slot: "spike", u: 0, k: under, form: "sheet", lines: 0, round: 0 };
	}
	const leg = legAt(legs, t);
	if (!leg) {
		const b = SHEETS[index].bundle;
		const k = SHEETS.filter(
			(other, o) =>
				other.bundle === b && PLAN[o].landed <= sheet.landed && o !== index,
		).length;
		return {
			slot: t >= TIED_AT[b] ? "tied" : "stack",
			u: 0,
			k,
			bundle: b,
			form: "print",
			lines: 1,
			round: 0,
		};
	}
	const u = smooth((t - leg.from) / (leg.to - leg.from));
	const linear = clamp((t - leg.from) / (leg.to - leg.from), 0, 1);
	const base = {
		round: leg.round ?? 1,
		lines: lines(leg),
		verdict: leg.verdict,
	};
	switch (leg.kind) {
		case "lift":
		case "roll":
		case "load":
			return { slot: leg.kind, u, form: "sheet", ...base };
		case "compose":
			return { slot: "holder", u: linear, form: "sheet", ...base };
		case "toPress":
			return { slot: "toPress", u, form: "plate", ...base };
		case "wait":
			return { slot: "bed", u: 0, form: "plate", ...base };
		case "run":
			return { slot: "bed", u: linear, run: 1, form: "plate", ...base };
		case "out":
			return { slot: "out", u, form: "print", ...base };
		case "up":
			return { slot: "up", u, form: "print", ...base };
		case "proof":
			return { slot: "desk", u: linear, form: "print", ...base };
		case "stamp":
			return { slot: "desk", u: 1, stamp: u, form: "print", ...base };
		case "down":
			return { slot: "down", u, form: "print", ...base };
		case "back":
			return { slot: "back", u, form: "print", ...base };
		case "hopper":
			return { slot: "hopper", u, form: "print", ...base };
		case "rework":
			return { slot: "rework", u: linear, form: "print", ...base };
		default:
			return { slot: "spike", u: 0, k: 0, form: "sheet", ...base };
	}
}

/** The press: 0..1 through a run, and how far the cylinder has turned (in turns) at t. */
export function pressAt(t) {
	let turns = 0;
	let running = 0;
	for (const leg of RUNS) {
		if (t >= leg.to) turns += 3;
		else if (t >= leg.from) {
			const u = (t - leg.from) / (leg.to - leg.from);
			turns += 3 * u;
			running = smooth(u / 0.18) * smooth((1 - u) / 0.18);
		}
	}
	return { running, turns };
}

/** Which Round's work the typesetter is doing at t, with the composing head's line. */
export function typesetterAt(t) {
	for (const [index, sheet] of PLAN.entries()) {
		const leg = legAt(sheet.legs, t);
		if (leg && (leg.kind === "compose" || leg.kind === "rework")) {
			const pose = sheetAt(index, t);
			return { working: 1, sheet: index, line: pose.lines };
		}
	}
	return { working: 0, sheet: -1, line: 0 };
}

/** The copy trolley: 0 at the spike, 1 at the typesetter. */
export function trolleyAt(t) {
	for (const sheet of PLAN) {
		const leg = legAt(sheet.legs, t);
		if (!leg) continue;
		if (leg.kind === "lift") return 0;
		if (leg.kind === "roll")
			return smooth((t - leg.from) / (leg.to - leg.from));
		if (leg.kind === "load") return 1;
		if (leg.kind === "compose") return 1 - smooth((t - leg.from) / 3);
	}
	return 0;
}

/** The stamp plunger, 0 up and 1 down, and the lamp's checker's attention (a print under it). */
export function deskAt(t) {
	let stamp = 0;
	let busy = 0;
	for (const sheet of PLAN)
		for (const leg of sheet.legs) {
			if (leg.kind === "stamp") {
				const age = t - leg.from;
				if (age >= 0 && age < STAMP + 0.6)
					stamp = Math.max(
						stamp,
						age < 0.35
							? smooth(age / 0.35)
							: 1 - smooth((age - 0.35) / (STAMP + 0.25)),
					);
			}
			if (leg.kind === "proof" && t >= leg.from && t < leg.to) busy = 1;
		}
	return { stamp, busy };
}

/** Each bundle: loose on the table, being tied, carried to the dock, or on the dock. */
export function bundleAt(b, t) {
	const tied = TIED_AT[b];
	if (t < tied) return { slot: "none", u: 0 };
	if (t < tied + TIE) return { slot: "tying", u: smooth((t - tied) / TIE) };
	if (t < tied + TIE + CARRY)
		return { slot: "carry", u: smooth((t - tied - TIE) / CARRY) };
	return { slot: "dock", u: 1 };
}

export const prsAt = (t) => TIED_AT.filter((tied) => t >= tied + TIE).length;

const STAGE = {
	wire: "coming off the wire",
	spike: "on the spike",
	lift: "picked off the spike",
	roll: "to the typesetter",
	load: "to the typesetter",
	holder: "composing in Orca",
	toPress: "plate to the press",
	bed: "waiting for the build",
	out: "printed",
	up: "to the proof desk",
	desk: "being checked",
	down: "approved",
	back: "sent back",
	hopper: "sent back",
	rework: "reworking in Orca",
	stack: "on the dock",
	tied: "tied into its PR",
};

/** The story in one line: the time, where the lit issue is, and what the dock holds. */
export function readoutOf(t) {
	const time = clock(t);
	const prs = prsAt(t);
	if (t >= ALL_TIED + TIE) return `${time} · ${prs} PRs ready for review`;
	const pose = sheetAt(LIT, t);
	let stage = STAGE[pose.slot] ?? pose.slot;
	if (pose.slot === "bed" && pose.run) stage = "building and testing";
	if (pose.slot === "desk" && pose.round === 2) stage = "checked again";
	if (pose.slot === "holder" || pose.slot === "rework")
		stage = `${pose.round === 1 ? "composing" : "reworking"}, line ${Math.min(LINES, Math.floor(pose.lines * LINES) + 1)}`;
	if (pose.slot === "back") stage = "sent back for round 2";
	if (pose.slot === "stack" || pose.slot === "tied")
		stage =
			pose.slot === "tied" ? `tied into PR ${pose.bundle + 1}` : "on the dock";
	const dock = prs === 1 ? "1 PR on the dock" : `${prs} PRs on the dock`;
	return `${time} · ${stage} · ${dock}`;
}
