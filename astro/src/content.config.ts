import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string().trim().min(1),
		description: z.string().trim().min(1),
		author: z.string().trim().min(1).default("Yellowhammer"),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		cover: z
			.object({
				src: z
					.string()
					.regex(
						/^\/(?!\/)[^?#]+$/,
						"Use a local public image path starting with /",
					),
				alt: z.string().trim().min(1),
			})
			.optional(),
		tags: z.array(z.string().trim().min(1)).default([]),
		draft: z.boolean().default(true),
	}),
});

export const collections = { blog };
