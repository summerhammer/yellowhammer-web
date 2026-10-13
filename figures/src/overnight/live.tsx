"use client";

import * as React from "react";
import { translateAlong } from "../iso/iso-kit";
import { IsoFigure } from "../iso/react/draw";
import { asksForStillness, useReadout } from "../iso/react/live";
import { needleOf } from "./geometry";
import { lightAt, paletteAt } from "./palette";
import {
	backlogPose,
	CARD_COUNT,
	type CardPose,
	clock,
	DEALT,
	FIRINGS,
	NIGHT,
	NIGHT_START,
	PLANS,
	PULL_REQUESTS,
	poseAt,
	readoutOf,
	smooth,
	T_FIRST,
	T_LAST,
} from "./shift";
import {
	CARRIAGE_HALF,
	GATE_LIFT,
	GATE_W,
	GATE_X,
	HEIGHT,
	LAYOUT,
	NIGHT_OUT,
	P,
	STATIONS,
	STRIKE_LIFT,
	WIDTH,
} from "./view";

export interface LaneParts {
	back: React.ReactNode;
	card: React.ReactNode;
	carriage: React.ReactNode;
	gateBack: React.ReactNode;
	bar: React.ReactNode;
	gateFront: React.ReactNode;
	pocketBack: React.ReactNode;
	pocketFront: React.ReactNode;
	flag: React.ReactNode;
	postCap: React.ReactNode;
}

interface HeadParts {
	stylus: React.ReactNode;
	body: React.ReactNode;
	clip: string;
}

interface Props {
	label: string;
	base: React.ReactNode;
	stand: React.ReactNode;
	nightCard: React.ReactNode;
	nightClip: string;
	dial: React.ReactNode;
	hub: React.ReactNode;
	striker: React.ReactNode;
	strikerRod: React.ReactNode;
	strikerClip: string[];
	backlog: React.ReactNode;
	column: React.ReactNode;
	bed: React.ReactNode;
	lanes: LaneParts[];
	rejectBack: React.ReactNode;
	rejectFront: React.ReactNode;
	heads: HeadParts[];
	arm: React.ReactNode;
}

/** Painter's slots a card can sit in. */
type Slot =
	| "backlog"
	| "deal"
	| "mag"
	| "carA"
	| "hop"
	| "carB"
	| "slide"
	| "pocket"
	| "fly"
	| "reject";
const BLOCK_SLOTS: Slot[] = ["fly", "reject"];
const BLOCKS = PLANS.map((plan) =>
	plan.fates.some((fate) => fate.outcome === "blocked"),
);
const HOLES = 8;

/** Past this point the carriage is clear of its gate and is drawn in front of it. */
const CLEAR_OF_GATE = GATE_X + GATE_W + CARRIAGE_HALF[0];

/** At rest, and before hydration, the figure shows the morning: the full trays. */
const REST_T = T_LAST;
const FLAG_LIFT = 8.5;
const DAY_END = 1440 + T_FIRST;
const NIGHT_SECONDS = 15;
const HOLD_SECONDS = 3.2;
const DAY_SECONDS = 2.6;
const LOOP = NIGHT_SECONDS + HOLD_SECONDS + DAY_SECONDS;
const TOUR_FIRST = 1.2;
const TOUR_BACK = 3600;
const FOLLOW = 0.16;
const STEP = 15;
const BOB_HZ = 2.4;
const MOST_DT = 1 / 30;

const clamp = (value: number, low: number, high: number) =>
	Math.min(high, Math.max(low, value));

/** Tour phase (seconds) to night minutes: the Night, a hold on the full trays, then the day goes by. */
function tourTime(phase: number) {
	const s = ((phase % LOOP) + LOOP) % LOOP;
	if (s < NIGHT_SECONDS)
		return T_FIRST + ((T_LAST - T_FIRST) * s) / NIGHT_SECONDS;
	if (s < NIGHT_SECONDS + HOLD_SECONDS) return T_LAST;
	return (
		T_LAST +
		(DAY_END - T_LAST) *
			smooth((s - NIGHT_SECONDS - HOLD_SECONDS) / DAY_SECONDS)
	);
}

