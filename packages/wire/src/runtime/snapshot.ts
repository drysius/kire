import {
	type Dehydrated,
	PROTOCOL_VERSION,
	type Snapshot,
	type SnapshotMemo,
} from "../contracts";
import type { SynthRegistry } from "../synth/registry";
import { sign } from "./checksum";

/** Dehydrate a component's public property bag into wire `data`. */
export function dehydrateData(
	data: Record<string, unknown>,
	synth: SynthRegistry,
): Record<string, Dehydrated> {
	const out: Record<string, Dehydrated> = {};
	for (const key of Object.keys(data)) out[key] = synth.dehydrate(data[key]);
	return out;
}

/** Hydrate wire `data` back into a runtime property bag. */
export function hydrateData(
	data: Record<string, Dehydrated>,
	synth: SynthRegistry,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(data)) out[key] = synth.hydrate(data[key]!);
	return out;
}

/** Build and sign a fresh snapshot from a property bag and its memo. */
export function takeSnapshot(
	data: Record<string, unknown>,
	memo: SnapshotMemo,
	synth: SynthRegistry,
	secret: string,
): Snapshot {
	const unsigned = {
		v: PROTOCOL_VERSION,
		data: dehydrateData(data, synth),
		memo,
	};
	return { ...unsigned, checksum: sign(unsigned, secret) };
}
