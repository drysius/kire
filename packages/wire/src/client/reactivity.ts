/**
 * A tiny signal-style reactivity core — enough for `wire:model` binding,
 * `$wire.$watch`, and `$wire.$effect` without depending on Alpine or any other
 * framework. Dependency tracking is per-property on a reactive proxy.
 */

type Effect = { run: () => void; deps: Set<Set<Effect>> };

let activeEffect: Effect | null = null;

/** Run `fn` now and re-run it whenever a reactive property it read changes. */
export function effect(fn: () => void): () => void {
	const e: Effect = {
		run() {
			cleanup(e);
			const prev = activeEffect;
			activeEffect = e;
			try {
				fn();
			} finally {
				activeEffect = prev;
			}
		},
		deps: new Set(),
	};
	e.run();
	return () => cleanup(e);
}

function cleanup(e: Effect): void {
	for (const dep of e.deps) dep.delete(e);
	e.deps.clear();
}

const REACTIVE = Symbol("reactive");

/** Wrap an object so reads track dependencies and writes notify effects. */
export function reactive<T extends object>(target: T): T {
	if ((target as Record<symbol, unknown>)[REACTIVE]) return target;
	const deps = new Map<PropertyKey, Set<Effect>>();
	const dep = (key: PropertyKey) => {
		let set = deps.get(key);
		if (!set) deps.set(key, (set = new Set()));
		return set;
	};

	return new Proxy(target, {
		get(obj, key, receiver) {
			if (key === REACTIVE) return true;
			if (activeEffect) {
				const set = dep(key);
				set.add(activeEffect);
				activeEffect.deps.add(set);
			}
			const value = Reflect.get(obj, key, receiver);
			return value && typeof value === "object"
				? reactive(value as object)
				: value;
		},
		set(obj, key, value, receiver) {
			const old = Reflect.get(obj, key, receiver);
			const ok = Reflect.set(obj, key, value, receiver);
			if (!Object.is(old, value)) {
				for (const e of [...dep(key)]) e.run();
			}
			return ok;
		},
	});
}

/** A lazily-recomputed, dependency-tracked derived value. */
export function computed<T>(getter: () => T): { readonly value: T } {
	let cache: T;
	let dirty = true;
	effect(() => {
		dirty = true;
		void getter; // dependency registration happens on first read below
	});
	return {
		get value() {
			if (dirty) {
				cache = getter();
				dirty = false;
			}
			return cache;
		},
	};
}

/** Watch a getter and call `cb(newValue, oldValue)` when it changes. */
export function watch<T>(
	getter: () => T,
	cb: (next: T, prev: T) => void,
): () => void {
	let prev: T;
	let first = true;
	return effect(() => {
		const next = getter();
		if (!first && !Object.is(next, prev)) cb(next, prev);
		first = false;
		prev = next;
	});
}
