import { describe, expect, it } from "bun:test";
import schema from "../../packages/wire/kire.schema.js";

describe("@kirejs/wire schema", () => {
	it("exposes static attribute documentation for tooling", () => {
		const attributes = Array.isArray((schema as any).attributes)
			? (schema as any).attributes
			: [];
		const elements = Array.isArray((schema as any).elements)
			? (schema as any).elements
			: [];

		expect(
			attributes.some(
				(entry: any) =>
					entry?.name === "wire:navigate" &&
					typeof entry?.description === "string" &&
					entry.description.length > 0,
			),
		).toBe(true);
		expect(
			attributes.some(
				(entry: any) =>
					entry?.name === "wire:*" &&
					Array.isArray(entry?.extends) &&
					entry.extends.length > 0,
			),
		).toBe(true);
		expect(
			elements.some(
				(entry: any) =>
					entry?.name === "wire:*" &&
					typeof entry?.description === "string" &&
					entry.description.length > 0,
			),
		).toBe(true);
		expect(
			elements.some(
				(entry: any) =>
					entry?.name === "livewire:*" &&
					typeof entry?.example === "string" &&
					entry.example.length > 0,
			),
		).toBe(true);
	});
});
