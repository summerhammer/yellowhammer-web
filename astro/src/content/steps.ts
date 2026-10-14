/**
 * "How it works": the three Acts of a Night and the Night Summary.
 * Sources: glossary (Act, Night, Work Card, Repo Lane, Definition of Done, Night Summary, Waiting on You)
 * and Product Scope § In Scope. Bounds are described in plain words (messaging.md § Vocabulary).
 */
export interface Step {
	/** The Act name, or the artifact, shown in mono. */
	act: string;
	title: string;
	body: string;
}

export const steps: Step[] = [
	{
		act: "author",
		title: "It picks the work",
		body: "It selects one Feature from your specification and works out which repositories it touches. It writes the Work Cards, each with a Definition of Done written before any code exists. It does this even when the board is empty.",
	},
	{
		act: "build",
		title: "Your agents write the code",
		body: "Each Work Card goes to an agent CLI and runs in a Worktree, one Repo Lane per repository. The engine runs each repository's check itself. A failed try goes to a different model, then stops at limits you set.",
	},
	{
		act: "land",
		title: "One pull request per repository",
		body: "It pushes each Feature Branch and opens one pull request per repository. A different agent verifies the Feature clause by clause against its Definition of Done. The merge stays yours.",
	},
	{
		act: "Night Summary",
		title: "You read the verdict",
		body: "The Night Summary on your board says what landed, what is blocked and what needs you. A Work Card that needs an answer goes to Waiting on You, and you answer it in Linear.",
	},
];
