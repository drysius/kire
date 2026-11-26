import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Kire } from "../src/kire";

const kire = new Kire({ production: false });
const r = async (tpl: string, locals: Record<string, unknown> = {}) =>
	(await kire.render(tpl, locals)).replace(/\s+/g, " ").trim();

describe("Blade parity — loops", () => {
	test("@foreach with `as` syntax", async () => {
		expect(
			await r("@foreach(users as u){{ u }}|@endforeach", { users: ["a", "b"] }),
		).toBe("a|b|");
	});

	test("@foreach with key => value over an object", async () => {
		expect(
			await r("@foreach(obj as k => v){{ k }}={{ v }};@endforeach", {
				obj: { x: 1, y: 2 },
			}),
		).toBe("x=1;y=2;");
	});

	test("@foreach exposes $loop", async () => {
		expect(
			await r("@foreach(users as u){{ $loop.index }}:{{ u }} @endforeach", {
				users: ["a", "b"],
			}),
		).toBe("0:a 1:b");
	});

	test("@forelse falls back to @empty branch", async () => {
		const tpl = "@forelse(users as u){{ u }}@empty NONE @endforelse";
		expect(await r(tpl, { users: [] })).toBe("NONE");
		expect(await r(tpl, { users: ["z"] })).toBe("z");
	});

	test("@while", async () => {
		expect(
			await r("@let(i = 0)@while(i < 3){{ i }}@let(i = i + 1)@endwhile"),
		).toBe("012");
	});

	test("@break with condition", async () => {
		expect(
			await r("@foreach(n as x)@break(x === 2){{ x }}@endforeach", {
				n: [1, 2, 3],
			}),
		).toBe("1");
	});

	test("@continue with condition", async () => {
		expect(
			await r("@foreach(n as x)@continue(x === 2){{ x }}@endforeach", {
				n: [1, 2, 3],
			}),
		).toBe("13");
	});

	test("@break and @continue work inside @for too (for-loop codegen)", async () => {
		expect(
			await r("@for(x of n)@continue(x === 2){{ x }}@end", { n: [1, 2, 3] }),
		).toBe("13");
		expect(
			await r("@for(x of n)@break(x === 2){{ x }}@end", { n: [1, 2, 3] }),
		).toBe("1");
	});
});

describe("Blade parity — unescaped echo", () => {
	test("{!! !!} renders unescaped (alias of {{{ }}})", async () => {
		expect(await r("{!! html !!}", { html: "<b>hi</b>" })).toBe("<b>hi</b>");
	});

	test("@{!! !!} renders literally", async () => {
		expect(await kire.render("@{!! html !!}", { html: "<b>hi</b>" })).toBe(
			"{!! html !!}",
		);
	});

	test("{{ }} still escapes", async () => {
		expect(await r("{{ html }}", { html: "<b>hi</b>" })).toBe(
			"&lt;b&gt;hi&lt;/b&gt;",
		);
	});
});

describe("Blade parity — output & environment", () => {
	test("@json serializes for a JS context", async () => {
		expect(
			await r("<script>var d = @json(user)</script>", {
				user: { a: 1, b: "<x>" },
			}),
		).toBe('<script>var d = {"a":1,"b":"<x>"}</script>');
	});

	test("@dump outputs a debug block", async () => {
		expect(await r("@dump(user)", { user: { a: 1 } })).toContain("kire-dump");
	});

	test("@dd dumps and halts the rest of the template", async () => {
		const out = await r("A@dd(user)B", { user: { a: 1 } });
		expect(out).toContain("A");
		expect(out).not.toContain("B");
	});

	test("@env matches a single name and an array", async () => {
		const k = new Kire({ production: false });
		k.$global("env", "production");
		expect((await k.render('@env("production")PROD@endenv', {})).trim()).toBe(
			"PROD",
		);
		expect((await k.render('@env("local")DEV@endenv', {})).trim()).toBe("");
		expect(
			(await k.render('@env(["local","production"])Y@endenv', {})).trim(),
		).toBe("Y");
	});

	test("@production gates on env", async () => {
		const prod = new Kire({ production: false });
		prod.$global("env", "production");
		expect(
			(await prod.render("@production\nPROD\n@endproduction", {})).trim(),
		).toBe("PROD");
		const local = new Kire({ production: false });
		local.$global("env", "local");
		expect(
			(await local.render("@production\nPROD\n@endproduction", {})).trim(),
		).toBe("");
	});

	test("@inject reads from $globals.services", async () => {
		const k = new Kire({ production: false });
		k.$global("services", { MetricsService: { hits: 42 } });
		expect(
			(await k.render('@inject(m, "MetricsService"){{ m.hits }}', {})).trim(),
		).toBe("42");
	});

	test("@session renders when set and exposes $value", async () => {
		const k = new Kire({ production: false });
		k.$global("session", { status: "Saved!", empty: null });
		expect(
			(
				await k.render('@session("status")<b>{{ $value }}</b>@endsession', {})
			).trim(),
		).toBe("<b>Saved!</b>");
		expect(
			(await k.render('X@session("empty")Y@endsession Z', {}))
				.replace(/\s+/g, " ")
				.trim(),
		).toBe("X Z");
	});
});

