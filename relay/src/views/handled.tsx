import { Layout } from "./layout";

export function HandledPage() {
	return (
		<Layout title="Already handled">
			<p class="text-gray-600">
				This approval link has already been used. If you're the Operator waiting
				on setup, check the Yellowhammer app on your Mac; if you're the admin
				and this wasn't you, no further action is needed.
			</p>
		</Layout>
	);
}
