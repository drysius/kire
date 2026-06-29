import type { Dehydrated } from "../contracts";

/**
 * Client-side unwrap of dehydrated wire data into plain JS values for binding.
 * Synthetic `[value, {s}]` tuples collapse to their value (recursively); the
 * server remains the source of truth for rich types, so the client only needs
 * plain values to drive `wire:model` and display.
 */
function isTuple(v: unknown): v is [unknown, { s: string }] {
	return (
		Array.isArray(v) &&
		v.length === 2 &&
		typeof v[1] === "object" &&
		v[1] !== null &&
		typeof (v[1] as { s?: unknown }).s === "string"
	);
}

export function extract(value: Dehydrated): unknown {
	if (isTuple(value)) return extract((value as [Dehydrated, unknown])[0] as Dehydrated);
	if (Array.isArray(value)) return value.map((v) => extract(v));
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const k of Object.keys(value)) out[k] = extract((value as Record<string, Dehydrated>)[k]!);
		return out;
	}
	return value;
}

export function extractData(data: Record<string, Dehydrated>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const k of Object.keys(data)) out[k] = extract(data[k]!);
	return out;
}
