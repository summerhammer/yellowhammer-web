/**
 * "What it never does". Source: Product Scope § Never, by design, and messaging.md § Objections.
 */
export interface Never {
	title: string;
	body: string;
}

export const nevers: Never[] = [
	{
		title: "No code of its own",
		body: "Your agent CLIs write every line. Yellowhammer composes their instructions and reads their results.",
	},
	{
		title: "No merge to main",
		body: "It hands off at the pull request, one per touched repository. The merge is yours.",
	},
	{
		title: "No cloud execution",
		body: "Your code, credentials and models stay on your Mac. The Night runs on your existing subscriptions.",
	},
];
