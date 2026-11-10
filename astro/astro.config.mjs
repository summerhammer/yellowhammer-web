// @ts-check
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://yellowhammer.dev",
	integrations: [mdx()],
	// Plain code blocks avoid inline styles blocked by the site CSP.
	markdown: { syntaxHighlight: false },
	build: {
		// Emit CSS as an external file so the strict CSP in public/_headers (style-src 'self') holds.
		inlineStylesheets: "never",
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
