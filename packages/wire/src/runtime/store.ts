/**
 * Transient per-component state that must NOT live on the component instance (so
 * it never serializes into a snapshot). Features stash flags and bookkeeping here
 * keyed by the component instance. A WeakMap lets entries be garbage-collected
 * with their component.
 */
const stores = new WeakMap<object, Map<string, unknown>>();

function bag(component: object): Map<string, unknown> {
	let map = stores.get(component);
	if (!map) {
		map = new Map();
		stores.set(component, map);
	}
	return map;
}

export const store = {
	get<T = unknown>(component: object, key: string, fallback?: T): T {
		const map = stores.get(component);
		return (map?.has(key) ? (map.get(key) as T) : (fallback as T));
	},
	set(component: object, key: string, value: unknown): void {
		bag(component).set(key, value);
	},
	has(component: object, key: string): boolean {
		return stores.get(component)?.has(key) ?? false;
	},
	push(component: object, key: string, value: unknown): void {
		const map = bag(component);
		const arr = (map.get(key) as unknown[]) ?? [];
		arr.push(value);
		map.set(key, arr);
	},
};
