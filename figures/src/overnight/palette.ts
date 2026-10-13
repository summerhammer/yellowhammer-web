// Dusk to morning. The figure's whole tone follows the minute of the day, the same
// value that turns the clock's needle, so the light and the clock can't disagree.
// Dusk leans toward the brand's Night indigo; morning is the kit's light theme with
// tops a step below white, so the lit PR trays stay the brightest thing on the bench.

const DUSK: Record<string, string> = {
	"--anatomy-card": "#b3b5cb",
	"--anatomy-paper": "#b3b5cb",
	"--anatomy-face": "#bfc1d5",
	"--anatomy-top": "#bcbed3",
	"--anatomy-shade-0": "#9c9fb9",
	"--anatomy-shade-1": "#a3a6bf",
	"--anatomy-shade-2": "#aaadc5",
	"--anatomy-shade-3": "#b1b4ca",
	"--anatomy-hi": "#1b1c32",
	"--anatomy-mid": "#5d6084",
	"--anatomy-lo": "#8285a6",
	"--anatomy-faint": "#9a9dbb",
	"--anatomy-halo": "#25275c",
	"--anatomy-dot": "#22244a",
	"--anatomy-text": "#2f3155",
	"--anatomy-muted": "#4f5379",
	"--anatomy-strong": "#121329",
};

const MORNING: Record<string, string> = {
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
	"--anatomy-halo": "#8a8a80",
	"--anatomy-dot": "#3a3a3e",
	"--anatomy-text": "#57575a",
	"--anatomy-muted": "#8c8c90",
	"--anatomy-strong": "#18181a",
};

const HALO = [0.42, 0.32];

const rgb = (hex: string) =>
	[1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
const hex = (channels: number[]) =>
	`#${channels.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
const smooth = (value: number) => {
	const u = Math.min(1, Math.max(0, value));
	return u * u * (3 - 2 * u);
};

const PAIRS = Object.keys(DUSK).map(
	(name) =>
		[
			name,
			rgb(DUSK[name] ?? "#000000"),
			rgb(MORNING[name] ?? "#000000"),
		] as const,
);

// Minutes of the day: dark through the small hours, dawn from 03:00 to 06:45, day, dusk again by 21:45.
const DAWN = [3 * 60, 6 * 60 + 45];
const EVENING = [18 * 60 + 30, 21 * 60 + 45];

/** 0 at dusk and through the night, 1 in clear morning and day light. */
export function lightAt(minuteOfDay: number) {
	const m = ((minuteOfDay % 1440) + 1440) % 1440;
	if (m < DAWN[0]) return 0;
	if (m < DAWN[1]) return smooth((m - DAWN[0]) / (DAWN[1] - DAWN[0]));
	if (m < EVENING[0]) return 1;
	if (m < EVENING[1])
		return 1 - smooth((m - EVENING[0]) / (EVENING[1] - EVENING[0]));
	return 0;
}

/** The kit's tokens at this much light, as CSS custom properties. */
export function paletteAt(light: number): [string, string][] {
	const out: [string, string][] = PAIRS.map(([name, dusk, morning]) => [
		name,
		hex(
			dusk.map(
				(value, index) => value + ((morning[index] ?? value) - value) * light,
			),
		),
	]);
	out.push([
		"--anatomy-halo-opacity",
		`${Math.round((HALO[0] + (HALO[1] - HALO[0]) * light) * 100) / 100}`,
	]);
	return out;
}
