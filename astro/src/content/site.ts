/** Links and fixed strings used by more than one section. */

export const links = {
	/** Unversioned asset name. It 404s until the app's release pipeline publishes it; that is expected. */
	download:
		"https://github.com/summerhammer/yellowhammer/releases/latest/download/Yellowhammer.dmg",
	repo: "https://github.com/summerhammer/yellowhammer",
	/** There is no docs site yet: Docs points at the repository README. */
	docs: "https://github.com/summerhammer/yellowhammer#readme",
} as const;

export const requires = "Requires macOS 26";

/** The first-screen trust line (brand messaging, Calls to Action). */
export const trustLine = "Your code, credentials and models stay on your Mac.";
