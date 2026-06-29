import type { Dehydrated, SyntheticTuple } from "../contracts";
import type { SynthChild, Synth } from "./synth";

/** A primitive needs no synthesis and travels bare. `-0` is normalized to `0`. */
function isPrimitive(v: unknown): v is string | number | boolean | null {
	return (
		v === null ||
		typeof v === "string" ||
		typeof v === "boolean" ||
		typeof v === "number"
	);
}

/** True for a `[data, {s}]` synthetic tuple. Real arrays are always wrapped, so a
 * bare 2-element array never collides with this shape. */
function isTuple(v: unknown): v is SyntheticTuple {
	return (
		Array.isArray(v) &&
		v.length === 2 &&
		typeof v[1] === "object" &&
		v[1] !== null &&
		typeof (v[1] as { s?: unknown }).s === "string"
	);
}

/**
 * Holds the ordered list of synths and drives recursive (de)hydration. Order
 * matters: the first synth whose `match` returns true wins, so register specific
 * types before the generic object/array fallbacks.
 */
export class SynthRegistry {
	private readonly byKey = new Map<string, Synth>();
	private readonly list: Synth[] = [];

	/** Registered class allowlist gate for hydrating untrusted class data. */
	constructor(private readonly allow?: (key: string) => boolean) {}

	register(synth: Synth): this {
		if (this.byKey.has(synth.key)) {
			throw new Error(`Duplicate synth key "${synth.key}".`);
		}
		this.byKey.set(synth.key, synth);
		this.list.push(synth);
		return this;
	}

	private child: SynthChild = {
		dehydrate: (v) => this.dehydrate(v),
		hydrate: (v) => this.hydrate(v),
	};

	/** Serialize any value to wire form. Throws if no synth matches a non-primitive. */
	dehydrate(value: unknown): Dehydrated {
		if (value === undefined) return null;
		if (isPrimitive(value)) {
			return typeof value === "number" && Object.is(value, -0) ? 0 : value;
		}
		for (const synth of this.list) {
			if (synth.match(value)) {
				const [data, meta] = synth.dehydrate(value, this.child);
				return [data, { ...meta, s: synth.key }];
			}
		}
		throw new Error(
			`No synthesizer matched value of type ${Object.prototype.toString.call(value)}.`,
		);
	}

	/** Reconstruct any value from wire form. Primitives and unknown shapes pass through. */
	hydrate(value: Dehydrated): unknown {
		if (!isTuple(value)) return value;
		const [data, meta] = value;
		if (this.allow && !this.allow(meta.s)) {
			throw new Error(`Synth "${meta.s}" is not allowed to hydrate.`);
		}
		const synth = this.byKey.get(meta.s);
		if (!synth) throw new Error(`Unknown synth key "${meta.s}".`);
		return synth.hydrate(data as Dehydrated, meta, this.child);
	}

	/** Resolve the synth that produced a tuple, for deep property navigation. */
	synthFor(value: unknown): Synth | undefined {
		if (isTuple(value)) return this.byKey.get(value[1].s);
		for (const synth of this.list) if (synth.match(value)) return synth;
		return undefined;
	}
}
