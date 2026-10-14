/**
 * "How it works": how a Night runs and its morning verdict.
 * Sources: messaging spec (Night, Feature, Work Card, Route, Partial Landing, Definition of Done, Night Card, Night Summary, Waiting on You, Blocked).
 * Bounds are described in plain words (messaging.md § Vocabulary).
 */
export interface Step {
	/** Phase label shown in mono. */
	label: string;
	title: string;
	body: string;
}

export const steps: Step[] = [
	{
		label: "select",
		title: "It picks the work",
		body: "Yellowhammer selects one Feature—the one feature from your specification that a Night works on, with only one in flight per product at a time—and works out which repositories it touches. It writes the Work Cards, a Linear issue Yellowhammer writes for one piece of the Feature in one repo, each with a Definition of Done: what 'finished' means for the Feature, written before any code exists, each line pointing to your spec. It does this even when the board is empty.",
	},
	{
		label: "build",
		title: "Your agents write the code",
		body: "Each Work Card goes to an agent CLI and runs in an isolated Worktree. Each piece of work runs on a route: which agent CLI, model and effort level runs a piece of work. A retry always uses a route not yet tried on that Work Card. Retries are capped by limits you set: attempts per Work Card, review rounds and unanswered Nights. Runaways are stopped by integer counters, never spend claims.",
	},
	{
		label: "land",
		title: "One pull request per repository",
		body: "Multi-repo work comes back as one pull request per touched repository instead of disconnected tickets. If work is missing, it opens as a Partial Landing: a pull request that opened with a named hole, saying which work did not happen and why in its first lines. Yellowhammer verifies the Feature clause by clause against its Definition of Done. The merge is yours—Yellowhammer never merges.",
	},
	{
		label: "verdict",
		title: "An honest morning verdict",
		body: "Every Night gets one Night Card, the Linear issue that carries each Night's report—it exists every Night, even when nothing ran. A crashed Night, an empty Night and a productive Night each say what they were, so you never open a terminal to find out. Its Night Summary reports what landed, what is Blocked (stopped for tonight, with the reason written down), and what needs you. Any question goes to Waiting on You, a Linear state for 'this needs your answer' that you answer in Linear whenever you like.",
	},
];
