import { beforeEach, describe, expect, it } from "bun:test";
import { kireStore } from "../src/core/store";

describe("kire store", () => {
	beforeEach(() => {
		kireStore.getState().clear();
	});

	it("persists state mutations across the shared zustand store", () => {
		const events: string[] = [];
		const unsubscribe = kireStore.subscribe((state, previousState) => {
			if (state.revision === previousState.revision) return;
			events.push(state.lastMutation || "unknown");
		});

		kireStore.getState().setMetadata({
			name: "kire-test",
			version: "1.0.0",
		});
		kireStore.getState().applyKireSchema({
			directives: [{ name: "if", children: true }],
			attributes: [{ name: "wire:model", type: "string" }],
		} as any);

		unsubscribe();

		expect(kireStore.getState().metadata.name).toBe("kire-test");
		expect(kireStore.getState().directives.has("if")).toBe(true);
		expect(kireStore.getState().attributes.has("wire:model")).toBe(true);
		expect(kireStore.getState().revision).toBeGreaterThan(0);
		expect(events).toContain("setMetadata");
		expect(events).toContain("applyKireSchema");
	});
});
