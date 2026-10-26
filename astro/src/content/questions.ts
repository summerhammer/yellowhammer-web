import { site } from "./site";

/**
 * "Questions". Source: spec docs/brand/messaging.md § Objections.
 */
export interface Question {
	question: string;
	answer: string;
	/** Turns `text`, which must appear in `answer`, into a link. */
	link?: { text: string; href: string };
}

export const questions: Question[] = [
	{
		question: "Where does my code go?",
		answer:
			"Nowhere. Your code, credentials and models stay on your Mac, and the Night runs on your existing subscriptions.",
	},
	{
		question: "Will it push something broken to main?",
		answer:
			"It never merges. Your agents write the code, Yellowhammer opens one pull request per repo, and the merge is yours.",
	},
	{
		question: "What if it builds the wrong thing well?",
		answer:
			"It can. Every Definition of Done clause cites your spec, which makes that auditable, not impossible.",
	},
	{
		question: "Will it burn through my usage overnight?",
		answer:
			"It does not track cost. It stops by counting: attempts per Work Card, review rounds and unanswered Nights, all set per Project by you.",
	},
	{
		question: "What if it needs me at 3am?",
		answer:
			"The Work Card goes to Waiting on You and you answer it in Linear whenever you like. Nothing depends on an answer during the Night.",
	},
	{
		question: "Does it replace my tools?",
		answer:
			"No. It sits on top of Orca, Linear, GitHub and your agent CLIs, and replaces none of them.",
	},
	{
		question: "What do I need?",
		answer:
			"macOS 26, a Mac that stays awake, the Orca ADE, Linear (in v1 you must be a workspace admin to run setup), GitHub, and at least one agent CLI.",
	},
	{
		question: "Is it open source?",
		answer: "Yes, under the MIT licence. The code is on GitHub.",
		link: { text: "on GitHub", href: site.repo },
	},
];
