/**
 * The tools Yellowhammer runs on. There are no third-party logos in the artwork repo, so each tool
 * is a typographic tile: its name and one line on what Yellowhammer uses it for.
 */

export interface Tool {
	name: string;
	use: string;
}

/** Required, shown as three large tiles. */
export const required: Tool[] = [
	{
		name: "Orca ADE",
		use: "The agentic development environment Yellowhammer runs on top of. It creates and cleans up every Worktree.",
	},
	{
		name: "Linear",
		use: "The board. Intent comes in from it, and Work Cards, the Night Card and every question go back to it.",
	},
	{
		name: "GitHub",
		use: "Receives each Feature Branch and one pull request per repository. Yellowhammer writes to it and never merges.",
	},
];

export interface AgentCli {
	name: string;
	/** The command the CLI Adapter dispatches. */
	command: string;
}

/**
 * Supported agent CLIs: the ones with a CLI Adapter in the app. The spec names no list (its routing
 * epic and rulings mention `claude` and `codex` as examples); this follows the app repository's
 * `RegisteredCLIAdapters.names` (`claude`, `codex`, `agy`).
 */
export const agentClis: AgentCli[] = [
	{ name: "Claude Code", command: "claude" },
	{ name: "Codex", command: "codex" },
	{ name: "Antigravity", command: "agy" },
];

/** What you need, in one list. */
export const needs: string[] = [
	"A Mac on macOS 26 that stays awake overnight",
	"The Orca ADE",
	"A Linear workspace (in v1, you need to be a workspace admin to run setup)",
	"GitHub",
	"At least one supported agent CLI",
];
