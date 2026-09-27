import { Layout } from "./layout";

export function SuccessPage() {
	return (
		<Layout title="Authorized">
			<p class="text-gray-600">
				Yellowhammer has been authorized. You can close this window; the
				Operator's setup will finish automatically on their Mac.
			</p>
		</Layout>
	);
}
