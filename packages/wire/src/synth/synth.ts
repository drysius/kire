import type { Dehydrated, SynthMeta } from "../contracts";

/** Recursive (de)hydration entry points handed to a synth for its children. */
export interface SynthChild {
	dehydrate(value: unknown): Dehydrated;
	hydrate(value: Dehydrated): unknown;
}

/** Metadata a synth returns from `dehydrate`, before the registry stamps `s`. */
export type PartialMeta = Omit<SynthMeta, "s">;

/**
 * Serializes one runtime type to/from the wire. Primitives are never synthesized;
 * everything else (arrays, plain objects, Date, Map, Set, BigInt, class instances)
 * is handled by exactly one matching synth and travels as a `[data, {s, …}]` tuple.
 */
export abstract class Synth<T = unknown> {
	/** Short, stable identifier stored as `meta.s` and used to resolve on hydrate. */
	abstract readonly key: string;

	/** True when this synth handles `value` during dehydration. */
	abstract match(value: unknown): boolean;

	/** Convert a runtime value into wire data plus metadata. */
	abstract dehydrate(value: T, child: SynthChild): [data: Dehydrated, meta: PartialMeta];

	/** Reconstruct the runtime value from wire data and metadata. */
	abstract hydrate(data: Dehydrated, meta: SynthMeta, child: SynthChild): T;

	/** Read a nested member by key (used by deep dot-path property updates). */
	get?(target: T, key: string): unknown;
	/** Write a nested member by key (used by deep dot-path property updates). */
	set?(target: T, key: string, value: unknown): void;
}
