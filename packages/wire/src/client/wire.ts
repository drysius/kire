import type { ClientComponent } from "./component";
import { watch } from "./reactivity";

/** Names that must resolve to real scope (not the component) inside `with($wire)`. */
const PASSTHROUGH = new Set([
	"$event",
	"$el",
	"window",
	"document",
	"globalThis",
	"console",
	"JSON",
	"Math",
	"Object",
	"Array",
	"true",
	"false",
	"null",
	"undefined",
	"NaN",
	"Infinity",
	"this",
]);

export type Wire = Record<string, unknown> & {
	$get(path: string): unknown;
	$set(path: string, value: unknown, live?: boolean): void;
	$call(method: string, ...params: unknown[]): Promise<unknown>;
	$refresh(): Promise<unknown>;
	$watch(path: string, cb: (v: unknown) => void): () => void;
	$dispatch(event: string, ...params: unknown[]): void;
	readonly $id: string;
	readonly $el: Element;
};

/**
 * The `$wire` object: reactive property access, magic helpers, and any other key
 * treated as a server action. Backed by a Proxy whose `has` trap routes bare
 * identifiers (inside `with($wire)`) to the component while letting real globals
 * pass through.
 */
export function makeWire(component: ClientComponent, runtime: WireApi): Wire {
	const handlers: Record<string, unknown> = {
		$get: (path: string) => component.get(path),
		$set: (path: string, value: unknown, live = true) => component.set(path, value, live),
		$call: (method: string, ...params: unknown[]) => component.call(method, params),
		$refresh: () => component.call("$refresh"),
		$dispatch: (event: string, ...params: unknown[]) =>
			runtime.dispatch({ event, params }, component),
		$watch: (path: string, cb: (v: unknown) => void) =>
			watch(() => component.get(path), cb),
		$id: component.id,
		$el: () => component.el,
	};

	return new Proxy(handlers, {
		get(target, key) {
			if (typeof key !== "string") return Reflect.get(target, key);
			if (key === "$el") return component.el;
			if (key in target) return target[key];
			const value = component.get(key);
			if (value !== undefined) return value;
			// Unknown key -> a callable server action.
			return (...params: unknown[]) => component.call(key, params);
		},
		set(_t, key, value) {
			if (typeof key === "string") component.set(key, value);
			return true;
		},
		has(_t, key) {
			return typeof key === "string" && !PASSTHROUGH.has(key);
		},
	}) as unknown as Wire;
}

/** Minimal runtime surface the `$wire` proxy needs. */
export interface WireApi {
	dispatch(d: { event: string; params: unknown[] }, from: ClientComponent): void;
}

/** Evaluate a directive expression with `$wire` and `$event` in scope. */
export function evaluate(expr: string, wire: Wire, event?: Event): unknown {
	// Function bodies are non-strict, so `with` is allowed and routes bare names
	// through the $wire `has`/`get` traps.
	const fn = new Function("$wire", "$event", `with($wire){ return (${expr}); }`);
	return fn(wire, event);
}
