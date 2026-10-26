/**
 * "Works with": the products Yellowhammer sits on. Source: messaging.md § Objections ("Does it
 * replace my tools?") and Product Scope § System Components.
 */

/**
 * An official mark, copied unchanged from yellowhammer-artwork/logos/vendors (SOURCES.md there lists
 * each source and its usage terms). Paths are under /vendors/ in astro/public.
 */
export interface VendorLogo {
	light: string;
	dark: string;
	/**
	 * How much empty space the file draws around its glyph, so every mark renders at the same optical
	 * size: "wide" fills about half its viewBox (OpenAI), "medium" about 70% (Antigravity).
	 */
	fit?: "wide" | "medium";
	/** The vendor publishes only a white mark: on light, it sits on a dark plate. */
	plate?: boolean;
}

export const marks = {
	orca: {
		light: "/vendors/orca-white.svg",
		dark: "/vendors/orca-white.svg",
		plate: true,
	},
	linear: {
		light: "/vendors/linear-black.svg",
		dark: "/vendors/linear-white.svg",
	},
	github: {
		light: "/vendors/github-black.svg",
		dark: "/vendors/github-white.svg",
	},
	/** Anthropic publishes the bare spark in clay only, and its colour may not be changed. */
	claude: { light: "/vendors/claude.svg", dark: "/vendors/claude.svg" },
	/** Codex has no mark of its own; OpenAI's blossom stands in. */
	openai: {
		light: "/vendors/openai-black.svg",
		dark: "/vendors/openai-white.svg",
		fit: "wide",
	},
	antigravity: {
		light: "/vendors/antigravity-black.svg",
		dark: "/vendors/antigravity-white.svg",
		fit: "medium",
	},
} satisfies Record<string, VendorLogo>;

export interface Vendor {
	name: string;
	logo?: VendorLogo;
}

export const vendors: Vendor[] = [
	{ name: "Orca ADE", logo: marks.orca },
	{ name: "Linear", logo: marks.linear },
	{ name: "GitHub", logo: marks.github },
	{ name: "Claude Code", logo: marks.claude },
	{ name: "Codex", logo: marks.openai },
	{ name: "Antigravity", logo: marks.antigravity },
];