const phaseOf = (t: number) =>
	((clamp(t, T_FIRST, T_LAST) - T_FIRST) * NIGHT_SECONDS) / (T_LAST - T_FIRST);

const slotOf = (card: CardPose, carriage: number): Slot => {
	switch (card.holder) {
		case "drop":
		case "magazine":
			return "mag";
		case "carriage":
			return carriage >= CLEAR_OF_GATE ? "carB" : "carA";
		default:
			return card.holder;
	}
};

/** The day between Nights: the PRs are taken for review, and new issues gather in the backlog. */
const takenAt = (t: number) => (t > T_LAST ? smooth((t - T_LAST) / 360) : 0);
const gatheredAt = (t: number) =>
	t > T_LAST ? smooth((t - (DAY_END - 420)) / 360) : 0;

function spokenOf(t: number) {
	if (t > T_LAST)
		return `${clock(t)} · the day: ${PULL_REQUESTS} PRs in review, new issues for tonight`;
	return readoutOf(t);
}

interface LaneNodes {
	carA: SVGGElement | null;
	carB: SVGGElement | null;
	bar: SVGGElement | null;
	flag: SVGGElement | null;
	stylus: SVGGElement | null;
	pips: SVGCircleElement[];
	cards: Partial<Record<Slot, (SVGGElement | null)[]>>;
}

interface Nodes {
	needle: SVGPathElement | null;
	tail: SVGPathElement | null;
	rod: SVGGElement | null;
	nightCard: SVGGElement | null;
	plate: HTMLElement | null;
	light: number;
	lanes: LaneNodes[];
}

const fine = (value: number) => Math.round(value * 1000) / 1000;

function setAttr(
	node: Element | null | undefined,
	name: string,
	value: string,
) {
	if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
}

function show(node: SVGGElement | null | undefined, on: boolean) {
	if (!node) return;
	const value = on ? "" : "none";
	if (node.style.display !== value) node.style.display = value;
}

function place(node: SVGGElement, card: CardPose, alpha: number) {
	setAttr(
		node,
		"transform",
		translateAlong(P, [fine(card.dx), fine(card.dy), fine(card.dz)]),
	);
	setAttr(node, "data-holes", `${Math.floor(card.punched * HOLES + 1e-6)}`);
	const opacity = alpha >= 0.999 ? "" : `${fine(alpha)}`;
	if (node.style.opacity !== opacity) node.style.opacity = opacity;
}

function paint(nodes: Nodes, t: number) {
	const light = Math.round(lightAt(NIGHT_START + t) * 200) / 200;
	if (!nodes.plate || light === nodes.light) return;
	nodes.light = light;
	for (const [name, value] of paletteAt(light))
		nodes.plate.style.setProperty(name, value);
}

