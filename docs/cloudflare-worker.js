/**
 * Cloudflare Worker Reverse Proxy for Mintlify Documentation
 *
 * Deployed as: yellowhammer-docs-proxy
 * Routes attached in Cloudflare (yellowhammer.dev zone):
 *   - yellowhammer.dev/docs*
 *   - yellowhammer.dev/mintlify-assets/*
 *   - yellowhammer.dev/_mintlify/*
 */

export default {
	async fetch(request) {
		const url = new URL(request.url);

		// Pass through domain verification requests (ACME, Vercel, Cloudflare)
		if (url.pathname.startsWith("/.well-known/")) {
			return fetch(request);
		}

		// Intercept documentation routes and static assets
		if (
			url.pathname === "/docs" ||
			url.pathname.startsWith("/docs/") ||
			url.pathname.startsWith("/mintlify-assets/") ||
			url.pathname.startsWith("/_mintlify/")
		) {
			const DOCS_URL = "yellowhammer.mintlify.site";
			const CUSTOM_URL = "yellowhammer.dev";

			const proxyUrl = new URL(request.url);
			proxyUrl.hostname = DOCS_URL;

			const proxyRequest = new Request(proxyUrl.toString(), request);
			proxyRequest.headers.set("Host", DOCS_URL);
			proxyRequest.headers.set("X-Forwarded-Host", CUSTOM_URL);
			proxyRequest.headers.set("X-Forwarded-Proto", "https");

			const clientIp = request.headers.get("CF-Connecting-IP");
			if (clientIp) {
				proxyRequest.headers.set("CF-Connecting-IP", clientIp);
			}

			return fetch(proxyRequest);
		}

		// Fall back to origin (Astro landing page on Cloudflare Pages)
		return fetch(request);
	},
};
