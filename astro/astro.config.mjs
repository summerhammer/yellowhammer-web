// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://yellowhammer.dev",
	build: {
		// Emit CSS as an external file so the strict CSP in public/_headers (style-src 'self') holds.
		inlineStylesheets: "never",
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
