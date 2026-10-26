/**
 * The tools Yellowhammer needs: each card names the tool and says in one line what Yellowhammer uses
 * it for. A `logo` pair (official marks under /vendors/, see content/vendors.ts) is shown when one
 * may be used.
 * Sources: Product Scope § System Components, the glossary, and messaging.md § Objections.
 */
export interface Tool {
	name: string;
	/** What Yellowhammer uses it for, in two or three words. */
	role: string;
	body: string;
	logo?: { light: string; dark: string };
}

export const tools: Tool[] = [
	{
		name: "Orca ADE",
		role: "Worktrees",
		body: "Creates, places and cleans up a Worktree for each Feature and repository. Yellowhammer only holds its id and path.",
	},
	{
		name: "Linear",
		logo: {
			light: "/vendors/linear-black.svg",
			dark: "/vendors/linear-white.svg",
		},
		role: "The board",
		body: "Intent comes from your Linear board, and every report goes back to it. In v1, the person running setup must be a workspace admin.",
	},
	{
		name: "GitHub",
		logo: {
			light: "/vendors/github-black.svg",
			dark: "/vendors/github-white.svg",
		},
		role: "Pull requests",
		body: "Receives each Feature Branch and one pull request per touched repository. Yellowhammer writes to it and never merges.",
	},
];

/**
 * Agent CLIs with an adapter and a probe in the spec. The app registers the adapters `claude`,
 * `codex` and `agy` (YellowhammerKit CLIAdapterRegistry), and spec rulings use `agy` as an agent CLI
 * (routing/add-an-agent-cli, risks.md A2 and A3).
 */
export interface AgentCli {
	name: string;
	command: string;
	logo?: { light: string; dark: string };
}

export const agentClis: AgentCli[] = [
	{ name: "Claude Code", command: "claude" },
	{
		name: "Codex",
		command: "codex",
		logo: {
			light: "/vendors/openai-black.svg",
			dark: "/vendors/openai-white.svg",
		},
	},
	{
		name: "Antigravity",
		command: "agy",
		logo: {
			light: "/vendors/antigravity-black.svg",
			dark: "/vendors/antigravity-white.svg",
		},
	},
];
