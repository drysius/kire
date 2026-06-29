import { describe, expect, test } from "bun:test";
import { sign, verify } from "../src/runtime/checksum";
import { hydrateData, takeSnapshot } from "../src/runtime/snapshot";
import { createDefaultSynthRegistry } from "../src/synth/builtins";
import type { Snapshot, SnapshotMemo } from "../src/contracts";

const synth = createDefaultSynthRegistry();
const SECRET = "test-secret";

describe("synthesizers", () => {
	test("primitives travel bare", () => {
		for (const v of ["hi", 42, true, false, null]) {
			expect(synth.dehydrate(v)).toBe(v as never);
			expect(synth.hydrate(synth.dehydrate(v) as never)).toBe(v as never);
		}
	});

	test("-0 normalizes to 0", () => {
		expect(Object.is(synth.dehydrate(-0), 0)).toBe(true);
	});

	test("round-trips nested arrays and objects", () => {
		const value = { a: [1, 2, { b: "x" }], c: { d: [true, null] } };
		const round = synth.hydrate(synth.dehydrate(value));
		expect(round).toEqual(value);
	});

	test("round-trips Date, Map, Set, BigInt", () => {
		const date = new Date("2026-01-02T03:04:05.000Z");
		expect(synth.hydrate(synth.dehydrate(date))).toEqual(date);

		const map = new Map<string, unknown>([["k", { n: 1 }]]);
		expect(synth.hydrate(synth.dehydrate(map))).toEqual(map);

		const set = new Set([1, 2, 3]);
		expect(synth.hydrate(synth.dehydrate(set))).toEqual(set);

		expect(synth.hydrate(synth.dehydrate(123n))).toBe(123n);
	});

	test("nested rich types inside arrays/objects survive", () => {
		const value = { when: new Date("2026-06-29T00:00:00.000Z"), tags: new Set(["a"]) };
		expect(synth.hydrate(synth.dehydrate(value))).toEqual(value);
	});

	test("throws on a value no synth matches", () => {
		expect(() => synth.dehydrate(() => {})).toThrow();
	});
});

describe("checksum", () => {
	const memo: SnapshotMemo = { id: "c1", name: "counter" };
	const snap = (): Pick<Snapshot, "v" | "data" | "memo"> => ({
		v: 1,
		data: { count: 5 },
		memo,
	});

	test("is deterministic", () => {
		expect(sign(snap(), SECRET)).toBe(sign(snap(), SECRET));
	});

	test("verifies a valid snapshot", () => {
		const s = snap();
		const full: Snapshot = { ...s, checksum: sign(s, SECRET) };
		expect(verify(full, SECRET)).toBe(true);
	});

	test("rejects tampered data", () => {
		const s = snap();
		const full: Snapshot = { ...s, checksum: sign(s, SECRET) };
		full.data.count = 999;
		expect(verify(full, SECRET)).toBe(false);
	});

	test("rejects a tampered checksum", () => {
		const s = snap();
		const full: Snapshot = { ...s, checksum: sign(s, SECRET) };
		full.checksum = `${full.checksum.slice(0, -1)}0`;
		expect(verify(full, SECRET)).toBe(false);
	});

	test("rejects a wrong secret", () => {
		const s = snap();
		const full: Snapshot = { ...s, checksum: sign(s, SECRET) };
		expect(verify(full, "other-secret")).toBe(false);
	});

	test("memo.children changes do NOT invalidate the checksum", () => {
		const s = snap();
		const full: Snapshot = { ...s, checksum: sign(s, SECRET) };
		full.memo.children = { row1: ["child", "x1"] };
		expect(verify(full, SECRET)).toBe(true);
	});
});

describe("snapshot", () => {
	test("takes a signed snapshot that round-trips and verifies", () => {
		const data = { count: 7, when: new Date("2026-01-01T00:00:00.000Z"), tags: new Set(["a"]) };
		const memo: SnapshotMemo = { id: "c1", name: "counter" };

		const snapshot = takeSnapshot(data, memo, synth, SECRET);
		expect(verify(snapshot, SECRET)).toBe(true);

		const restored = hydrateData(snapshot.data, synth);
		expect(restored).toEqual(data);
	});
});
