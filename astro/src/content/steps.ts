/** How a Night runs, in plain steps, so the section reads without the figure. */

export interface Step {
	name: string;
	body: string;
}

export const steps: Step[] = [
	{
		name: "Author",
		body: "When no Work Cards are ready, Yellowhammer picks one Feature from your specification, even on an empty board, and writes its Work Cards, each with a Definition of Done.",
	},
	{
		name: "Build",
		body: "Through the Night, each Work Card goes to an agent CLI in its own Worktree. Work Cards for one repository run in order; repositories run side by side.",
	},
	{
		name: "Land",
		body: "When no Work Card is left unfinished, each Feature Branch is pushed and one pull request opens per repository. Each Definition of Done clause is verified against your specification.",
	},
	{
		name: "Night Summary",
		body: "The Night Card on your board carries the account: what landed, what is blocked, what needs you. It is written every Night, including the ones where nothing was ready.",
	},
];
