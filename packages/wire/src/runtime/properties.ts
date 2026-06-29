/**
 * Deep, dot-path reads and writes for component properties. `wire:model` and
 * `$set` address nested state by path (e.g. `"form.address.city"`); the pipeline
 * applies those writes here, vivifying missing intermediate containers.
 */

const INDEX = /^\d+$/;

/** Read a value by dot-path. Returns undefined if any segment is missing. */
export function getDeep(target: unknown, path: string): unknown {
	const segments = path.split(".");
	let cursor: unknown = target;
	for (const seg of segments) {
		if (cursor == null || typeof cursor !== "object") return undefined;
		cursor = (cursor as Record<string, unknown>)[seg];
	}
	return cursor;
}

/**
 * Write `value` at dot-path `path`, creating intermediate objects/arrays as
 * needed. A numeric next-segment vivifies an array, otherwise an object. The
 * top-level property name is returned so callers can fire `updated<Prop>` hooks.
 */
export function setDeep(
	target: Record<string, unknown>,
	path: string,
	value: unknown,
): string {
	const segments = path.split(".");
	const root = segments[0]!;

	if (segments.length === 1) {
		target[root] = value;
		return root;
	}

	let cursor: Record<string, unknown> = target;
	for (let i = 0; i < segments.length - 1; i++) {
		const seg = segments[i]!;
		const next = segments[i + 1]!;
		let child = cursor[seg];
		if (child == null || typeof child !== "object") {
			child = INDEX.test(next) ? [] : {};
			cursor[seg] = child;
		}
		cursor = child as Record<string, unknown>;
	}
	cursor[segments[segments.length - 1]!] = value;
	return root;
}
