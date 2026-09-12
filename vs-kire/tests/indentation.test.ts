import { beforeEach, describe, expect, it } from "bun:test";
import { kireStore } from "../src/core/store";
import {
	computeLineIndentLevels,
	getLineStarts,
} from "../src/languages/kire/indentation";

const levelsOf = (text: string) =>
	computeLineIndentLevels(text, getLineStarts(text));

describe("indentation levels", () => {
	beforeEach(() => {
		kireStore.getState().clear();
		kireStore.getState().applyKireSchema({
			directives: [
				{ name: "if", children: true },
				{ name: "elseif", children: true, related: ["if", "elseif"] },
				{ name: "else", children: true, related: ["if", "elseif"] },
				{ name: "for", children: true },
				{
					name: "empty",
					children: true,
					related: ["for"],
					closeBy: ["endempty", "endfor", "end"],
				},
				{ name: "switch", children: true },
				{ name: "case", children: true, related: ["switch", "case"] },
				{ name: "include", children: false },
				{ name: "defined", children: "auto" },
			],
			elements: [{ name: "kire:if", void: false }, { name: "x-icon", void: true }],
		} as any);
	});

	it("indents html and directive blocks", () => {
		const text = [
			"<div>",
			"@if(a)",
			"<p>x</p>",
			"@else",
			"<p>y</p>",
			"@end",
			"</div>",
		].join("\n");
		expect(levelsOf(text)).toEqual([0, 1, 2, 1, 2, 1, 0]);
	});

	it("handles mixed lines by their net effect", () => {
		const text = ["<ul>", "<li>@if(x)</li>", "@end", "</ul>"].join("\n");
		// `<li>@if(x)</li>` opens li, opens if, closes li → net +1 (the @if)
		expect(levelsOf(text)).toEqual([0, 1, 1, 0]);

		const closeThenOpen = ["<div>", "</div><section>", "</section>"].join("\n");
		expect(levelsOf(closeThenOpen)).toEqual([0, 0, 0]);
	});

	it("ignores void elements, self-closing tags and non-block directives", () => {
		const text = [
			"<form>",
			'<input name="a">',
			"<x-icon />",
			"<br>",
			'@include("x")',
			"</form>",
		].join("\n");
		expect(levelsOf(text)).toEqual([0, 1, 1, 1, 1, 0]);
	});

	it("ignores tags and directives inside opaque regions", () => {
		const text = [
			"<div>",
			"<script>",
			"if (a<b) { x('@if') }",
			"</script>",
			"<!-- <span> @for -->",
			"{{ a < b }}",
			"<?js const t = '@if'; ?>",
			"</div>",
		].join("\n");
		// Lines inside <script> are re-indented by the embedded formatter, so
		// only the surrounding lines matter here.
		const levels = levelsOf(text);
		expect([levels[0], levels[1], levels[3], levels[4], levels[5], levels[6], levels[7]]).toEqual([
			0, 1, 1, 1, 1, 1, 0,
		]);
	});

	it("treats @empty as a branch inside @for and as a block outside", () => {
		const inside = ["@for(i of xs)", "<li>a</li>", "@empty", "<p>none</p>", "@end"].join(
			"\n",
		);
		expect(levelsOf(inside)).toEqual([0, 1, 0, 1, 0]);

		const outside = ["@empty(xs)", "<p>none</p>", "@endempty", "<hr>"].join("\n");
		expect(levelsOf(outside)).toEqual([0, 1, 0, 0]);
	});

	it("closes explicit branch with @endcase but the chain with @endswitch", () => {
		const text = [
			"@switch(v)",
			"@case(1)",
			"one",
			"@endcase",
			"@case(2)",
			"two",
			"@endswitch",
			"after",
		].join("\n");
		// Branches (@case) sit at the level of their chain root, like @else;
		// @endcase closes only the branch, so @switch stays open until @endswitch.
		expect(levelsOf(text)).toEqual([0, 0, 1, 0, 0, 1, 0, 0]);
	});

	it("does not indent after an auto directive that has no closer", () => {
		const text = ['@defined("x")', "<p>fb</p>", "@if(a)", "Y", "@end"].join("\n");
		expect(levelsOf(text)).toEqual([0, 0, 0, 1, 0]);
	});

	it("handles CRLF line endings", () => {
		const text = "<div>\r\n<p>x</p>\r\n</div>";
		expect(levelsOf(text)).toEqual([0, 1, 0]);
	});
});