describe("Alpine.js interop — unknown @attributes pass through", () => {
	test("@click and modifiers are kept as literal attributes", async () => {
		expect(await r('<button @click="count++">x</button>')).toBe(
			'<button @click="count++">x</button>',
		);
		expect(
			await r('<div @click.away="o=0" @keydown.escape="c()">x</div>'),
		).toBe('<div @click.away="o=0" @keydown.escape="c()">x</div>');
	});

	test("mixes with x-data and : bindings", async () => {
		expect(
			await r(
				'<div x-data="{open:false}" @click="open=!open" :class="open?1:0">x</div>',
			),
		).toBe(
			'<div x-data="{open:false}" @click="open=!open" :class="open?1:0">x</div>',
		);
	});

	test("registered attribute directives still run", async () => {
		expect(
			await r('<div @class(["btn", { active: on }])>x</div>', { on: true }),
		).toBe('<div class="btn active">x</div>');
		expect(
			await r('<button @attrs({ type: "button", disabled: d })>x</button>', {
				d: true,
			}),
		).toBe('<button type="button" disabled>x</button>');
	});
});

describe("Blade parity — @verbatim", () => {
	test("emits inner content literally", async () => {
		expect(await r("@verbatim{{ x }} @if(y)@endif@endverbatim", {})).toBe(
			"{{ x }} @if(y)@endif",
		);
	});
});

describe("Blade parity — include family", () => {
	const root = join(tmpdir(), `kire-parity-inc-${Date.now()}`);
	const view = (
		name: string,
		body: string,
		locals: Record<string, unknown> = {},
	) => {
		writeFileSync(join(root, "page.kire"), body);
		return new Kire({ root, silent: true, production: false }).view(
			"page",
			locals,
		);
	};

	beforeAll(() => {
		mkdirSync(root, { recursive: true });
		writeFileSync(join(root, "alert.kire"), "ALERT:{{ type }}");
		writeFileSync(join(root, "sidebar.kire"), "SIDEBAR");
	});
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test("@includeIf includes when present, nothing when missing", async () => {
		expect((await view("if-ok", 'A@includeIf("sidebar")B')).trim()).toBe(
			"ASIDEBARB",
		);
		expect((await view("if-miss", 'A@includeIf("ghost")B')).trim()).toBe("AB");
	});

	test("@includeWhen / @includeUnless gate on a condition", async () => {
		expect(
			(
				await view("w1", '@includeWhen(admin, "sidebar")', { admin: true })
			).trim(),
		).toBe("SIDEBAR");
		expect(
			(
				await view("w2", 'X@includeWhen(admin, "sidebar")Y', { admin: false })
			).trim(),
		).toBe("XY");
		expect(
			(
				await view("u1", '@includeUnless(guest, "sidebar")', { guest: false })
			).trim(),
		).toBe("SIDEBAR");
	});

	test("@includeFirst picks the first existing view", async () => {
		expect(
			(await view("f1", '@includeFirst(["ghost", "sidebar"])')).trim(),
		).toBe("SIDEBAR");
	});
});

describe("Blade parity — stacks & sections", () => {
	const root = join(tmpdir(), `kire-parity-stack-${Date.now()}`);
	const view = async (body: string, locals: Record<string, unknown> = {}) => {
		writeFileSync(join(root, "page.kire"), body);
		const out = await new Kire({ root, silent: true, production: false }).view(
			"page",
			locals,
		);
		return out.replace(/\s+/g, " ").trim();
	};
	beforeAll(() => {
		mkdirSync(root, { recursive: true });
		writeFileSync(
			join(root, "layout.kire"),
			'<main>@show("body")DEFAULT@endshow</main>',
		);
	});
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test("@prepend adds to the front of a stack", async () => {
		expect(
			await view('@push("s")A@endpush@prepend("s")Z@endprepend[@stack("s")]'),
		).toBe("[Z A]");
	});

	test("@pushOnce dedupes across iterations", async () => {
		expect(
			await view(
				'@for(x of n)@pushOnce("s")ONCE@endPushOnce@end[@stack("s")]',
				{ n: [1, 2, 3] },
			),
		).toBe("[ONCE]");
	});

	test("@show renders default, overridable by a provided slot", async () => {
		expect(await view('@component("layout")@end')).toBe("<main>DEFAULT</main>");
		expect(
			await view('@component("layout")@slot("body")OVERRIDE@end@end'),
		).toBe("<main>OVERRIDE</main>");
	});
});

describe("Blade parity — @props & $attributes", () => {
	const root = join(tmpdir(), `kire-parity-props-${Date.now()}`);
	const page = async (body: string, locals: Record<string, unknown> = {}) => {
		writeFileSync(join(root, "page.kire"), body);
		const k = new Kire({ root, silent: true, production: false });
		k.namespace("components", "components");
		return (await k.view("page", locals)).replace(/\s+/g, " ").trim();
	};
	beforeAll(() => {
		mkdirSync(join(root, "components"), { recursive: true });
		writeFileSync(
			join(root, "components", "alert.kire"),
			'@props({ type: "info" })<div class="alert-{{ type }}" @attrs($attributes)>{{ slots.default }}</div>',
		);
		writeFileSync(
			join(root, "components", "btn.kire"),
			'@props(["label"])<button @attrs($attributes.merge({ class: "btn", type: "button" }))>{{ label }}</button>',
		);
	});
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test("default prop + attribute passthrough, declared prop stripped", async () => {
		expect(await page('<x-alert id="a1" data-x="y">Hi</x-alert>')).toBe(
			'<div class="alert-info" id="a1" data-x="y">Hi</div>',
		);
	});

	test("prop override is consumed, not leaked into $attributes", async () => {
		expect(await page('<x-alert type="error" id="a2">Boom</x-alert>')).toBe(
			'<div class="alert-error" id="a2">Boom</div>',
		);
	});

	test("$attributes.merge concatenates class and applies defaults", async () => {
		expect(await page('<x-btn label="Go" class="primary" />')).toBe(
			'<button class="btn primary" type="button">Go</button>',
		);
		expect(await page('<x-btn label="Go" />')).toBe(
			'<button class="btn" type="button">Go</button>',
		);
	});
});