function apply(nodes: Nodes, t: number, bob: number, strike: number) {
	paint(nodes, t);
	const pose = poseAt(Math.min(t, T_LAST), LAYOUT);
	const taken = takenAt(t);
	const gathered = gatheredAt(t);
	const needle = needleOf(NIGHT_START + t);
	setAttr(nodes.needle, "d", needle.body);
	setAttr(nodes.tail, "d", needle.tail);
	setAttr(
		nodes.rod,
		"transform",
		translateAlong(P, [0, 0, fine(STRIKE_LIFT * strike)]),
	);
	const landed = `${fine((pose.lanes[0]?.flag ?? 0) * (1 - taken))}`;
	if (
		nodes.plate &&
		nodes.plate.style.getPropertyValue("--ov-landed") !== landed
	)
		nodes.plate.style.setProperty("--ov-landed", landed);
	const out = pose.nightCard * (1 - taken);
	show(nodes.nightCard, out > 0.002);
	setAttr(
		nodes.nightCard,
		"transform",
		translateAlong(P, [0, fine(NIGHT_OUT * out), 0]),
	);
	pose.lanes.forEach((lane, index) => {
		const ln = nodes.lanes[index];
		if (!ln) return;
		const ride = translateAlong(P, [fine(lane.carriage - STATIONS.home), 0, 0]);
		const front = lane.carriage >= CLEAR_OF_GATE;
		setAttr(ln.carA, "transform", ride);
		setAttr(ln.carB, "transform", ride);
		show(ln.carA, !front);
		show(ln.carB, front);
		setAttr(
			ln.bar,
			"transform",
			translateAlong(P, [0, 0, fine(GATE_LIFT * lane.gate)]),
		);
		setAttr(
			ln.flag,
			"transform",
			translateAlong(P, [0, 0, fine(FLAG_LIFT * lane.flag * (1 - taken))]),
		);
		setAttr(
			ln.stylus,
			"transform",
			translateAlong(P, [0, 0, fine(-1.4 * lane.working * bob)]),
		);
		// Pips on the carriage: Attempts used of 3, Rounds used of 2, while it carries a card.
		const carrying = lane.cards.some((card) => card.holder === "carriage");
		for (const pip of ln.pips) {
			const k = Number(pip.dataset.k);
			const used = carrying
				? pip.dataset.pip === "attempt"
					? lane.attempt
					: lane.round
				: 0;
			const on = k < used;
			if (on !== pip.hasAttribute("data-on"))
				pip.toggleAttribute("data-on", on);
		}
		lane.cards.forEach((card, cardIndex) => {
			const slot = slotOf(card, lane.carriage);
			const done = card.holder === "pocket" || card.holder === "reject";
			const alpha = card.shown * (done ? 1 - taken : 1);
			// In the day, tonight's new issues gather in the backlog while the morning's work is taken away.
			const again =
				gathered > 0.002 ? backlogPose(index, cardIndex, LAYOUT) : null;
			for (const [name, copies] of Object.entries(ln.cards) as [
				Slot,
				(SVGGElement | null)[],
			][]) {
				const node = copies[cardIndex];
				if (!node) continue;
				if (name === slot && alpha > 0.002) {
					show(node, true);
					place(node, card, alpha);
				} else if (name === "backlog" && again) {
					show(node, true);
					place(node, again, gathered);
				} else show(node, false);
			}
		});
	});
}

