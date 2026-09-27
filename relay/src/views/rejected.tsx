import { Layout } from "./layout";

export function RejectedPage() {
	return (
		<Layout title="Authorization cancelled">
			<p class="text-gray-600">
				Authorization was cancelled. Nothing was connected. If this wasn't
				intentional, ask the Operator to send a new approval link.
			</p>
		</Layout>
	);
}
