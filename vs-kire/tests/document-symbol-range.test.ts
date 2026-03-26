import { describe, expect, it } from "bun:test";
import { ensureRangeContainsSelection } from "../src/languages/kire/documentSymbolRange";

describe("document symbol ranges", () => {
	it("extends the full range to cover the selection range", () => {
		expect(
			ensureRangeContainsSelection(
				{
					start: { line: 1, character: 0 },
					end: { line: 0, character: 20 },
				},
				{
					start: { line: 1, character: 0 },
					end: { line: 1, character: 8 },
				},
			),
		).toEqual({
			start: { line: 1, character: 0 },
			end: { line: 1, character: 8 },
		});
	});

	it("preserves a full range that already contains the selection", () => {
		expect(
			ensureRangeContainsSelection(
				{
					start: { line: 2, character: 4 },
					end: { line: 6, character: 0 },
				},
				{
					start: { line: 2, character: 4 },
					end: { line: 2, character: 11 },
				},
			),
		).toEqual({
			start: { line: 2, character: 4 },
			end: { line: 6, character: 0 },
		});
	});
});
