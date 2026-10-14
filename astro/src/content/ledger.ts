/** The "Does / Never does" ledger. Each entry is one ruled row: a short verdict, then the reason. */
export interface LedgerRow {
	head: string;
	body: string;
}

export const does: LedgerRow[] = [
	{
		head: "Takes intent from your Linear board.",
		body: "Linear is the board. Yellowhammer reads it and writes back to it.",
	},
	{
		head: "Authors the work when the board is empty.",
		body: "It picks the next Feature from your specification and writes its Work Cards: one Linear issue for each piece of the Feature, in one repository.",
	},
	{
		head: "Writes the Definition of Done before any code exists.",
		body: "Each clause points to a location in your specification.",
	},
	{
		head: "Routes each Work Card to an agent CLI.",
		body: "A route is one agent CLI, model and effort level. A failed try goes to a route not yet tried, then it stops, at limits you set.",
	},
	{
		head: "Runs each Work Card in a Worktree.",
		body: "Orca ADE creates the Worktree and cleans it up.",
	},
	{
		head: "Opens one pull request per repository.",
		body: "A pull request with work missing says so in its first lines.",
	},
	{
		head: "Verifies against the Definition of Done.",
		body: "Verification reports on each clause, never a bare pass.",
	},
	{
		head: "Reports back to the board.",
		body: "Every Night ends with a Night Summary on its Night Card, including the Nights where nothing was ready.",
	},
];

export const never: LedgerRow[] = [
	{
		head: "Writes a line of code.",
		body: "The agent CLIs write the code. Yellowhammer composes their instructions, reads their results and judges between them.",
	},
	{
		head: "Merges to main.",
		body: "It hands off at the pull request. The merge is yours.",
	},
	{
		head: "Deploys or releases.",
		body: "Not deferred. Never.",
	},
	{
		head: "Runs in the cloud.",
		body: "Everything runs on your Mac, on the agent subscriptions you already have.",
	},
	{
		head: "Keeps a second board.",
		body: "You answer what is Waiting on You in Linear, whenever you like.",
	},
];
