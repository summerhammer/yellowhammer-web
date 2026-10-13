import { Dots, Line, Solid } from "../iso/react/draw";
import {
	BACKLOG_ART,
	BASE_ART,
	BED_ART,
	CLOCK_ART,
	GANTRY_ART,
	HEAD_ART,
	LANE_ART,
	NIGHT_CARD_ART,
	REJECT_ART,
	STRIKER_ART,
} from "./geometry";
import { type LaneParts, OvernightLive } from "./live";

const BASE = (
	<g key="base">
		<path className="iso-halo" d={BASE_ART.halo} />
		{BASE_ART.feet.map((parts, index) => (
			<g key={index}>
				{parts.map((paths, part) => (
					<Solid
						key={part}
						paths={paths}
						tone={part ? "mid" : "lo"}
						crease="faint"
					/>
				))}
			</g>
		))}
		<Solid
			paths={BASE_ART.slab}
			tone="mid"
			crease="faint"
			inner={<Line d={BASE_ART.seam} tone="faint" />}
		/>
		<Line d={BASE_ART.groove} tone="lo" />
		<Line d={BASE_ART.screwRings} tone="lo" />
		<Dots points={BASE_ART.screws} size={0.5} tone="mid" />
		<Solid paths={BASE_ART.plate} tone="lo" crease="none" />
		<Line d={BASE_ART.plateLine} tone="faint" />
		<Line d={BASE_ART.plateRule} tone="lo" free />
		<Dots points={BASE_ART.plateScrews} size={0.45} tone="mid" />
	</g>
);

const STAND = (
	<g key="stand">
		<Solid
			paths={CLOCK_ART.stand}
			tone="mid"
			crease="faint"
			inner={<Line d={CLOCK_ART.standSeam} tone="faint" />}
		/>
		<Dots points={CLOCK_ART.standScrews} size={0.45} tone="mid" />
		<Line d={CLOCK_ART.slot} tone="lo" />
	</g>
);

const NIGHT_CARD = (
	<g key="night-card">
		<Solid paths={NIGHT_CARD_ART.body} tone="hi" crease="faint" />
		<Line d={NIGHT_CARD_ART.rules} tone="lo" free />
	</g>
);

const DIAL = (
	<g key="dial">
		<Solid paths={CLOCK_ART.crown} tone="mid" crease="faint" />
		<Solid
			paths={CLOCK_ART.crownCap}
			tone="mid"
			crease="faint"
			inner={<Line d={CLOCK_ART.crownKnurl} tone="faint" />}
		/>
		<Solid
			paths={CLOCK_ART.puck}
			tone="mid"
			crease="faint"
			inner={<Line d={CLOCK_ART.knurl} tone="faint" />}
		/>
		<Line d={CLOCK_ART.band} tone="faint" />
		<Line d={CLOCK_ART.bezel} tone="lo" />
		<Line d={CLOCK_ART.face} tone="faint" />
		<Solid
			paths={CLOCK_ART.night}
			tone="lo"
			crease="none"
			flat
			className="ov-night"
		/>
		<Line d={CLOCK_ART.minor} tone="lo" />
		<Line d={CLOCK_ART.major} tone="mid" />
	</g>
);

const HUB = (
	<g key="hub">
		<Solid paths={CLOCK_ART.hub} tone="hi" crease="none" />
	</g>
);

const STRIKER_BODY = (
	<g key="striker">
		<Solid
			paths={STRIKER_ART.housing}
			tone="mid"
			crease="faint"
			inner={<Line d={STRIKER_ART.seam} tone="faint" />}
		/>
		<Dots points={STRIKER_ART.screws} size={0.45} tone="mid" />
		<Line d={STRIKER_ART.seal} tone="faint" />
	</g>
);

const STRIKER_ROD = (
	<g key="striker-rod">
		<Solid paths={STRIKER_ART.rod} tone="mid" crease="none" />
		<Solid paths={STRIKER_ART.cap} tone="hi" crease="faint" />
	</g>
);

const COLUMN = (
	<g key="column">
		<Solid paths={GANTRY_ART.foot} tone="lo" crease="faint" />
		<Dots points={GANTRY_ART.footScrews} size={0.45} tone="mid" />
		<Solid
			paths={GANTRY_ART.column}
			tone="mid"
			crease="faint"
			inner={<Line d={GANTRY_ART.columnSeams} tone="faint" />}
		/>
	</g>
);

