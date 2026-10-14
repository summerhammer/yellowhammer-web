/** Links and short strings shared by more than one section. */
export const site = {
	name: "Yellowhammer",
	/** Unversioned asset name, published by the app's release pipeline and verified as the launch gate. */
	download:
		"https://github.com/summerhammer/yellowhammer/releases/latest/download/Yellowhammer.dmg",
	repo: "https://github.com/summerhammer/yellowhammer",
	requires: "Requires macOS 26",
	trust: "Your code, credentials and models stay on your Mac.",
	licence: "MIT licence",
	copyright: "© Summer Hammer, LLC",
} as const;
