import type { Dehydrated } from "../contracts";
import { type PartialMeta, Synth, type SynthChild } from "./synth";

/**
 * Build a synth for a class whose state is its own enumerable properties (a
 * plain data model). Dehydrates each field (recursively) and rehydrates by
 * assigning onto a fresh instance. Register it on a {@link SynthRegistry} whose
 * allowlist permits `key`, so untrusted payloads can only revive known classes.
 */
export function modelSynth<T extends object>(
	key: string,
	ctor: new () => T,
): Synth<T> {
	return new (class extends Synth<T> {
		readonly key = key;
		match(v: unknown): boolean {
			return v instanceof ctor;
		}
		dehydrate(v: T, child: SynthChild): [Dehydrated, PartialMeta] {
			const out: Record<string, Dehydrated> = {};
			for (const k of Object.keys(v))
				out[k] = child.dehydrate((v as Record<string, unknown>)[k]);
			return [out, {}];
		}
		hydrate(data: Dehydrated, _m: unknown, child: SynthChild): T {
			const instance = new ctor();
			const obj = data as Record<string, Dehydrated>;
			for (const k of Object.keys(obj))
				(instance as Record<string, unknown>)[k] = child.hydrate(obj[k]!);
			return instance;
		}
		get(target: T, k: string): unknown {
			return (target as Record<string, unknown>)[k];
		}
		set(target: T, k: string, value: unknown): void {
			(target as Record<string, unknown>)[k] = value;
		}
	})();
}

/**
 * Build a fully custom synth from plain functions, for types whose wire form
 * differs from their fields (enums, value objects, ORM models).
 */
export function defineSynth<T>(spec: {
	key: string;
	match: (v: unknown) => boolean;
	dehydrate: (v: T, child: SynthChild) => [Dehydrated, PartialMeta];
	hydrate: (
		data: Dehydrated,
		meta: Record<string, unknown>,
		child: SynthChild,
	) => T;
}): Synth<T> {
	return new (class extends Synth<T> {
		readonly key = spec.key;
		match = spec.match;
		dehydrate = spec.dehydrate;
		hydrate = (
			data: Dehydrated,
			meta: Record<string, unknown>,
			child: SynthChild,
		) => spec.hydrate(data, meta, child);
	})();
}
