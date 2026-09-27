import { Layout } from "./layout";

export function ExpiredPage() {
	return (
		<Layout title="Link expired">
			<p class="text-gray-600">
				This approval link has expired or is invalid. Ask the Operator to
				generate a new link in Yellowhammer setup.
			</p>
		</Layout>
	);
}