export function OvernightLive(props: Props) {
	const { anchor, say } = useReadout<HTMLDivElement>();
	const uid = `ov${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
	const root = React.useRef<HTMLDivElement | null>(null);
	const nodes = React.useRef<Nodes>({
		needle: null,
		tail: null,
		rod: null,
		nightCard: null,
		plate: null,
		light: -1,
		lanes: props.lanes.map(() => ({
			carA: null,
			carB: null,
			bar: null,
			flag: null,
			stylus: null,
			pips: [],
			cards: {},
		})),
	});
	const shown = React.useRef(REST_T);
	const target = React.useRef(REST_T);
	const phase = React.useRef(phaseOf(REST_T));
	const touringRef = React.useRef(false);
	const strike = React.useRef({ at: 0, rate: 0 });
	const frame = React.useRef(0);
	const last = React.useRef(0);
	const [focused, setFocused] = React.useState(false);
	const [pressing, setPressing] = React.useState(false);
	const [visible, setVisible] = React.useState(false);
	const [idle, setIdle] = React.useState(true);
	const [poke, setPoke] = React.useState(0);

	const draw = React.useCallback(
		(now: number, calm: boolean) => {
			const t = shown.current;
			const bob = calm
				? 0
				: 0.5 - 0.5 * Math.cos(now * 0.001 * Math.PI * 2 * BOB_HZ);
			apply(nodes.current, t, bob, clamp(strike.current.at, 0, 1));
			const text = spokenOf(t);
			say(text);
			const node = root.current;
			if (node) {
				setAttr(
					node,
					"aria-valuenow",
					`${Math.round(clamp(t, T_FIRST, T_LAST))}`,
				);
				setAttr(node, "aria-valuetext", text);
			}
		},
		[say],
	);

	const stop = React.useCallback(() => {
		cancelAnimationFrame(frame.current);
		frame.current = 0;
	}, []);

	const run = React.useCallback(() => {
		if (frame.current) return;
		last.current = 0;
		const tick = (now: number) => {
			const dt = last.current
				? Math.min((now - last.current) / 1000, MOST_DT)
				: 1 / 60;
			last.current = now;
			const calm = asksForStillness();
			const before = shown.current;
			if (touringRef.current && !calm) {
				phase.current += dt;
				target.current = tourTime(phase.current);
				// The tour wraps from the next evening back to this one: the same minute of the day.
				if (target.current < shown.current - 600) shown.current -= 1440;
				shown.current = target.current;
			} else {
				const want = target.current;
				shown.current = calm
					? want
					: shown.current +
						(want - shown.current) * (1 - Math.exp(-dt / FOLLOW));
				if (Math.abs(want - shown.current) < 0.02) shown.current = want;
			}
			// launchd fires: each firing the needle crosses kicks the striker.
			const lo = Math.min(before, shown.current);
			const hi = Math.max(before, shown.current);
			if (
				!calm &&
				hi > lo &&
				FIRINGS.some((firing) => firing > lo && firing <= hi)
			)
				strike.current.rate += 26;
			const s = strike.current;
			const steps = Math.max(Math.ceil(dt * 240), 1);
			for (let k = 0; k < steps; k++) {
				s.rate += (-s.at * 520 - s.rate * 24) * (dt / steps);
				s.at += s.rate * (dt / steps);
				if (s.at < 0) {
					s.at = 0;
					s.rate = Math.max(0, s.rate);
				}
			}
			if (calm) {
				s.at = 0;
				s.rate = 0;
			}
			draw(now, calm);
			const t = shown.current;
			const working =
				!calm &&
				t >= 0 &&
				t <= NIGHT &&
				poseAt(t, LAYOUT).lanes.some((lane) => lane.working > 0);
			const busy =
				touringRef.current ||
				t !== target.current ||
				s.at > 1e-3 ||
				s.rate > 1e-3 ||
				working;
			frame.current = busy ? requestAnimationFrame(tick) : 0;
		};
		frame.current = requestAnimationFrame(tick);
	}, [draw]);

	React.useEffect(() => {
		nodes.current.plate =
			root.current?.closest<HTMLElement>(".iso-plate") ?? null;
		for (const lane of nodes.current.lanes)
			lane.pips = [lane.carA, lane.carB].flatMap((group) =>
				group ? [...group.querySelectorAll<SVGCircleElement>(".ov-pip")] : [],
			);
		draw(performance.now(), asksForStillness());
	}, [draw]);

	React.useEffect(() => {
		const node = root.current;
		if (!node) return;
		const observer = new IntersectionObserver((entries) =>
			setVisible(Boolean(entries.at(-1)?.isIntersecting)),
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			stop();
		};
	}, [stop]);

	const engaged = focused || pressing;

	// biome-ignore lint/correctness/useExhaustiveDependencies: each poke (a drag or a key) restarts the idle timer.
	React.useEffect(() => {
		if (engaged) {
			setIdle(false);
			return;
		}
		const timer = window.setTimeout(() => setIdle(true), TOUR_BACK);
		return () => window.clearTimeout(timer);
	}, [engaged, poke]);

	const touring = visible && idle && !engaged;

	React.useEffect(() => {
		if (!visible) {
			touringRef.current = false;
			stop();
			return;
		}
		if (touring && !asksForStillness()) {
			const timer = window.setTimeout(() => {
				phase.current =
					shown.current > T_LAST
						? NIGHT_SECONDS + HOLD_SECONDS
						: phaseOf(shown.current);
				touringRef.current = true;
				run();
			}, TOUR_FIRST * 1000);
			return () => {
				window.clearTimeout(timer);
				touringRef.current = false;
			};
		}
		touringRef.current = false;
		run();
	}, [visible, touring, run, stop]);

	const steer = (t: number) => {
		touringRef.current = false;
		// Out of the day, back into this evening: the same minute of the day, a day earlier.
		if (shown.current > T_LAST) shown.current -= 1440;
		target.current = clamp(t, T_FIRST, T_LAST);
		run();
	};

	const timeAt = (clientX: number) => {
		const svg = root.current?.querySelector("svg");
		const box = svg?.getBoundingClientRect();
		if (!box?.width) return null;
		const f = clamp(((clientX - box.left) / box.width - 0.08) / 0.84, 0, 1);
		return T_FIRST + (T_LAST - T_FIRST) * f;
	};

	const wake = () => {
		setIdle(false);
		setPoke((count) => count + 1);
	};

	const bindLane =
		<K extends "carA" | "carB" | "bar" | "flag" | "stylus">(
			lane: number,
			key: K,
		) =>
		(node: LaneNodes[K]) => {
			const entry = nodes.current.lanes[lane];
			if (entry) entry[key] = node;
		};

	const bindCard =
		(lane: number, slot: Slot, index: number) => (node: SVGGElement | null) => {
			const entry = nodes.current.lanes[lane];
			if (!entry) return;
			const list = entry.cards[slot] ?? [];
			list[index] = node;
			entry.cards[slot] = list;
		};

	// The rest pose, rendered on the server and on the first client render.
	const rest = React.useMemo(
		() => ({
			pose: poseAt(REST_T, LAYOUT),
			needle: needleOf(NIGHT_START + REST_T),
		}),
		[],
	);

	const copy = (lane: number, slot: Slot, index: number) => {
		const card = rest.pose.lanes[lane]?.cards[index];
		const here =
			card && slotOf(card, rest.pose.lanes[lane]?.carriage ?? 0) === slot;
		return (
			<g
				key={`${lane}-${index}`}
				ref={bindCard(lane, slot, index)}
				className="ov-card"
				data-holes={card ? Math.floor(card.punched * HOLES + 1e-6) : 0}
				transform={
					card
						? translateAlong(P, [fine(card.dx), fine(card.dy), fine(card.dz)])
						: undefined
				}
				style={here ? undefined : { display: "none" }}
			>
				{props.lanes[lane]?.card}
			</g>
		);
	};

	/** One lane's copies for a slot; stacks paint bottom first, so the magazine runs from its last card. */
	const copies = (lane: number, slot: Slot) => {
		const count = PLANS[lane]?.fates.length ?? 0;
		const order = Array.from({ length: count }, (_, index) =>
			slot === "mag" ? count - 1 - index : index,
		);
		return (
			<g key={slot} data-slot={slot}>
				{order.map((index) => copy(lane, slot, index))}
			</g>
		);
	};

	/** Every card in one slot across the lanes, in deal order: the backlog stack paints from its bottom. */
	const dealt = (slot: Slot) => {
		const all = PLANS.flatMap((plan, lane) =>
			plan.fates.map((_, index) => ({
				lane,
				index,
				d: DEALT[lane]?.[index] ?? 0,
			})),
		);
		all.sort((a, b) => b.d - a.d);
		return (
			<g data-slot={slot}>
				{all.map(({ lane, index }) => copy(lane, slot, index))}
			</g>
		);
	};

	return (
		<div
			ref={(node) => {
				root.current = node;
				anchor.current = node;
			}}
			className="ov"
			role="slider"
			tabIndex={0}
			aria-label={`The overnight Shift: drag across, or use the arrow keys, to run the Night from ${CARD_COUNT} issues in the evening to finished pull requests in the morning`}
			aria-valuemin={T_FIRST}
			aria-valuemax={T_LAST}
			aria-valuenow={REST_T}
			aria-valuetext={readoutOf(REST_T)}
			onPointerMove={(event) => {
				if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
				const t = timeAt(event.clientX);
				if (t === null) return;
				wake();
				steer(t);
			}}
			onPointerDown={(event) => {
				const t = timeAt(event.clientX);
				if (t === null) return;
				event.currentTarget.setPointerCapture(event.pointerId);
				setPressing(true);
				wake();
				steer(t);
			}}
			onPointerUp={(event) => {
				if (event.currentTarget.hasPointerCapture(event.pointerId))
					event.currentTarget.releasePointerCapture(event.pointerId);
				setPressing(false);
			}}
			onPointerCancel={() => setPressing(false)}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			onKeyDown={(event) => {
				const by = event.shiftKey ? STEP * 4 : STEP;
				const now = clamp(target.current, T_FIRST, T_LAST);
				let next: number | null = null;
				// Arrow keys step from firing to firing: the build ticks one minute after each land tick.
				if (event.key === "ArrowRight" || event.key === "ArrowUp")
					next = Math.floor((now + 1) / by) * by + by + 1;
				else if (event.key === "ArrowLeft" || event.key === "ArrowDown")
					next = Math.ceil((now - 1) / by) * by - by + 1;
				else if (event.key === "Home") next = T_FIRST;
				else if (event.key === "End") next = T_LAST;
				if (next === null) return;
				event.preventDefault();
				wake();
				steer(next);
			}}
		>
			<IsoFigure width={WIDTH} height={HEIGHT} label={props.label}>
				<defs>
					<clipPath id={`${uid}-night`}>
						<path d={props.nightClip} />
					</clipPath>
					<clipPath id={`${uid}-striker`}>
						{props.strikerClip.map((d) => (
							<path key={d} d={d} />
						))}
					</clipPath>
					{props.heads.map((head, index) => (
						<clipPath key={index} id={`${uid}-stylus-${index}`}>
							<path d={head.clip} />
						</clipPath>
					))}
				</defs>
				{props.base}
				{props.stand}
				<g clipPath={`url(#${uid}-night)`}>
					<g
						ref={(node) => {
							nodes.current.nightCard = node;
						}}
						style={{ display: "none" }}
					>
						{props.nightCard}
					</g>
				</g>
				{props.dial}
				<path
					ref={(node) => {
						nodes.current.tail = node;
					}}
					className="iso-line ov-needle"
					data-tone="hi"
					data-free=""
					d={rest.needle.tail}
				/>
				<path
					ref={(node) => {
						nodes.current.needle = node;
					}}
					className="iso-line ov-needle"
					data-tone="hi"
					data-free="start"
					d={rest.needle.body}
				/>
				{props.hub}
				{props.striker}
				<g clipPath={`url(#${uid}-striker)`}>
					<g
						ref={(node) => {
							nodes.current.rod = node;
						}}
					>
						{props.strikerRod}
					</g>
				</g>
				{props.backlog}
				{dealt("backlog")}
				{props.column}
				{props.bed}
				{props.lanes.map((lane, index) => {
					const pose = rest.pose.lanes[index];
					const ride = translateAlong(P, [
						fine((pose?.carriage ?? STATIONS.home) - STATIONS.home),
						0,
						0,
					]);
					const front = (pose?.carriage ?? 0) >= CLEAR_OF_GATE;
					return (
						<g key={index} data-lane={index}>
							{lane.back}
							{copies(index, "mag")}
							{lane.gateBack}
							<g
								ref={bindLane(index, "carA")}
								transform={ride}
								style={front ? { display: "none" } : undefined}
							>
								{lane.carriage}
							</g>
							{copies(index, "carA")}
							{copies(index, "hop")}
							<g
								ref={bindLane(index, "bar")}
								transform={translateAlong(P, [
									0,
									0,
									fine(GATE_LIFT * (pose?.gate ?? 0)),
								])}
							>
								{lane.bar}
							</g>
							{lane.gateFront}
							<g
								ref={bindLane(index, "carB")}
								transform={ride}
								style={front ? undefined : { display: "none" }}
							>
								{lane.carriage}
							</g>
							{copies(index, "carB")}
							{lane.pocketBack}
							{copies(index, "pocket")}
							{copies(index, "slide")}
							{lane.pocketFront}
							<g
								ref={bindLane(index, "flag")}
								transform={translateAlong(P, [
									0,
									0,
									fine(FLAG_LIFT * (pose?.flag ?? 0)),
								])}
							>
								{lane.flag}
							</g>
							{lane.postCap}
						</g>
					);
				})}
				<g>
					{props.rejectBack}
					{BLOCKS.map((blocks, index) =>
						blocks ? (
							<g key={index}>
								{BLOCK_SLOTS.map((slot) => copies(index, slot))}
							</g>
						) : null,
					)}
					{props.rejectFront}
				</g>
				{dealt("deal")}
				{props.heads.map((head, index) => (
					<g key={index} data-head={index}>
						<g clipPath={`url(#${uid}-stylus-${index})`}>
							<g ref={bindLane(index, "stylus")}>{head.stylus}</g>
						</g>
						{head.body}
					</g>
				))}
				{props.arm}
			</IsoFigure>
		</div>
	);
}
