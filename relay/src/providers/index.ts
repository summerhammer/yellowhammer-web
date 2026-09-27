import { linear } from "./linear";
import type { Provider } from "./types";

export type ProviderRegistry = Record<string, Provider>;

/** Production registry: only Linear is supported. */
export const providers: ProviderRegistry = {
	[linear.id]: linear,
};

export function getProvider(
	registry: ProviderRegistry,
	id: string,
): Provider | undefined {
	// Own keys only: a plain lookup would resolve "toString" etc. from Object.prototype.
	return Object.hasOwn(registry, id) ? registry[id] : undefined;
}

export type { ParsedCallback, Provider, Session } from "./types";
