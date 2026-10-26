/**
 * "Works with": the products Yellowhammer sits on. Source: messaging.md § Objections ("Does it
 * replace my tools?") and Product Scope § System Components.
 */
export interface Vendor {
	name: string;
	/**
	 * Paths under /vendors/ in astro/public: official marks copied unchanged from
	 * yellowhammer-artwork/logos/vendors (SOURCES.md there lists each source). Absent means name only:
	 * Claude needs Anthropic's prior approval, and Orca publishes no mark for light backgrounds.
	 */
	logo?: { light: string; dark: string };
}

export const vendors: Vendor[] = [
	{ name: "Orca ADE" },
	{
		name: "Linear",
		logo: {
			light: "/vendors/linear-black.svg",
			dark: "/vendors/linear-white.svg",
		},
	},
	{
		name: "GitHub",
		logo: {
			light: "/vendors/github-black.svg",
			dark: "/vendors/github-white.svg",
		},
	},
	{ name: "Claude Code" },
	{
		name: "Codex",
		logo: {
			light: "/vendors/openai-black.svg",
			dark: "/vendors/openai-white.svg",
		},
	},
	{
		name: "Antigravity",
		logo: {
			light: "/vendors/antigravity-black.svg",
			dark: "/vendors/antigravity-white.svg",
		},
	},
];
