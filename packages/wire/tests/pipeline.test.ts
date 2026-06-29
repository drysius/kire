import { describe, expect, test } from "bun:test";
import { LiveComponent } from "../src/component";
import { CorruptSnapshotError, Kirewire } from "../src/kirewire";
import { verify } from "../src/runtime/checksum";

class Counter extends LiveComponent {
	count = 0;
	step = 1;
	increment() {
		this.count += this.step;
	}
	addTo(target: { items: number[] }) {
		void target;
	}
	render() {
		return `<div wire:id="${this.$id}">${this.count}</div>`;
	}
}

function wire() {
	const w = new Kirewire({ secret: "test-secret" });
	w.component("counter", Counter);
	return w;
}

describe("mount", () => {
	test("renders, seeds params, and returns a verified snapshot", async () => {
		const { snapshot, html, id } = await wire().mount("counter", { step: 2 });
		expect(id).toBeTruthy();
		expect(html).toContain(">0<");
		expect(verify(snapshot, "test-secret")).toBe(true);
		expect(snapshot.data.step).toBe(2);
		expect(snapshot.memo.name).toBe("counter");
	});
});

describe("update", () => {
	test("invokes an action and re-renders with new state", async () => {
		const w = wire();
		const { snapshot } = await w.mount("counter", { step: 2 });
		const res = await w.update({
			snapshot,
			updates: {},
			calls: [{ method: "increment", params: [] }],
		});
		if ("skip" in res) throw new Error("unexpected skip");
		expect(res.snapshot.data.count).toBe(2);
		expect(res.effects.html).toContain(">2<");
		expect(verify(res.snapshot, "test-secret")).toBe(true);
	});

	test("applies wire:model property updates by dot-path", async () => {
		const w = wire();
		const { snapshot } = await w.mount("counter");
		const res = await w.update({ snapshot, updates: { count: 41 }, calls: [] });
		if ("skip" in res) throw new Error("unexpected skip");
		expect(res.snapshot.data.count).toBe(41);
	});

	test("chains state across multiple round-trips", async () => {
		const w = wire();
		let snap = (await w.mount("counter", { step: 5 })).snapshot;
		for (let i = 0; i < 3; i++) {
			const res = await w.update({
				snapshot: snap,
				updates: {},
				calls: [{ method: "increment", params: [] }],
			});
			if ("skip" in res) throw new Error("unexpected skip");
			snap = res.snapshot;
		}
		expect(snap.data.count).toBe(15);
	});

	test("rejects a tampered snapshot", async () => {
		const w = wire();
		const { snapshot } = await w.mount("counter");
		snapshot.data.count = 999;
		expect(
			w.update({
				snapshot,
				updates: {},
				calls: [{ method: "increment", params: [] }],
			}),
		).rejects.toBeInstanceOf(CorruptSnapshotError);
	});

	test("refuses to call non-action / reserved methods", async () => {
		const w = wire();
		const { snapshot } = await w.mount("counter");
		expect(
			w.update({
				snapshot,
				updates: {},
				calls: [{ method: "getPublicState", params: [] }],
			}),
		).rejects.toThrow();
	});
});
