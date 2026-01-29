import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Kire } from "../src/index";

describe("Kire Native Directives", () => {
	const kire = new Kire({ silent: true });

	const render = (template: string, locals = {}) =>
		kire.render(template, locals);

	describe("Control Flow", () => {
		it("@if / @else / @endif", async () => {
			const tpl = `@if(it.show)Show@else Hide@end`;
			expect(await render(tpl, { show: true })).toBe("Show");
			expect(await render(tpl, { show: false })).toBe(" Hide");
		});

		it("@if / @elseif / @else", async () => {
			const tpl = `@if(it.val > 10)GT10@elseif(it.val > 5)GT5@else LE5@end`;
			expect(await render(tpl, { val: 11 })).toBe("GT10");
			expect(await render(tpl, { val: 6 })).toBe("GT5");
			expect(await render(tpl, { val: 2 })).toBe(" LE5");
		});

		it("nested @if", async () => {
			const tpl = `@if(it.outer)Outer@if(it.inner)Inner@end@end`;
			expect(await render(tpl, { outer: true, inner: true })).toBe(
				"OuterInner",
			);
			expect(await render(tpl, { outer: true, inner: false })).toBe("Outer");
			expect(await render(tpl, { outer: false, inner: true })).toBe("");
		});

		it("@if with complex conditions", async () => {
			const tpl = `@if(it.a && it.b)Both@elseif(it.a || it.b)Either@else Neither@end`;
			expect(await render(tpl, { a: true, b: true })).toBe("Both");
			expect(await render(tpl, { a: true, b: false })).toBe("Either");
			expect(await render(tpl, { a: false, b: true })).toBe("Either");
			expect(await render(tpl, { a: false, b: false })).toBe(" Neither");
		});

		it("@if without else/elseif", async () => {
			const tpl = `@if(it.show)Content@end`;
			expect(await render(tpl, { show: true })).toBe("Content");
			expect(await render(tpl, { show: false })).toBe("");
		});

		it("@switch / @case / @default", async () => {
			const tpl = `@switch(it.val)@case('A')IsA@end@case('B')IsB@end@default IsDefault@end@end`;
			expect(await render(tpl, { val: "A" })).toBe("IsA");
			expect(await render(tpl, { val: "B" })).toBe("IsB");
			expect(await render(tpl, { val: "C" })).toBe(" IsDefault");
		});

		it("@switch with numeric cases", async () => {
			const tpl = `@switch(it.val)@case(1)Is1@end@case(2)Is2@end@default IsOther@end@end`;
			expect(await render(tpl, { val: 1 })).toBe("Is1");
			expect(await render(tpl, { val: 2 })).toBe("Is2");
			expect(await render(tpl, { val: 3 })).toBe(" IsOther");
		});
	});

	describe("Loops", () => {
		it("@for with array of", async () => {
			const tpl = `@for(item of it.items){{ item }},@end`;
			expect(await render(tpl, { items: [1, 2, 3] })).toBe("1,2,3,");
		});

		it("@for with empty array", async () => {
			const tpl = `@for(item of it.items){{ item }},@end`;
			expect(await render(tpl, { items: [] })).toBe("");
		});

		it("@for with object properties (for...in equivalent)", async () => {
			const tpl = `@for(key in it.obj){{ key }}:{{ it.obj[key] }},@end`;
			expect(await render(tpl, { obj: { a: 1, b: 2 } })).toBe("a:1,b:2,");
		});
	});

	describe("Variables", () => {
		it("@const", async () => {
			const tpl = `@const(x = 10){{ x }}`;
			expect(await render(tpl)).toBe("10");
		});

		it("@let", async () => {
			const tpl = `@let(x = 1){{ x }}<?js x++ ?>{{ x }}`;
			expect(await render(tpl)).toBe("12");
		});
	});

	describe("Code execution", () => {
		it("javascript", async () => {
			const obj = { val: 0 };
			await render(`<?js it.obj.val = 1; ?>`, { obj });
			expect(obj.val).toBe(1);
		});
	});
});

describe("Kire Real-world Scenarios", () => {
	const testDir = resolve("./test-directives-env");
	const viewsDir = join(testDir, "views");
	const compsDir = join(testDir, "components");

	const kire = new Kire({ silent: true });

	beforeAll(async () => {
		await mkdir(viewsDir, { recursive: true });
		await mkdir(compsDir, { recursive: true });

		// Setup Namespaces
		kire.namespace("views", viewsDir);
		kire.namespace("comps", compsDir);
							kire.namespace("theme", join(testDir, "themes/{name}"));
		
							// Mount default data for theme namespace
							kire.$prop({ name: "default" });
		// Setup Resolver (Realistic Node-like)
		const { readFile } = await import("node:fs/promises");
		kire.$resolver = async (path) => await readFile(path, "utf-8");

		// Create component file
		await writeFile(
			join(compsDir, "alert.kire"),
			`<div class="alert {{ it.type }}">{{ it.slots.default }} @if(it.slots.footer)<footer>{{ it.slots.footer }}</footer>@end</div>`,
		);

		// Create view files
		await writeFile(join(viewsDir, "child.kire"), `Child: {{ it.name }}`);
		await writeFile(
			join(viewsDir, "nested.kire"),
			`@include('views.grandchild', { item: it.n_item })`,
		);
		await writeFile(
			join(viewsDir, "grandchild.kire"),
			`Grandchild: {{ it.item.name }} and {{ it.item.value }}`,
		);

		// Create theme file
		const themePath = join(testDir, "themes/default");
		await mkdir(themePath, { recursive: true });
		await writeFile(
			join(themePath, "header.kire"),
			`<header>Default Header</header>`,
		);
	});

	afterAll(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	const render = (tpl: string, locals = {}) => kire.render(tpl, locals);

	describe("Layout & State Directives", () => {
		it("@define / @defined", async () => {
			const tpl = `@define('header')<h1>Head</h1>@end Body @defined('header')`;
			const html = await render(tpl);
			expect(html).toContain("<h1>Head</h1>");
			expect(html).toContain("Body");
		});

		it("@stack / @push", async () => {
			const tpl = `@push('js')1@end @push('js')2@end @stack('js')`;
			const html = await render(tpl);
			expect(html).toBe("  1\n2");
		});
	});

	describe("Component Directives", () => {
		it("@component with slots and namespaces", async () => {
			const tpl = `@component('comps.alert', { type: 'info' })Message @slot('footer')End@end@end`;
			const html = await render(tpl);
			expect(html).toContain('class="alert info"');
			expect(html).toContain("Message");
			expect(html).toContain("<footer>End</footer>");
		});

		it("@component with complex variables", async () => {
			const tpl = `@component('comps.alert', { type: it.user.status })Hello {{ it.user.name }}@end`;
			const html = await render(tpl, {
				user: { name: "World", status: "success" },
			});
			expect(html).toContain('class="alert success"');
			expect(html).toContain("Hello World");
		});
	});

	describe("Include & Namespace Directives", () => {
		it("@include with namespaced dot notation", async () => {
			const tpl = `@include('views.child', { name: 'Test' })`;
			expect(await render(tpl)).toBe("Child: Test");
		});

		it("@include with nested namespaced includes", async () => {
			const tpl = `@include('views.nested', { n_item: { name: 'A', value: 1 } })`;
			expect(await render(tpl)).toBe("Grandchild: A and 1");
		});

		it("@include with placeholder namespace (theme)", async () => {
			const tpl = `@include('theme.header')`;
			expect(await render(tpl, { name: "default" })).toBe(
				"<header>Default Header</header>",
			);
		});
	});
});
