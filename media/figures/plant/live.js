const DATA = __DATA__;
const P = DATA.P;
const K = { iso, pathOf, cylinder, fadedSvg, lineSvg, solidSvg };
const parts = makeParts(K, G, P);
const stage = document.querySelector(".pl-stage");
const svg = stage.querySelector("svg");
const plate = stage.closest(".iso-plate");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (sel) => svg.querySelector(sel);
const $$ = (sel) => [...svg.querySelectorAll(sel)];

const T_END = NIGHT.T_END;
const REST_T = T_END;
const NIGHT_SECONDS = 15;
const HOLD_SECONDS = 4;
const REWIND_SECONDS = 1.6;
const LOOP = NIGHT_SECONDS + HOLD_SECONDS + REWIND_SECONDS;
const TOUR_FIRST = 1.2;
const TOUR_BACK = 3600;
const FOLLOW = 0.16;
const STEP = 15;
const TAU = Math.PI * 2;

const el = {
	slots: {},
	spike: $$('[data-part="slot-spike"] .pl-copy'),
	stack: $$('[data-part="slot-stack"] .pl-copy'),
	bundles: (() => {
		const list = [];
		for (const g of $$('[data-part="bundle"]'))
			list[Number(g.dataset.bundle)] = g;
		return list;
	})(),
	tray: $('[data-part="tray"]'),
	head: $('[data-part="head"]'),
	trolley: $('[data-part="trolley"]'),
	bed: $('[data-part="bed"]'),
	ribs: $('[data-part="ribs"]'),
	spokes: $('[data-part="spokes"]'),
	hands: $('[data-part="hands"]'),
	stamp: $('[data-part="stamp"]'),
	stampCap: $('[data-part="stamp-cap"]'),
	lines: $$('[data-part="tray"] .pl-line'),
	pin: null,
};
for (const g of $$("[data-part^='slot-']")) {
	const slot = g.dataset.part.slice(5);
	if (slot === "spike" || slot === "stack" || slot === "hopper") continue;
	el.slots[slot] = [
		g.querySelector(".pl-copy:not([data-lit])"),
		g.querySelector(".pl-copy[data-lit]"),
	];
}
// The pin above the spike's stack is redrawn as the stack changes, after the stack.
el.pin = $('[data-part="pin"]');

const f2 = (v) => Math.round(v * 100) / 100;
const setAttr = (node, name, value) => {
	if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
};
const show = (node, on) => {
	if (!node) return;
	const value = on ? "" : "none";
	if (node.style.display !== value) node.style.display = value;
};
const move = (node, [x, y, z]) =>
	setAttr(node, "transform", translateAlong(P, [f2(x), f2(y), f2(z)]));
const moveTo = (node, [x, y, z], [ox, oy, oz] = [0, 0, 0]) =>
	setAttr(
		node,
		"transform",
		translateAlong(P, [f2(x - ox), f2(y - oy), f2(z - oz)]),
	);

