import {
	boxCorners,
	fitProjection,
	iso,
	type Plan,
	type Point3,
} from "../../kit/iso/iso-kit";
import { CARD_COUNT, type Layout, type Stations } from "./shift";

export const WIDTH = 600;
export const HEIGHT = 318;
export const AZIMUTH = 57;

// The bench: a base plate on feet, carrying the time clock at the back left,
// Orca's lane bed with three Repo Lanes, a gantry of agent heads and the pockets.
export const BASE: Plan = { x: -174, y: -84, w: 344, d: 168, r: 9 };
export const BASE_H = 9;
export const FOOT_H = 5;

export const BED: Plan = { x: -120, y: -56, w: 272, d: 112, r: 4 };
export const BED_H = 4;

export const LANE_Y = [-36, 0, 36];
export const RAIL_H = 2.5;
export const RAIL_TOP = BED_H + RAIL_H;
export const RAIL_OFF = [-9, 6];
export const RAIL_D = 3;
export const RAIL_X0 = -114;
export const RAIL_X1 = 108;

export const CARRIAGE_HALF = [16, 11] as const;
export const CARRIAGE_H = 4;
export const SEAT_Z = RAIL_TOP + CARRIAGE_H;

export const CARD_HALF = [13, 7.5] as const;
export const CARD_H = 1.1;
export const PITCH = 1.5;

export const MAG_X = -95;
export const MAG_Z = BED_H + 2;

export const STATIONS: Stations = { home: -62, head: 0, gate: 44, pocket: 90 };

export const GATE_X = 64;
export const GATE_W = 3;
export const GATE_LIFT = 13;
export const POST_H = 22;

export const POCKET_X = 112;
export const POCKET_W = 36;
export const POCKET_FLOOR = BED_H + 2;
export const POCKET_CARD_X = 128;

export const REJECT: Plan = { x: 26, y: 59, w: 40, d: 23, r: 2 };
export const REJECT_FLOOR = 2;

export const COLUMN: Plan = { x: -7, y: -76, w: 14, d: 12, r: 2 };
export const ARM_Z = 40;
export const ARM_H = 7;
export const ARM_Y1 = 50;
export const HEAD_R = 5.5;
export const HEAD_Z = 26;
export const STYLUS_Z = SEAT_Z + CARD_H + 1.4;

export const CLOCK = [-145, -56] as const;
export const CLOCK_STAND: Plan = { x: -166, y: -77, w: 42, d: 42, r: 4 };
export const STAND_H = 10;
export const DIAL_R = 18;
export const DIAL_H = 5;
export const DIAL_TOP = STAND_H + DIAL_H;
export const STRIKER: Plan = { x: -124, y: -72, w: 14, d: 14, r: 2 };
export const STRIKER_H = 13;
export const STRIKE_LIFT = 4.5;

export const SLOT_Y = CLOCK_STAND.y + CLOCK_STAND.d;
export const SLOT_Z = 4;
export const NIGHT_OUT = 16;

/** The backlog: tonight's issues from Linear, stacked in a tray left of the bed. */
export const BACKLOG_X = -146;
export const BACKLOG_Y = 8;
export const BACKLOG_Z = 2;
export const BACKLOG: Plan = {
	x: BACKLOG_X - 16.5,
	y: BACKLOG_Y - 11,
	w: 33,
	d: 22,
	r: 2,
};

export const LABEL: Plan = { x: -162, y: 46, w: 46, d: 14, r: 2 };

export const P = fitProjection(
	[
		...boxCorners(BASE, -BASE_H - FOOT_H, 0),
		...boxCorners(
			{ x: COLUMN.x, y: COLUMN.y, w: 14, d: ARM_Y1 - COLUMN.y, r: 0 },
			ARM_Z,
			ARM_Z + ARM_H,
		),
		...boxCorners(CLOCK_STAND, 0, DIAL_TOP + 4),
	],
	WIDTH,
	HEIGHT,
	{ pad: 18, azimuth: AZIMUTH },
);

export const at = (point: Point3) => iso(point, P);

export const LAYOUT: Layout = {
	stations: STATIONS,
	seat: STATIONS.home - MAG_X,
	pitch: PITCH,
	seatRise: SEAT_Z - MAG_Z,
	pocket: (k) => [POCKET_CARD_X - MAG_X, 0, POCKET_FLOOR - MAG_Z + k * PITCH],
	reject: (k) => [
		REJECT.x + REJECT.w / 2 - MAG_X,
		REJECT.y + REJECT.d / 2 - LANE_Y[2],
		REJECT_FLOOR - MAG_Z + k * PITCH,
	],
	backlog: (lane, d) => [
		BACKLOG_X - MAG_X,
		BACKLOG_Y - (LANE_Y[lane] ?? 0),
		BACKLOG_Z - MAG_Z + (CARD_COUNT - 1 - d) * PITCH,
	],
	above: 16,
};
