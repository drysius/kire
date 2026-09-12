import { beforeEach, describe, expect, it } from "bun:test";
import { Kire } from "../../core/src/kire";
import { getStructuralProblems } from "../src/core/engineParse";
import { kireStore } from "../src/core/store";

describe("engine-backed structural diagnostics", () => {
	beforeEach(() => {
		kireStore.getState().clear();
		kireStore
			.getState()
			.setEngine(new Kire({ async: false, silent: true, production: true }));
	});

	it("returns null without an engine", () => {
		kireStore.getState().setEngine(null);
		expect(getStructuralProblems("@if(a)")).toBeNull();
	});

	it("reports what the engine lexer sees", () => {
		const problems = getStructuralProblems(`<p>@if(a) x</p>`)!;
		expect(problems.map((p) => [p.message, p.severity])).toEqual([
			["@if is not closed", "warning"],
		]);
		expect(problems[0]!.start).toBe(3);
	});

	it("does not flag void elements or @if/@else/@end chains", () => {
		const text = `@if(e)<input name="t">@else<span>x</span>@end<button>S</button>`;
		expect(getStructuralProblems(text)).toEqual([]);
	});

	it("registers schema-only directives so their blocks are understood", () => {
		kireStore.getState().applyKireSchema({
			directives: [{ name: "card", children: true }],
		} as any);
		expect(getStructuralProblems(`@card(1) body @end`)).toEqual([]);
		expect(getStructuralProblems(`@card(1) body`)![0]!.message).toBe(
			"@card is not closed",
		);
	});
});