const BED = (
	<g key="bed">
		<Solid
			paths={BED_ART.slab}
			tone="mid"
			crease="faint"
			inner={<Line d={BED_ART.seam} tone="faint" />}
		/>
		<Dots points={BED_ART.screws} size={0.5} tone="mid" />
	</g>
);

const LANES: LaneParts[] = LANE_ART.map((lane, index) => ({
	back: (
		<g key={`lane-back-${index}`}>
			<Line d={lane.track} tone="faint" />
			{lane.rails.map((paths, rail) => (
				<Solid key={rail} paths={paths} tone="mid" crease="faint" />
			))}
			{lane.stops.map((paths, stop) => (
				<Solid key={stop} paths={paths} tone="mid" crease="faint" />
			))}
			<Dots points={lane.stopScrews} size={0.4} tone="mid" />
			<Solid paths={lane.tag.plate} tone="lo" crease="none" />
			<Line d={lane.tag.line} tone="faint" />
			<Line d={lane.tag.rule} tone="lo" free />
			<Dots points={lane.tag.screws} size={0.35} tone="mid" />
			<Solid paths={lane.magazine.floor} tone="lo" crease="faint" />
			<Line d={lane.magazine.floorLine} tone="faint" />
			<Solid paths={lane.magazine.back} tone="mid" crease="faint" />
			<Solid paths={lane.magazine.end} tone="mid" crease="faint" />
			<Dots points={lane.magazine.screws} size={0.4} tone="mid" />
		</g>
	),
	card: (
		<g key={`card-${index}`}>
			<Solid paths={lane.card.body} tone="hi" crease="faint" />
			<Line d={lane.card.rules} tone="lo" free />
			<Line d={lane.card.holeRings} tone="faint" />
			<g className="iso-dots ov-holes" data-tone="hi">
				{lane.card.holes.map(([x, y], k) => (
					<circle key={k} className="ov-hole" cx={x} cy={y} r={0.5} />
				))}
			</g>
		</g>
	),
	carriage: (
		<g key={`carriage-${index}`}>
			<path className="iso-halo ov-shadow" d={lane.carriage.halo} />
			<Solid paths={lane.carriage.plate} tone="mid" crease="faint" />
			<Line d={lane.carriage.seat} tone="faint" />
			{lane.carriage.clips.map((paths, clip) => (
				<Solid key={clip} paths={paths} tone="mid" crease="faint" />
			))}
			<Dots points={lane.carriage.screws} size={0.45} tone="mid" />
			<Dots points={lane.carriage.rivets} size={0.38} tone="lo" />
			<Line d={lane.carriage.pipRings} tone="faint" />
			<g className="iso-dots ov-pips" data-tone="lo">
				{lane.carriage.attempts.map(([x, y], k) => (
					<circle
						key={`a${k}`}
						className="ov-pip"
						data-pip="attempt"
						data-k={k}
						cx={x}
						cy={y}
						r={0.62}
					/>
				))}
				{lane.carriage.rounds.map(([x, y], k) => (
					<circle
						key={`r${k}`}
						className="ov-pip"
						data-pip="round"
						data-k={k}
						cx={x}
						cy={y}
						r={0.62}
					/>
				))}
			</g>
		</g>
	),
	gateBack: (
		<g key={`gate-back-${index}`}>
			<Solid paths={lane.gate.back} tone="mid" crease="faint" />
			<Solid paths={lane.gate.caps[0]} tone="mid" crease="faint" />
			<Dots points={lane.gate.capScrews.slice(0, 1)} size={0.4} tone="mid" />
		</g>
	),
	bar: (
		<g key={`bar-${index}`}>
			<Solid
				paths={lane.gate.bar}
				tone="hi"
				crease="faint"
				inner={<Line d={lane.gate.barLine} tone="faint" />}
			/>
		</g>
	),
	gateFront: (
		<g key={`gate-front-${index}`}>
			<Solid paths={lane.gate.front} tone="mid" crease="faint" />
			<Solid paths={lane.gate.caps[1]} tone="mid" crease="faint" />
			<Dots points={lane.gate.capScrews.slice(1)} size={0.4} tone="mid" />
		</g>
	),
	pocketBack: (
		<g key={`pocket-back-${index}`}>
			<Solid
				paths={lane.pocket.floor}
				tone="hi"
				crease="faint"
				lit
				className="ov-tray"
			/>
			<Line d={lane.pocket.floorLine} tone="faint" />
			<Solid
				paths={lane.pocket.fence}
				tone="hi"
				crease="faint"
				lit
				className="ov-tray"
			/>
		</g>
	),
	pocketFront: (
		<g key={`pocket-front-${index}`}>
			<Solid
				paths={lane.pocket.stop}
				tone="hi"
				crease="faint"
				lit
				className="ov-tray"
			/>
			<Dots points={lane.pocket.stopScrews} size={0.4} tone="mid" />
			<Solid paths={lane.pocket.post} tone="mid" crease="none" />
		</g>
	),
	flag: (
		<g key={`flag-${index}`}>
			<Solid
				paths={lane.pocket.flag}
				tone="hi"
				crease="faint"
				lit
				className="ov-tray"
			/>
		</g>
	),
	postCap: (
		<g key={`post-cap-${index}`}>
			<Solid paths={lane.pocket.postCap} tone="mid" crease="faint" />
		</g>
	),
}));

