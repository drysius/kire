import { describe, expect, test } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Core (Bun)", () => {
	const kire = new Kire({ production: true });

	test("should render simple text", async () => {
		const result = await kire.render("Hello World");
		expect(result).toBe("Hello World");
	});

	test("should render variables", async () => {
		const result = await kire.render("Hello {{ name }}", { name: "Kire" });
		expect(result).toBe("Hello Kire");
	});

	test("should parse interpolation when close token appears inside quoted strings", async () => {
		const k = new Kire({ production: true, silent: true });
		const result = await k.render('{{ "a}}" }}|{{ ({ txt: "b}}" }).txt }}');
		expect(result).toBe("a}}|b}}");
	});

	test("should parse escaped quotes in HTML attributes", async () => {
		const k = new Kire({ production: true, silent: true });
		const result = await k.render("<div title=\"a\\\"b\" data='a\\'b'></div>");
		expect(result).toContain('title="a&quot;b"');
		expect(result).toContain('data="a&#039;b"');
	});

	test("should escape dynamic interpolation in HTML attributes", async () => {
		const k = new Kire({ production: true, silent: true });
		const result = await k.render('<a href="{{ url }}">Link</a>', {
			url: 'javascript:alert(1)" onmouseover="x',
		});
		expect(result).toContain('href="javascript:alert(1)&quot; onmouseover=&quot;x"');
		expect(result).not.toContain(' onmouseover="x"');
	});

	test("should handle @if directive", async () => {
		const template = `
            @if(show)
                Visible
            @else
                Hidden
            @endif
        `.trim();

		const res1 = await kire.render(template, { show: true });
		expect(res1.trim()).toBe("Visible");

		const res2 = await kire.render(template, { show: false });
		expect(res2.trim()).toBe("Hidden");
	});

	test("should handle @for loop", async () => {
		const template = `@for(item of items){{ item }}@endfor`;
		const result = await kire.render(template, { items: [1, 2, 3] });
		expect(result).toBe("123");
	});

	test("should handle custom elements (compiler-based)", async () => {
		const k = new Kire();
		k.element({
			name: "my-tag",
			onCall: (api) => {
				api.raw('$kire_response += "<span>";');
				if (api.children) api.set(api.children);
				api.raw('$kire_response += "</span>";');
			},
		});

		const result = await k.render("<my-tag>Hello</my-tag>");
		expect(result).toBe("<span>Hello</span>");
	});

	test("should handle nested custom elements (compiler-based)", async () => {
		const k = new Kire();
		k.element({
			name: "outer",
			onCall: (api) => {
				api.raw('$kire_response += "<div>";');
				if (api.children) api.set(api.children);
				api.raw('$kire_response += "</div>";');
			},
		});
		k.element({
			name: "inner",
			onCall: (api) => {
				api.raw('$kire_response += "<span>";');
				if (api.children) api.set(api.children);
				api.raw('$kire_response += "</span>";');
			},
		});

		const result = await k.render("<outer><inner>Text</inner></outer>");
		expect(result).toBe("<div><span>Text</span></div>");
	});

	test("should allow declaration-only elements for schema/intellisense", async () => {
		const k = new Kire();
		k.element({
			name: "z-card",
			description: "Schema-only element declaration",
			attributes: [{ name: "title", type: "string" }],
			declares: [{ fromAttribute: "title", type: "string" }],
		});

		const declared = k.$schema.elements.find(
			(entry) => entry.name === "z-card",
		);
		expect(declared?.name).toBe("z-card");
		expect(declared?.attributes?.[0]?.name).toBe("title");
		expect(declared?.declares?.[0]?.fromAttribute).toBe("title");

		// No runtime transformer => render should keep original markup.
		const output = await k.render('<z-card title="Example">Body</z-card>');
		expect(output).toContain("<z-card");
		expect(output).toContain("Body");
	});

	test("should publish signature and declares metadata for directives", () => {
		const k = new Kire();
		k.directive({
			name: "typed-const",
			signature: ["expr:string"],
			declares: [
				{ fromArg: 0, pattern: "$name = $value", capture: "name", type: "any" },
			],
			onCall: () => {},
		});

		const declared = k.$schema.directives.find(
			(entry) => entry.name === "typed-const",
		);
		const runtime = k.getDirective("typed-const");

		expect(declared?.signature).toEqual(["expr:string"]);
		expect(declared?.declares?.[0]?.pattern).toBe("$name = $value");
		expect(runtime?.signature).toEqual(["expr:string"]);
	});

	test("should handle prototype-based globals shadowing", async () => {
		const k = new Kire();
		k.$global("theme", "dark");

		const result1 = await k.render("Theme: {{ theme }}");
		expect(result1).toBe("Theme: dark");

		// Shadowing in a fork or via locals
		const result2 = await k.render("Theme: {{ theme }}", { theme: "light" });
		expect(result2).toBe("Theme: light");
	});

	test("should support custom local variable alias", async () => {
		const k = new Kire({ local_variable: "ctx" });
		const result = await k.render("Hello {{ ctx.name }}", { name: "Kire" });
		expect(result).toBe("Hello Kire");
	});

	test("should reject invalid local variable alias", () => {
		expect(() => new Kire({ local_variable: "ctx.name" as any })).toThrow(
			"Invalid local_variable",
		);
	});

	test("should not mark sync templates as async when 'await' appears inside string literals", () => {
		const sync = new Kire({ production: true, async: false, silent: true });
		const result = sync.render("{{ 'await' }}");
		expect(result).toBe("await");
	});

	test("should not mark sync templates as async when await is used as property/key", () => {
		const sync = new Kire({ production: true, async: false, silent: true });
		const result = sync.render("{{ ({ await: 1 }).await }}");
		expect(result).toBe("1");
	});

	test("should mark template async when await keyword is actually used", async () => {
		const asyncKire = new Kire({ production: true, async: true, silent: true });
		const result = await asyncKire.render("{{ await Promise.resolve('ok') }}", {
			Promise,
		});
		expect(result).toBe("ok");
	});

	test("should mark template async when await is used inside HTML attributes", async () => {
		const asyncKire = new Kire({ production: true, async: true, silent: true });
		const result = await asyncKire.render(
			'<img src="{{ await Promise.resolve(\'ok\') }}">',
			{ Promise },
		);
		expect(result).toBe('<img src="ok"></img>');
	});

	test("use_global: true (default) — props win, unknown identifiers fall back to globalThis", async () => {
		const k = new Kire({ production: true, silent: true });

		// Props still take priority (nullish coalescing: 0 is not null/undefined)
		const shadowed = await k.render("{{ process ? 'YES' : 'NO' }}", {
			process: 0,
		} as any);
		expect(shadowed).toBe("NO");

		// Identifiers not in props/globals fall back to globalThis (e.g. Math, String)
		const builtinAvail = await k.render("{{ typeof Math }}");
		expect(builtinAvail).toBe("object");
	});

	test("use_global: false — identifiers isolated to props/globals only", async () => {
		const k = new Kire({ production: true, silent: true, use_global: false });

		// Props still take priority
		const shadowed = await k.render("{{ process ? 'YES' : 'NO' }}", {
			process: 0,
		} as any);
		expect(shadowed).toBe("NO");

		// Without use_global, globals outside props/kire-globals are undefined
		const isolated = await k.render("{{ typeof Math }}");
		expect(isolated).toBe("undefined");
	});

	test("should declare identifiers used in ternary branches", async () => {
		const k = new Kire({ production: true, silent: true });
		const result = await k.render("{{ cond ? yesVar : noVar }}", {
			cond: true,
			yesVar: "YES",
			noVar: "NO",
		});
		expect(result).toBe("YES");
	});

	test("should not inject duplicate declarations for comma-separated js variables", async () => {
		const k = new Kire({ production: true, silent: true });
		const result = await k.render("<?js const a = 1, b = 2; ?>{{ b }}");
		expect(result).toBe("2");
	});

	test("should respect destructuring declarations inside js blocks", async () => {
		const k = new Kire({ production: true, silent: true });
		const result = await k.render(
			"<?js const { a: first, b = 2 } = { a: 1 }; ?>{{ first }}-{{ b }}",
		);
		expect(result).toBe("1-2");
	});

	test("renderAttributes should evaluate dynamic expressions, not output them as literal text", async () => {
		const k = new Kire({ production: true, silent: true });
		k.element({
			name: "my-box",
			onCall: (api) => {
				api.append("<div");
				api.renderAttributes();
				api.append(">");
				api.renderChildren();
				api.append("</div>");
			},
		});

		// Pure interpolation
		const r1 = await k.render('<my-box class="{{ role }}">hi</my-box>', {
			role: "admin",
		});
		expect(r1).toBe('<div class="admin">hi</div>');

		// Mixed interpolation
		const r2 = await k.render(
			'<my-box class="box-{{ role }}">hi</my-box>',
			{ role: "admin" },
		);
		expect(r2).toBe('<div class="box-admin">hi</div>');
	});

	test("x-* component mixed attrs should declare identifiers correctly (no ReferenceError)", async () => {
		const k = new Kire({ production: true, silent: true });
		k.$files[k.resolvePath("card")] = "<p>{{ title }}</p>";
		k.$global("request", { user: { name: "Alice", role: "admin" } });

		// request only appears inside a mixed x-* attribute
		const r = await k.render(
			'<x-card title="{{ request.user.name }} Dashboard">body</x-card>',
		);
		expect(r).toBe("<p>Alice Dashboard</p>");

		// same via @include dep
		k.$files[k.resolvePath("partial")] =
			'<x-card title="{{ request.user.name }} Dashboard">body</x-card>';
		const r2 = await k.render("@include('partial')");
		expect(r2).toBe("<p>Alice Dashboard</p>");
	});
});
