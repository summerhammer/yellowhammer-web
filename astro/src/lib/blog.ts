import { getCollection } from "astro:content";

// One selection policy for pages, RSS, and sitemap, in production and PR previews.
export async function getPublishedPosts() {
	const now = Date.now();
	const posts = await getCollection(
		"blog",
		({ data }) => !data.draft && data.pubDate.getTime() <= now,
	);
	return posts.sort(
		(a, b) =>
			b.data.pubDate.getTime() - a.data.pubDate.getTime() ||
			a.id.localeCompare(b.id),
	);
}

export function postPath(id: string) {
	return `/blog/${id.split("/").map(encodeURIComponent).join("/")}`;
}

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "long",
		timeZone: "UTC",
	}).format(date);
}
