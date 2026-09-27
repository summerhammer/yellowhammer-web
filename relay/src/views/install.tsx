import type { Provider } from "../providers/types";
import { Layout } from "./layout";

export function InstallPage({
	provider,
	authorizeUrl,
}: {
	provider: Provider;
	authorizeUrl: string;
}) {
	return (
		<Layout title="Approve installation">
			<p class="text-gray-600">
				An Operator would like to connect Yellowhammer to your{" "}
				<strong>{provider.displayName}</strong> workspace. Please review before
				approving.
			</p>
			<div class="mt-6">
				<provider.Guidance />
			</div>
			<a
				href={authorizeUrl}
				class="mt-8 inline-block rounded-md bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
			>
				Approve in {provider.displayName} →
			</a>
		</Layout>
	);
}
