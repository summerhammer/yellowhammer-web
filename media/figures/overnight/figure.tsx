import { Plate } from "../../kit/iso/react/draw";
import { OvernightArt } from "./art";
import {
	BLOCKED,
	BUILDS,
	CARD_COUNT,
	LAND_TEXT,
	PULL_REQUESTS,
	readoutOf,
	T_LAST,
} from "./shift";
import "./overnight.css";

export function OvernightFigure() {
	return (
		<Plate
			fig="Fig 1"
			title="The Overnight Shift"
			hint="Drag across to run the night"
			readout={readoutOf(T_LAST)}
			keys={[
				{ mark: "lit", label: "Pull requests, ready for review by morning" },
				{ mark: "raised", label: "An issue from Linear, as a Work Card" },
			]}
			caption={`In the evening, ${CARD_COUNT} issues from Linear wait on the left. At 22:00 Yellowhammer deals them into three lanes, one per repository, each in its own Orca Worktree, and goes to work while you sleep: launchd fires ${BUILDS} builds through the night, an agent works one card at a time in each lane, and every card meets review and checks at the gate. A card that fails goes back to its agent; one that passes slides into its lane's tray. A card that fails three Attempts is set aside rather than shipped. At ${LAND_TEXT} the trays land as ${PULL_REQUESTS} pull requests, one per repository, and you wake up to them ready for review, with ${BLOCKED} card Blocked for you to look at.`}
		>
			<OvernightArt />
		</Plate>
	);
}
