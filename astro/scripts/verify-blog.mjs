import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	cp,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sandbox = await mkdtemp(path.join(tmpdir(), "yellowhammer-blog-"));
const read = (name) => readFile(path.join(sandbox, "dist", name), "utf8");
const exists = async (name) => {
	try {
		await read(name);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
};
function build(success = true) {
	const result = spawnSync(
		process.execPath,
		[path.join(root, "node_modules/astro/bin/astro.mjs"), "build"],
		{
			cwd: sandbox,
			encoding: "utf8",
			env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
		},
	);
	if (success && result.status !== 0)
		throw new Error(result.stdout + result.stderr);
	if (!success) {
		assert.notEqual(result.status, 0, "Invalid metadata must fail the build");
		assert.match(
			result.stdout + result.stderr,
			/description/,
			"Failure must report invalid metadata",
		);
	}
}
async function assertCsp(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) await assertCsp(file);
		else if (entry.name.endsWith(".html")) {
			const html = await readFile(file, "utf8");
			assert.doesNotMatch(
				html,
				/<style\b|<script\b|\sstyle=|\son\w+=/i,
				`${file} must satisfy strict CSP`,
			);
		}
	}
}
try {
	for (const name of [
		"src",
		"public",
		"astro.config.mjs",
		"package.json",
		"tsconfig.json",
	])
		await cp(path.join(root, name), path.join(sandbox, name), {
			recursive: true,
		});
	await symlink(
		path.join(root, "node_modules"),
		path.join(sandbox, "node_modules"),
		"dir",
	);
	// Check real published content before replacing it with isolated fixtures.
	build();
	await assertCsp(path.join(sandbox, "dist"));
	// Start with no posts to make the empty-state test independent of future content.
	const content = path.join(sandbox, "src/content/blog");
	for (const name of await readdir(content))
		await rm(path.join(content, name), { recursive: true });
	build();
	assert.match(await read("blog/index.html"), /The first post is on its way/);
	assert.doesNotMatch(await read("blog/rss.xml"), /<item>/);
	assert.match(await read("sitemap.xml"), /https:\/\/yellowhammer.dev\/blog/);
	assert.ok(await exists("404.html"));
	const fixture = (
		title,
		date,
		draft = "draft: false\n",
		body = "Published body.",
	) =>
		`---\ntitle: ${title}\ndescription: A useful description\npubDate: ${date}\n${draft}tags: [Engineering]\ncover:\n  src: /social/yellowhammer-link-preview.png\n  alt: Yellowhammer preview\n---\n\n${body}\n`;
	await writeFile(
		path.join(content, "older.md"),
		fixture("Older post", "2020-01-01"),
	);
	await writeFile(
		path.join(content, "newer.mdx"),
		fixture(
			"Newer post",
			"2021-01-01",
			"draft: false\n",
			'## Rendered heading\n\nMDX {"expression works"}.\n\n![Bird](/yellowhammer-mark-v2.svg)\n\n```sh\npnpm test\n```',
		),
	);
	await writeFile(
		path.join(content, "draft.md"),
		fixture("Hidden draft", "2020-01-01", "draft: true\n"),
	);
	await writeFile(
		path.join(content, "default-draft.md"),
		fixture("Default draft", "2020-01-01", ""),
	);
	await writeFile(
		path.join(content, "future.md"),
		fixture("Future post", "2999-01-01"),
	);
	build();
	const index = await read("blog/index.html");
	assert.ok(index.indexOf("Newer post") < index.indexOf("Older post"));
	const article = await read("blog/newer/index.html");
	assert.match(article, /expression works/);
	assert.match(article, /Rendered heading/);
	assert.match(article, /<pre><code class="language-sh">/);
	assert.match(article, /src="\/yellowhammer-mark-v2.svg"/);
	assert.match(article, /property="og:type" content="article"/);
	assert.match(
		article,
		/rel="canonical" href="https:\/\/yellowhammer.dev\/blog\/newer"/,
	);
	assert.match(article, /property="article:published_time"/);
	assert.match(
		article,
		/property="og:image" content="https:\/\/yellowhammer.dev\/social\/yellowhammer-link-preview.png"/,
	);
	const feed = await read("blog/rss.xml");
	const sitemap = await read("sitemap.xml");
	for (const id of ["draft", "default-draft", "future"]) {
		assert.equal(await exists(`blog/${id}/index.html`), false);
		assert.ok(!index.includes(`/blog/${id}`));
		assert.ok(!feed.includes(`/blog/${id}`));
		assert.ok(!sitemap.includes(`/blog/${id}`));
	}
	for (const id of ["older", "newer"]) {
		assert.ok(feed.includes(`/blog/${id}`));
		assert.ok(sitemap.includes(`/blog/${id}`));
	}
	assert.match(
		await read("robots.txt"),
		/Sitemap: https:\/\/yellowhammer.dev\/sitemap.xml/,
	);
	await assertCsp(path.join(sandbox, "dist"));
	await writeFile(
		path.join(content, "invalid.md"),
		"---\ntitle: Invalid post\npubDate: 2020-01-01\n---\nMissing description.\n",
	);
	build(false);
	console.log(
		"Blog verification passed: empty state, Markdown/MDX, eligibility, metadata, RSS, sitemap, CSP, and invalid metadata.",
	);
} finally {
	await rm(sandbox, { recursive: true, force: true });
}
