/**
 * The bento grid. One large card for what Yellowhammer never does, medium cards for the path a
 * Work Card takes (in order), and small cards for two glossary terms. Copy follows the spec's
 * Product Scope, glossary and brand messaging.
 */

export interface BentoCard {
	title: string;
	body: string;
}

export const never = {
	title: "It never writes a line of code itself, and it never merges to main.",
	body: "The agent CLIs write the code. Yellowhammer judges between them: it chooses the work, sends each piece to an agent, checks the result and opens the pull requests. The merge stays yours.",
};

/** The path of one Work Card, in order. */
export const path: BentoCard[] = [
	{
		title: "Work Card",
		body: "A Linear issue Yellowhammer writes for one piece of the Feature in one repository.",
	},
	{
		title: "agent CLI",
		body: "Each Work Card goes to an agent CLI, model and effort suited to its kind. A retry always takes a route not yet tried on that Work Card.",
	},
	{
		title: "Worktree",
		body: "Each repository the Feature touches runs in its own Worktree from the Orca ADE, so lanes never touch each other's files.",
	},
	{
		title: "One pull request per repository",
		body: "One Feature comes back as one pull request per repository. A pull request with work missing says so in its first lines.",
	},
	{
		title: "Definition of Done",
		body: "What finished means, written before any code exists. Each clause points to your specification, and verification reports on every clause.",
	},
];

/** Glossary terms, as small cards. */
export const terms: BentoCard[] = [
	{
		title: "Bound",
		body: "A limit you set per Project: attempts, review rounds, unanswered Nights. When one fires, work stops with the reason instead of grinding.",
	},
	{
		title: "Waiting on You",
		body: "A Linear state for a question that needs your answer. You reply in Linear, whenever you like. Nothing depends on an answer during the Night.",
	},
];
