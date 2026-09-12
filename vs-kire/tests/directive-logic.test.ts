import { beforeEach, describe, expect, it } from "bun:test";
import {
	directiveOpensBlock,
	getDirectiveContextStack,
} from "../src/core/directiveLogic";
import { scanDirectives } from "../src/core/directiveScan";
import { kireStore } from "../src/core/store";

describe("directive logic", () => {
	beforeEach(() => {
		kireStore.getState().clear();
		kireStore.getState().applyKireSchema({
			directives: [
				{
					name: "if",
					children: true,
				},
				{
					name: "elseif",
					children: true,
					related: ["if", "elseif", "unless"],
				},
				{
					name: "else",
					children: true,
					related: ["if", "elseif", "unless"],
				},
				{
					name: "defined",
					children: "auto",
				},
			],
		} as any);
	});

	it("does not open auto blocks without an explicit closer", () => {
		const text = '@defined("content") fallback';
		const [call] = scanDirectives(text);

		expect(call).toBeDefined();
		expect(directiveOpensBlock(text, call!)).toBe(false);
		expect(getDirectiveContextStack(text, text.length)).toEqual([]);
	});

	it("opens auto blocks when an explicit closer exists", () => {
		const text = '@defined("content")\n  fallback\n@enddefined';
		const [call] = scanDirectives(text);

		expect(call).toBeDefined();
		expect(directiveOpensBlock(text, call!)).toBe(true);
	});

	it("closes related directive chains on a generic @end", () => {
		const text = "@if(condition)\n@elseif(other)\n@else\n@end";
		expect(getDirectiveContextStack(text, text.length)).toEqual([]);
	});

	it("closes root directives on explicit end tokens", () => {
		const text = "@if(condition)\n@endif";
		expect(getDirectiveContextStack(text, text.length)).toEqual([]);
	});
});

describe("directive logic regressions", () => {
	beforeEach(() => {
		kireStore.getState().clear();
		kireStore.getState().applyKireSchema({
			directives: [
				{ name: "if", children: true },
				{ name: "else", children: true, related: ["if"] },
				{ name: "for", children: true },
				{
					name: "empty",
					children: true,
					related: ["for", "each"],
					closeBy: ["endempty", "endfor", "endeach", "end"],
				},
				{ name: "defined", children: "auto" },
			],
		} as any);
	});

	it("auto block does not claim the @end of a later sibling block", () => {
		const text = '@defined("x")<p>fb</p>@if(a)Y@end';
		const [call] = scanDirectives(text);
		expect(directiveOpensBlock(text, call!)).toBe(false);
		expect(getDirectiveContextStack(text, text.length)).toEqual([]);
	});

	it("auto block still owns a nested block followed by its own @end", () => {
		const text = '@defined("x")@if(a)Y@end@end';
		const [call] = scanDirectives(text);
		expect(directiveOpensBlock(text, call!)).toBe(true);
	});

	it("@empty with its own closer may be used standalone", () => {
		const text = "@empty(items) none ";
		expect(getDirectiveContextStack(text, text.length)).toEqual(["empty"]);
		const closed = "@empty(items) none @endempty";
		expect(getDirectiveContextStack(closed, closed.length)).toEqual([]);
	});
});