// ── Light: the plate's tokens follow the minute of the day, from dusk to morning ──
const DUSK = {
	"--anatomy-card": "#aeb0c6",
	"--anatomy-paper": "#aeb0c6",
	"--anatomy-face": "#babcd0",
	"--anatomy-top": "#b7b9ce",
	"--anatomy-shade-0": "#969ab4",
	"--anatomy-shade-1": "#9ea1ba",
	"--anatomy-shade-2": "#a5a8c0",
	"--anatomy-shade-3": "#acafc5",
	"--anatomy-hi": "#1b1c32",
	"--anatomy-mid": "#595c80",
	"--anatomy-lo": "#7d80a2",
	"--anatomy-faint": "#9598b6",
	"--anatomy-lit": "#000000",
	"--anatomy-lit-top": "#f4f4f8",
	"--anatomy-lit-shade": "#dcdde6",
	"--anatomy-halo": "#25275c",
	"--anatomy-dot": "#22244a",
	"--anatomy-text": "#2f3155",
	"--anatomy-muted": "#4f5379",
	"--anatomy-strong": "#121329",
};
const MORNING = {
	"--anatomy-card": "#fbfbfa",
	"--anatomy-paper": "#fbfbfa",
	"--anatomy-face": "#f8f8f6",
	"--anatomy-top": "#f6f6f3",
	"--anatomy-shade-0": "#dadad6",
	"--anatomy-shade-1": "#e2e2de",
	"--anatomy-shade-2": "#eaeae6",
	"--anatomy-shade-3": "#f1f1ed",
	"--anatomy-hi": "#26262a",
	"--anatomy-mid": "#8a8a8f",
	"--anatomy-lo": "#b4b4b8",
	"--anatomy-faint": "#d4d4d6",
	"--anatomy-lit": "#000000",
	"--anatomy-lit-top": "#ffffff",
	"--anatomy-lit-shade": "#eeeeeb",
	"--anatomy-halo": "#8a8a80",
	"--anatomy-dot": "#3a3a3e",
	"--anatomy-text": "#57575a",
	"--anatomy-muted": "#8c8c90",
	"--anatomy-strong": "#18181a",
};
const rgb = (hex) =>
	[1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const hex = (c) =>
	`#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const PAIRS = Object.keys(DUSK).map((name) => [
	name,
	rgb(DUSK[name]),
	rgb(MORNING[name]),
]);
const DAWN = [3 * 60 + 30, 6 * 60 + 50];
const EVENING = [21 * 60, 23 * 60 + 30];
/** 0 in the night, 1 in morning light. */
function lightAt(minuteOfDay) {
	const m = ((minuteOfDay % 1440) + 1440) % 1440;
	if (m < DAWN[0]) return 0;
	if (m < DAWN[1]) return NIGHT.smooth((m - DAWN[0]) / (DAWN[1] - DAWN[0]));
	if (m < EVENING[0]) return 1;
	if (m < EVENING[1])
		return 1 - NIGHT.smooth((m - EVENING[0]) / (EVENING[1] - EVENING[0]));
	return 0;
}
let lastLight = -1;
function paint(t) {
	if (DATA.theme === "dark") return;
	const light = Math.round(lightAt(NIGHT.START + t) * 200) / 200;
	if (light === lastLight) return;
	lastLight = light;
	for (const [name, dusk, morning] of PAIRS)
		plate.style.setProperty(
			name,
			hex(dusk.map((v, i) => v + (morning[i] - v) * light)),
		);
	plate.style.setProperty(
		"--anatomy-halo-opacity",
		`${Math.round((0.44 + (0.32 - 0.44) * light) * 100) / 100}`,
	);
}

// ── Per-frame placement from the model ──
const SINGLE = new Set([
	"wire",
	"lift",
	"roll",
	"load",
	"holder",
	"out",
	"up",
	"desk",
	"back",
	"rework",
	"down",
]);
const state = {
	shown: REST_T,
	target: REST_T,
	phase: 0,
	touring: false,
	frame: 0,
	last: 0,
	turns: -1,
	pinTop: -1,
	lines: -1,
	trayLit: null,
};

function trayPose(t) {
	// The tray carries the plate of the sheet the typesetter holds: at the galley, on its way, on the bed, or coming back.
	for (let i = NIGHT.PLAN.length - 1; i >= 0; i--) {
		const legs = NIGHT.PLAN[i].legs;
		if (t < legs[0].from) continue;
		const leg = legs.find((item) => t >= item.from && t < item.to);
		const pose = NIGHT.sheetAt(i, t);
		const lit = i === DATA.LIT;
		if (leg && leg.kind === "toPress")
			return { u: pose.u, lines: pose.lines, lit };
		if (leg && (leg.kind === "wait" || leg.kind === "run"))
			return { u: 1, lines: pose.lines, lit, run: leg.kind === "run" };
		// After a run the plate stays on the bed until its proof is acted on: back for rework, or
		// cleared when the next sheet is picked up.
		const run = legs
			.filter((item) => item.kind === "run" && item.to <= t)
			.at(-1);
		if (run) {
			const hopper = legs.find(
				(item) => item.kind === "hopper" && item.from >= run.to,
			);
			const next = NIGHT.PLAN[i + 1]?.legs[0];
			const start = hopper
				? hopper.from - 1
				: next
					? next.from
					: run.to + NIGHT.TO_GALLEY;
			const stays =
				leg &&
				(leg.kind === "out" ||
					leg.kind === "up" ||
					leg.kind === "proof" ||
					leg.kind === "stamp" ||
					leg.kind === "back");
			if (t < start && (stays || !leg))
				return { u: 1, lines: pose.lines, lit: false };
			if (t >= start && t < start + NIGHT.TO_GALLEY)
				return {
					u: 1 - NIGHT.smooth((t - start) / NIGHT.TO_GALLEY),
					lines: pose.lines,
					lit: lit && pose.form !== "print",
				};
		}
		const landed = !leg;
		return {
			u: 0,
			lines: landed ? 0 : pose.lines,
			lit: lit && !landed && pose.form !== "print",
		};
	}
	return { u: 0, lines: 0, lit: false };
}

function apply(t) {
	paint(t);
	const press = NIGHT.pressAt(t);
	const bedDx = Math.sin(press.turns * TAU) * 6 * press.running;
	const used = new Set();
	let onSpike = 0;
	let litForm = "none";
	for (let i = 0; i < DATA.count; i++) {
		const pose = NIGHT.sheetAt(i, t);
		const lit = i === DATA.LIT;
		if (lit) litForm = pose.form;
		let node = null;
		if (
			pose.form === "none" ||
			pose.slot === "tied" ||
			pose.slot === "bed" ||
			pose.slot === "toPress" ||
			pose.slot === "hopper"
		)
			node = null;
		else if (pose.slot === "spike") {
			node = el.spike[i];
			onSpike = Math.max(onSpike, pose.k + 1);
		} else if (pose.slot === "stack") node = el.stack[lit ? 2 : pose.k];
		else if (SINGLE.has(pose.slot))
			node = el.slots[pose.slot]?.[lit ? 1 : 0] ?? null;
		if (node) {
			used.add(node);
			show(node, true);
			const p = parts.poseOf(pose);
			moveTo(
				node,
				pose.slot === "out" && pose.u < 0.05
					? [p[0] + bedDx * (1 - pose.u * 20), p[1], p[2]]
					: p,
				DATA.origins[pose.slot] ?? [0, 0, 0],
			);
		}
	}
	for (const list of [el.spike, el.stack, ...Object.values(el.slots)])
		for (const node of list) if (node && !used.has(node)) show(node, false);
	// The spike's pin above the stack.
	const pinTop = parts.SPIKE_Z + onSpike * 0.9;
	if (pinTop !== state.pinTop) {
		state.pinTop = pinTop;
		el.pin.innerHTML = solidSvg(parts.pinAbove(pinTop), {
			tone: "hi",
			crease: "none",
		});
	}
	// The tray and its type lines.
	const tray = trayPose(t);
	const galley = parts.galleyAt;
	const bed = parts.bedAt;
	move(el.tray, [
		galley[0] +
			(bed[0] - galley[0]) * tray.u +
			bedDx * (tray.u === 1 ? 1 : 0) -
			galley[0],
		(bed[1] - galley[1]) * tray.u,
		(bed[2] - galley[2]) * tray.u,
	]);
	const lines = Math.round(tray.lines * NIGHT.LINES);
	if (lines !== state.lines) {
		state.lines = lines;
		for (const [i, node] of el.lines.entries()) show(node, i < lines);
	}
	if (tray.lit !== state.trayLit) {
		state.trayLit = tray.lit;
		el.tray.toggleAttribute("data-on", Boolean(tray.lit));
	}
	// The composing head walks the galley line by line while the typesetter works.
	const ts = NIGHT.typesetterAt(t);
	const line = ts.working
		? Math.min(NIGHT.LINES - 1, Math.floor(ts.line * NIGHT.LINES))
		: 0;
	move(el.head, [
		0,
		line * 1.42 + (ts.working ? 0 : -2.2),
		ts.working ? 0 : 1.2,
	]);
	// The trolley, the bed, the press and the stamp.
	move(el.trolley, [
		parts.trolleyAt(NIGHT.trolleyAt(t))[0] - parts.trolleyAt(0)[0],
		0,
		0,
	]);
	move(el.bed, [bedDx, 0, 0]);
	if (press.turns !== state.turns) {
		state.turns = press.turns;
		el.ribs.innerHTML = parts.cylinderRibs(press.turns);
		el.spokes.innerHTML = parts.flywheelSpokes(press.turns);
	}
	const desk = NIGHT.deskAt(t);
	move(el.stamp, [0, 0, -0.9 * desk.stamp]);
	move(el.stampCap, [0, 0, -0.9 * desk.stamp]);
	// Bundles: tied on the table, carried to the dock, then at rest.
	for (let b = 0; b < DATA.bundles; b++) {
		const pose = NIGHT.bundleAt(b, t);
		const node = el.bundles[b];
		if (pose.slot === "none") {
			show(node, false);
			continue;
		}
		show(node, true);
		const home = parts.bundleAt(b);
		const table = parts.stackAt(0);
		const u = pose.slot === "dock" ? 1 : pose.slot === "carry" ? pose.u : 0;
		move(node, [
			(table[0] - home[0]) * (1 - u),
			(table[1] - home[1]) * (1 - u),
			(table[2] - home[2]) * (1 - u) + Math.sin(Math.PI * u) * 5,
		]);
		node.dataset.tied =
			pose.slot === "tying" ? String(Math.round(pose.u * 10) / 10) : "1";
	}
	// The clock.
	const hands = parts.handsOf(NIGHT.START + t);
	el.hands.innerHTML = `<path class="iso-line pl-hand" data-tone="hi" data-free="end" d="${hands.hour}"/><path class="iso-line pl-hand" data-tone="hi" data-free="end" d="${hands.minute}"/>`;
	const text = NIGHT.readoutOf(t);
	if (readout.textContent !== text) readout.textContent = text;
	stage.setAttribute("aria-valuenow", String(Math.round(t)));
	stage.setAttribute("aria-valuetext", text);
	void litForm;
}

// ── The loop: a tour of the night, or easing toward the reader's time ──
function tourTime(phase) {
	const s = ((phase % LOOP) + LOOP) % LOOP;
	if (s < NIGHT_SECONDS) return (T_END * s) / NIGHT_SECONDS;
	if (s < NIGHT_SECONDS + HOLD_SECONDS) return T_END;
	return (
		T_END *
		(1 - NIGHT.smooth((s - NIGHT_SECONDS - HOLD_SECONDS) / REWIND_SECONDS))
	);
}
const phaseOf = (t) => (NIGHT.clamp(t, 0, T_END) * NIGHT_SECONDS) / T_END;
let visible = false;
let idleTimer = 0;
function tick(now) {
	const dt = state.last ? Math.min((now - state.last) / 1000, 1 / 30) : 1 / 60;
	state.last = now;
	const calm = still.matches;
	if (state.touring && !calm) {
		state.phase += dt;
		state.target = tourTime(state.phase);
		state.shown = state.target;
	} else {
		state.shown = calm
			? state.target
			: state.shown +
				(state.target - state.shown) * (1 - Math.exp(-dt / FOLLOW));
		if (Math.abs(state.target - state.shown) < 0.02) state.shown = state.target;
	}
	apply(state.shown);
	const busy =
		state.touring ||
		state.shown !== state.target ||
		(!calm && NIGHT.pressAt(state.shown).running > 0);
	state.frame = busy && visible ? requestAnimationFrame(tick) : 0;
}
const run = () => {
	if (state.frame || !visible) return;
	state.last = 0;
	state.frame = requestAnimationFrame(tick);
};
const startTour = () => {
	if (still.matches) return;
	state.phase = state.shown >= T_END ? NIGHT_SECONDS : phaseOf(state.shown);
	state.touring = true;
	run();
};
const steer = (t) => {
	state.touring = false;
	state.target = NIGHT.clamp(t, 0, T_END);
	clearTimeout(idleTimer);
	idleTimer = setTimeout(startTour, TOUR_BACK);
	run();
};
new IntersectionObserver(
	(entries) => {
		visible = entries[entries.length - 1].isIntersecting;
		if (visible) {
			if (!state.touring && !idleTimer)
				idleTimer = setTimeout(startTour, TOUR_FIRST * 1000);
			run();
		} else {
			cancelAnimationFrame(state.frame);
			state.frame = 0;
		}
	},
	{ rootMargin: "120px 0px" },
).observe(stage);

const timeAt = (clientX) => {
	const box = svg.getBoundingClientRect();
	if (!box.width) return null;
	const f = NIGHT.clamp(((clientX - box.left) / box.width - 0.06) / 0.88, 0, 1);
	return T_END * f;
};
stage.addEventListener("pointerdown", (event) => {
	const t = timeAt(event.clientX);
	if (t === null) return;
	stage.setPointerCapture(event.pointerId);
	steer(t);
});
stage.addEventListener("pointermove", (event) => {
	if (!stage.hasPointerCapture(event.pointerId)) return;
	const t = timeAt(event.clientX);
	if (t !== null) steer(t);
});
stage.addEventListener("pointerup", (event) => {
	if (stage.hasPointerCapture(event.pointerId))
		stage.releasePointerCapture(event.pointerId);
});
stage.addEventListener("keydown", (event) => {
	const by = event.shiftKey ? STEP * 4 : STEP;
	const now = NIGHT.clamp(state.touring ? state.shown : state.target, 0, T_END);
	let next = null;
	if (event.key === "ArrowRight" || event.key === "ArrowUp")
		next = Math.floor(now / by + 1e-6) * by + by;
	else if (event.key === "ArrowLeft" || event.key === "ArrowDown")
		next = Math.ceil(now / by - 1e-6) * by - by;
	else if (event.key === "Home") next = 0;
	else if (event.key === "End") next = T_END;
	if (next === null) return;
	event.preventDefault();
	steer(next);
});
stage.addEventListener("focus", () => {
	state.touring = false;
	clearTimeout(idleTimer);
	idleTimer = 0;
});
stage.addEventListener("blur", () => steer(state.target));
apply(REST_T);
