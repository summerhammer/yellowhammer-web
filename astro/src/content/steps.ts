/** "How it works": the three Acts of a Night, then the report. */
export interface Step {
	name: string;
	/** The Act's own name, set in mono. Absent for the report. */
	act?: string;
	body: string;
}

export const steps: Step[] = [
	{
		name: "Author",
		act: "author",
		body: "When no Work Cards are ready, Yellowhammer reads your specification and picks the next Feature. It writes the Work Cards and the Definition of Done before any code exists.",
	},
	{
		name: "Build",
		act: "build",
		body: "Each Work Card goes to an agent CLI, in its own Worktree. Its checks run, then a review. A Work Card that fails goes back for another try on a different route, until a limit you set stops it.",
	},
	{
		name: "Land",
		act: "land",
		body: "The finished work of each repository goes up as one pull request. Verification reports on every clause of the Definition of Done.",
	},
	{
		name: "Night Summary",
		body: "The Night Card on your board says what landed, what is Blocked and what is Waiting on You. You read it in the morning and answer in Linear.",
	},
];
