import { describe, expect, it } from "bun:test";
import { findBestWildcardMatch, wildcardToRegExp } from "../src/utils/wildcard";

describe("wildcard schema matching", () => {
	it("matches namespaced custom elements against wildcard definitions", () => {
		const pattern = wildcardToRegExp("livewire:*", "[^\\s>]+");
		expect(pattern.test("livewire:collection")).toBe(true);
		expect(pattern.test("wire:collection")).toBe(false);
	});

	it("matches wildcard attributes against the base segment", () => {
		const pattern = wildcardToRegExp("wire:*", "[^.]+");
		expect(pattern.test("wire:navigate")).toBe(true);
		expect(pattern.test("wire:keydown.enter")).toBe(false);
	});

	it("prefers the most specific wildcard entry", () => {
		const match = findBestWildcardMatch(
			new Map([
				["*", { id: "any" }],
				["livewire:*", { id: "livewire" }],
				["livewire:admin:*", { id: "admin" }],
			]).entries(),
			"livewire:admin:users",
			"[^\\s>]+",
		);

		expect(match?.name).toBe("livewire:admin:*");
		expect(match?.value).toEqual({ id: "admin" });
	});
});
