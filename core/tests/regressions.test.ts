import { describe, expect, test } from "bun:test";
import { Kire } from "../src/kire";

describe("Lexer regressions", () => {
	const kire = new Kire({ async: false, silent: true });

	test("void HTML elements without '/' do not swallow @end", () => {
		const tpl = `@if(editing)<input name="title">@else<span>x</span>@end<button>Save</button>`;
		expect(kire.render(tpl, { editing: true })).toBe(
			`<input name="title"><button>Save</button>`,
		);
		expect(kire.render(tpl, { editing: false })).toBe(
			`<span>x</span><button>Save</button>`,
		);
	});

	test("void elements inside element directives", () => {
		const tpl = `<kire:if cond="a"><img src="x.png"><br></kire:if>AFTER`;
		expect(kire.render(tpl, { a: true })).toBe(`<img src="x.png"><br>AFTER`);
		expect(kire.render(tpl, { a: false })).toBe("AFTER");
	});

	test("@end after a chained branch closes the whole chain", () => {
		const kire2 = new Kire({ async: false, silent: true });
		expect(kire2.render(`@if(a)A@elseB@end C`, { a: false })).toBe("B C");
		expect(kire2.render(`@if(a)A@elseif(b)B@elseC@endif D`, { a: false, b: true })).toBe(
			"B D",
		);
		expect(
			kire2.render(`@switch(v)@case(1)one@default other@end|`, { v: 2 }),
		).toBe(" other|");
		expect(kire2.render(`@for(i of xs){{i}}@empty none@end!`, { xs: [] })).toBe(
			" none!",
		);
	});

	test("@end never closes an open HTML element", () => {
		const tpl = `<ul>@for(i of items)<li>{{ i }}@end</ul>`;
		expect(kire.render(tpl, { items: [1, 2] })).toBe(
			`<ul><li>1</li><li>2</li></ul>`,
		);
	});

	test("children:'auto' directive does not claim a later @end", () => {
		const tpl = `@defined("x")<p>fb</p>@if(a)Y@end`;
		// @if is a sibling of @defined, not its child
		const nodes = kire.parse(tpl);
		const directives = nodes.filter((n) => n.type === "directive");
		expect(directives.map((n) => n.name)).toEqual(["defined", "if"]);
		expect(kire.render(tpl, { a: true })).toBe("<p>fb</p>Y");
		expect(kire.render(tpl, { a: false })).toBe("<p>fb</p>");
	});

	test("children:'auto' directive still owns its own @end", () => {
		const tpl = `@defined("x")<p>fb</p>@enddefined!`;
		expect(kire.render(tpl)).toBe("<p>fb</p>!");
		const nested = `@defined("x")@if(a)Y@end@end!`;
		expect(kire.render(nested, { a: true })).toBe("Y!");
	});
});

describe("Runtime regressions", () => {
	test("@once is scoped to a single render", () => {
		const kire = new Kire({ async: false, silent: true });
		const tpl = `@once A@end@once A@end`;
		expect(kire.render(tpl)).toBe(" A A");
		expect(kire.render(tpl)).toBe(" A A");
	});

	test("@once dedupes across includes within one render", () => {
		const kire = new Kire({
			async: false,
			silent: true,
			files: { "part.kire": `@once X@end` },
		});
		expect(kire.render(`@include("part")@include("part")`)).toBe(" X");
		expect(kire.render(`@include("part")`)).toBe(" X");
	});

	test("fork props reach @include and @component", () => {
		const parent = new Kire({
			async: false,
			silent: true,
			files: { "p.kire": "[{{ who }}]" },
		});
		const fork = parent.fork();
		fork.$prop("who", "fork");
		expect(fork.render(`{{ who }} @include("p")`)).toBe("fork [fork]");
		expect(fork.render(`@component("p")@end`)).toBe("[fork]");
	});
});
