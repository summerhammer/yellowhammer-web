import type { ParsedCallback, Provider, Session } from "./types";

function authorizeUrl(session: Session, redirectUri: string): string {
	const url = new URL("https://linear.app/oauth/authorize");
	url.searchParams.set("response_type", "code");
	url.searchParams.set("actor", "app");
	url.searchParams.set("client_id", session.client_id);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("state", session.session_id);
	url.searchParams.set("code_challenge", session.code_challenge);
	url.searchParams.set("code_challenge_method", "S256");
	url.searchParams.set("scope", "read,write");
	return url.toString();
}

function parseCallback(query: URLSearchParams): ParsedCallback {
	const error = query.get("error");
	if (error) {
		return { error };
	}
	const code = query.get("code");
	if (!code) {
		return { error: "missing_code" };
	}
	return { code };
}

function Guidance() {
	return (
		<div class="space-y-6">
			<section>
				<h2 class="text-lg font-semibold text-gray-900">
					What is Yellowhammer?
				</h2>
				<p class="mt-2 text-gray-600">
					Yellowhammer runs an unattended overnight engineering shift: it picks
					up issues, runs coding agents against them, and opens pull requests
					for a human to review in the morning. To do that on your Linear
					workspace, it needs to read and update issues while you're away.
				</p>
			</section>
			<section>
				<h2 class="text-lg font-semibold text-gray-900">Why an app user?</h2>
				<p class="mt-2 text-gray-600">
					Yellowhammer authenticates as an app user (Linear calls this{" "}
					<code>actor=app</code>), not as any one person. That keeps its edits
					clearly attributed to "Yellowhammer" in your activity history, and
					lets teammates get Linear's normal notifications when it comments or
					moves an issue &mdash; the same as they would from a human teammate,
					not a silent background process.
				</p>
			</section>
			<section>
				<h2 class="text-lg font-semibold text-gray-900">What it can do</h2>
				<p class="mt-2 text-gray-600">
					The requested permissions are <strong>read and write</strong> on
					issues and comments. Yellowhammer never asks for workspace admin
					permissions.
				</p>
			</section>
			<section class="rounded-md border-2 border-gray-800 bg-gray-50 p-4">
				<h2 class="text-lg font-semibold text-gray-900">
					Team access &mdash; please read
				</h2>
				<p class="mt-2 text-gray-700">
					On the next screen, Linear will ask which teams to grant access to.
					Choose <strong>"Only select teams&hellip;"</strong> and pick the
					team(s) your Operator works in. The default option,{" "}
					<strong>"All public teams"</strong>, does not add Yellowhammer as a
					member of those teams, and without team membership it can't provision
					the workflow states and labels it needs to run.
				</p>
			</section>
		</div>
	);
}

export const linear: Provider = {
	id: "linear",
	displayName: "Linear",
	pkce: "S256",
	authorizeUrl,
	parseCallback,
	Guidance,
};
