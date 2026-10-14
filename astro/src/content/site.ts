/** Links and short strings shared by more than one section. */
export const site = {
	name: "Yellowhammer",
	/** Unversioned asset name. It 404s until the app's release pipeline publishes it; that is expected. */
	download:
		"https://github.com/summerhammer/yellowhammer/releases/latest/download/Yellowhammer.dmg",
	repo: "https://github.com/summerhammer/yellowhammer",
	/** There is no docs site yet; the app's README stands in for it. */
	docs: "https://github.com/summerhammer/yellowhammer#readme",
	requires: "Requires macOS 26",
	trust: "Your code, credentials and models stay on your Mac.",
	licence: "MIT licence",
	copyright: "© Summer Hammer, LLC",
} as const;
