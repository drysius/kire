import type { Dehydrated } from "../contracts";
import { SynthRegistry } from "./registry";
import { type PartialMeta, Synth, type SynthChild } from "./synth";

/** Plain `{}` arrays. Recurses into elements so nested rich types survive. */
class ArraySynth extends Synth<unknown[]> {
	readonly key = "arr";
	match(v: unknown): boolean {
		return Array.isArray(v);
	}
	dehydrate(v: unknown[], child: SynthChild): [Dehydrated, PartialMeta] {
		return [v.map((item) => child.dehydrate(item)), {}];
	}
	hydrate(data: Dehydrated, _m: unknown, child: SynthChild): unknown[] {
		return (data as Dehydrated[]).map((item) => child.hydrate(item));
	}
	get(target: unknown[], key: string): unknown {
		return target[Number(key)];
	}
	set(target: unknown[], key: string, value: unknown): void {
		target[Number(key)] = value;
	}
}

/** Plain objects (Object-prototype or null-prototype). */
class ObjectSynth extends Synth<Record<string, unknown>> {
	readonly key = "obj";
	match(v: unknown): boolean {
		if (typeof v !== "object" || v === null) return false;
		const proto = Object.getPrototypeOf(v);
		return proto === Object.prototype || proto === null;
	}
	dehydrate(
		v: Record<string, unknown>,
		child: SynthChild,
	): [Dehydrated, PartialMeta] {
		const out: Record<string, Dehydrated> = {};
		for (const k of Object.keys(v)) out[k] = child.dehydrate(v[k]);
		return [out, {}];
	}
	hydrate(
		data: Dehydrated,
		_m: unknown,
		child: SynthChild,
	): Record<string, unknown> {
		const out: Record<string, unknown> = {};
		const obj = data as Record<string, Dehydrated>;
		for (const k of Object.keys(obj)) out[k] = child.hydrate(obj[k]!);
		return out;
	}
	get(target: Record<string, unknown>, key: string): unknown {
		return target[key];
	}
	set(target: Record<string, unknown>, key: string, value: unknown): void {
		target[key] = value;
	}
}

/** Dates travel as ISO 8601 strings. */
class DateSynth extends Synth<Date> {
	readonly key = "date";
	match(v: unknown): boolean {
		return v instanceof Date;
	}
	dehydrate(v: Date): [Dehydrated, PartialMeta] {
		return [v.toISOString(), {}];
	}
	hydrate(data: Dehydrated): Date {
		return new Date(data as string);
	}
}

/** Maps travel as an array of `[key, value]` pairs (both recursed). */
class MapSynth extends Synth<Map<unknown, unknown>> {
	readonly key = "map";
	match(v: unknown): boolean {
		return v instanceof Map;
	}
	dehydrate(
		v: Map<unknown, unknown>,
		child: SynthChild,
	): [Dehydrated, PartialMeta] {
		const pairs: Dehydrated[] = [];
		for (const [k, val] of v)
			pairs.push([child.dehydrate(k), child.dehydrate(val)]);
		return [pairs, {}];
	}
	hydrate(
		data: Dehydrated,
		_m: unknown,
		child: SynthChild,
	): Map<unknown, unknown> {
		const map = new Map<unknown, unknown>();
		for (const pair of data as Dehydrated[]) {
			const [k, val] = pair as [Dehydrated, Dehydrated];
			map.set(child.hydrate(k), child.hydrate(val));
		}
		return map;
	}
}

/** Sets travel as an array of (recursed) members. */
class SetSynth extends Synth<Set<unknown>> {
	readonly key = "set";
	match(v: unknown): boolean {
		return v instanceof Set;
	}
	dehydrate(v: Set<unknown>, child: SynthChild): [Dehydrated, PartialMeta] {
		return [[...v].map((item) => child.dehydrate(item)), {}];
	}
	hydrate(data: Dehydrated, _m: unknown, child: SynthChild): Set<unknown> {
		return new Set((data as Dehydrated[]).map((item) => child.hydrate(item)));
	}
}

/** BigInts travel as decimal strings (JSON cannot hold them natively). */
class BigIntSynth extends Synth<bigint> {
	readonly key = "bigint";
	match(v: unknown): boolean {
		return typeof v === "bigint";
	}
	dehydrate(v: bigint): [Dehydrated, PartialMeta] {
		return [v.toString(), {}];
	}
	hydrate(data: Dehydrated): bigint {
		return BigInt(data as string);
	}
}

/** A registry preloaded with the built-in synths, in correct match order. */
export function createDefaultSynthRegistry(
	allow?: (key: string) => boolean,
): SynthRegistry {
	return new SynthRegistry(allow)
		.register(new DateSynth())
		.register(new MapSynth())
		.register(new SetSynth())
		.register(new BigIntSynth())
		.register(new ArraySynth())
		.register(new ObjectSynth());
}