const BACKLOG = (
	<g key="backlog">
		<Solid paths={BACKLOG_ART.floor} tone="lo" crease="faint" />
		<Line d={BACKLOG_ART.floorLine} tone="faint" />
		<Solid paths={BACKLOG_ART.back} tone="mid" crease="faint" />
		<Solid paths={BACKLOG_ART.end} tone="mid" crease="faint" />
		<Dots points={BACKLOG_ART.screws} size={0.4} tone="mid" />
		<Dots points={BACKLOG_ART.fenceScrews} size={0.4} tone="mid" />
	</g>
);

const REJECT_BACK = (
	<g key="reject-back">
		<Solid paths={REJECT_ART.floor} tone="lo" crease="faint" />
		<Line d={REJECT_ART.floorLine} tone="faint" />
		<Solid paths={REJECT_ART.back} tone="mid" crease="faint" />
		<Solid paths={REJECT_ART.left} tone="mid" crease="faint" />
	</g>
);

const REJECT_FRONT = (
	<g key="reject-front">
		<Solid paths={REJECT_ART.right} tone="mid" crease="faint" />
		<Solid paths={REJECT_ART.front} tone="mid" crease="faint" />
		<Dots points={REJECT_ART.screws} size={0.4} tone="mid" />
	</g>
);

const HEADS = HEAD_ART.map((head, index) => ({
	stylus: (
		<g key={`stylus-${index}`}>
			<Solid
				paths={head.stylus}
				tone="mid"
				crease="none"
				inner={<Line d={head.stylusMarks} tone="faint" />}
			/>
			<Solid paths={head.pad} tone="hi" crease="faint" />
		</g>
	),
	body: (
		<g key={`head-${index}`}>
			<Solid paths={head.collar} tone="mid" crease="faint" />
			<Solid
				paths={head.housing}
				tone="mid"
				crease="none"
				inner={<Line d={`${head.knurl}${head.seams}`} tone="faint" />}
			/>
			<Solid paths={head.cap} tone="mid" crease="faint" />
		</g>
	),
	clip: head.stylusClip,
}));

const ARM = (
	<g key="arm">
		<Solid
			paths={GANTRY_ART.arm}
			tone="mid"
			crease="faint"
			inner={<Line d={GANTRY_ART.armSeam} tone="faint" />}
		/>
		<Dots points={GANTRY_ART.armScrews} size={0.45} tone="mid" />
		<Solid paths={GANTRY_ART.armCap} tone="mid" crease="faint" />
	</g>
);

export const LABEL =
	"The overnight Shift as a card bench under a 24-hour time clock. In the evening the bench is dim and tonight's issues from Linear wait in a stack on the left. At 22:00 they are dealt into three lanes, one per repository. Through the night an agent head on the gantry works one card at a time in each lane, punching its holes as the work goes; a review gate sends a card that fails back to its head, and lets one that passes through to the yellow tray at the end of its lane. One card runs out of Attempts and is set aside. Toward morning the light comes up, each tray raises its flag, and by 07:00 three pull requests sit ready for review.";

export function OvernightArt() {
	return (
		<OvernightLive
			label={LABEL}
			base={BASE}
			stand={STAND}
			nightCard={NIGHT_CARD}
			nightClip={NIGHT_CARD_ART.clip}
			dial={DIAL}
			hub={HUB}
			striker={STRIKER_BODY}
			strikerRod={STRIKER_ROD}
			strikerClip={STRIKER_ART.clip}
			column={COLUMN}
			bed={BED}
			lanes={LANES}
			backlog={BACKLOG}
			rejectBack={REJECT_BACK}
			rejectFront={REJECT_FRONT}
			heads={HEADS}
			arm={ARM}
		/>
	);
}
