import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, postPath } from "../../lib/blog";

export async function GET(context: APIContext) {
	const posts = await getPublishedPosts();
	return rss({
		title: "Yellowhammer blog",
		description:
			"Notes on unattended engineering, specifications, and building Yellowhammer.",
		site: context.site as URL,
		items: posts.map(({ id, data }) => ({
			title: data.title,
			description: data.description,
			pubDate: data.pubDate,
			link: postPath(id),
			categories: data.tags,
		})),
		customData: "<language>en</language>",
	});
}
