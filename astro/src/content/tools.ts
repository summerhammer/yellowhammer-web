/**
 * The tools Yellowhammer needs. There are no third-party logos in the artwork repo, so each tool is
 * a typographic card: its name and one line on what Yellowhammer uses it for.
 * Sources: Product Scope § System Components, the glossary, and messaging.md § Objections.
 */
export interface Tool {
	name: string;
	/** What Yellowhammer uses it for, in two or three words. */
	role: string;
	body: string;
}

export const tools: Tool[] = [
	{
		name: "Orca ADE",
		role: "Worktrees",
		body: "Creates, places and cleans up a Worktree for each Feature and repository. Yellowhammer only holds its id and path.",
	},
	{
		name: "Linear",
		role: "The board",
		body: "Intent comes from your Linear board, and every report goes back to it. In v1, the person running setup must be a workspace admin.",
	},
	{
		name: "GitHub",
		role: "Pull requests",
		body: "Receives each Feature Branch and one pull request per repository. Yellowhammer writes to it and never merges.",
	},
];

/**
 * Agent CLIs with an adapter and a probe in the spec: `claude` and `codex`
 * (routing/add-an-agent-cli, risks.md A2 and A3).
 */
export interface AgentCli {
	name: string;
	command: string;
}

export const agentClis: AgentCli[] = [
	{ name: "Claude Code", command: "claude" },
	{ name: "Codex", command: "codex" },
];
