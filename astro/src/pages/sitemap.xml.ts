import type { APIContext } from "astro";
import { getPublishedPosts, postPath } from "../lib/blog";

export async function GET({ site }: APIContext) {
	const posts = await getPublishedPosts();
	const pages = ["/", "/blog", ...posts.map((post) => postPath(post.id))];
	const escapeXml = (value: string) =>
		value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll('"', "&quot;");
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((path) => `<url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`).join("")}</urlset>`,
		{ headers: { "Content-Type": "application/xml; charset=utf-8" } },
	);
}
