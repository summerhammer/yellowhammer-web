/**
 * The tools index. There are no third-party logos, so each entry is typographic:
 * a name, an optional command in mono, and one line on what Yellowhammer uses it for.
 */
export interface Tool {
	name: string;
	command?: string;
	use: string;
}

export interface ToolGroup {
	id: string;
	title: string;
	note: string;
	tools: Tool[];
}

export const toolGroups: ToolGroup[] = [
	{
		id: "required",
		title: "Required",
		note: "All of these.",
		tools: [
			{
				name: "A Mac on macOS 26",
				use: "Everything runs locally, on one Mac that stays awake through the Night.",
			},
			{
				name: "Orca ADE",
				use: "The agentic development environment it runs on top of. Orca creates, places and cleans up every Worktree.",
			},
			{
				name: "Linear",
				use: "The board. Intent comes in from it, and each Night's report goes back to it. In v1 you must be a workspace admin to run setup.",
			},
			{
				name: "GitHub",
				use: "Where each repository's pull request opens for your review.",
			},
		],
	},
	{
		id: "agent-clis",
		title: "Agent CLIs",
		note: "At least one. These are supported today.",
		tools: [
			{
				name: "Claude Code",
				command: "claude",
				use: "Writes the code for the Work Cards routed to it.",
			},
			{
				name: "Codex",
				command: "codex",
				use: "Writes the code for the Work Cards routed to it.",
			},
		],
	},
];
