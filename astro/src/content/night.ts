/**
 * "How a Night runs": the four stops of one example Night, from the Feature it picked to the verdict
 * it left. Sources: messaging spec (Night, Feature, Work Card, Route, Definition of Done, Night
 * Card, Night Summary, Waiting on You, Blocked). Bounds are described in plain words
 * (messaging.md § Vocabulary).
 */
export interface NightStop {
	/** Clock time of the example Night, shown in mono. */
	time: string;
	/** Phase label shown next to the time. */
	phase: string;
	title: string;
	/** A second line under the title, in strong weight. */
	subtitle?: string;
	body: string;
	/** Examples shown as mono lines in a quiet box, under a small label. */
	verdicts?: { label: string; lines: string[] };
	/** Id of the screenshot in shots.ts. */
	shot: string;
}

export const nightStops: NightStop[] = [
	{
		time: "22:00",
		phase: "Pick",
		title: "It picks the work.",
		body: "Each Night it reads your specification and picks the next Feature, plus the repos it touches, even on a Night that started with an empty board. Then it writes the Work Cards: one Linear issue per piece of the Feature, per repo. The Feature carries a Definition of Done: what “finished” means, written before any code exists, every line pointing to your spec.",
		shot: "S3",
	},
	{
		time: "22:16",
		phase: "Build",
		title: "Your agents write the code.",
		subtitle: "A failed try goes to a different model, then it stops.",
		body: "Each Work Card runs in its own Worktree on a Route: which agent CLI, model and effort level runs it. Several repos build side by side. A retry always uses a Route not yet tried on that Work Card. Retries are capped by limits you set, and a Work Card that still cannot be finished comes back to you as Blocked or Waiting on You, with the reason.",
		shot: "S4",
	},
	{
		time: "05:30",
		phase: "Land",
		title: "One Feature, one pull request per repository.",
		subtitle: "“Done” cites your spec, clause by clause.",
		body: "Multi-repo work comes back as one pull request per repo instead of disconnected tickets, and a pull request with work missing says so in its first lines. Verification reports on each Definition of Done clause, never a bare “passed”. The merge stays yours.",
		shot: "S5",
	},
	{
		time: "08:00",
		phase: "Morning",
		title: "A verdict on the board every morning.",
		body: "Every Night gets one Night Card, the Linear issue that carries each Night's report. A crashed Night, an empty Night and a productive Night each say what they were, so you never open a terminal to find out.",
		verdicts: {
			label: "Examples of the verdict a Night Summary leads with.",
			lines: [
				"Night done. Nothing was ready.",
				"Blocked: check failure. Answer it in Linear, not here.",
			],
		},
		shot: "S6",
	},
];
