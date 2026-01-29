import { expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Kire } from "../src/index";

test("Kire - Default Directives: define/defined", async () => {
	const kire = new Kire({ silent: true });

	// Simple define and defined in same template
	const tpl = `
        @define('header')
            <h1>Header Content</h1>
        @end
        <div>
            @defined('header')
        </div>
    `;

	const result = await kire.render(tpl);
	// Clean up newlines/spaces for easier assertion
	const clean = result.replace(/\s+/g, " ").trim();
	expect(clean).toContain("<div> <h1>Header Content</h1> </div>");
});

test("Kire - Default Directives: native if/for", async () => {
	const kire = new Kire({ silent: true });
	const tpl = `
    @if(true)
      True
    @else
      False
    @end
    @for(i of [1,2])
      {{i}}
    @end
    `;
	const result = await kire.render(tpl);
	const clean = result.replace(/\s+/g, " ").trim();
	expect(clean).toContain("True");
	expect(clean).toContain("1 2");
});

test("Kire - Include", async () => {
	const testDir = resolve("./test-defaults-env");
	await mkdir(testDir, { recursive: true });

	const kire = new Kire({ silent: true });
	kire.namespace("views", testDir);
	kire.$resolver = async (path) => {
		const { readFile } = await import("node:fs/promises");
		return await readFile(path, "utf-8");
	};

	await writeFile(join(testDir, "header.kire"), "<h1>HEADER</h1>");

	const tpl = `@include('views.header')`;
	expect(await kire.render(tpl)).toBe("<h1>HEADER</h1>");

	const tpl2 = `@include('views.nonexistent')`;
	expect(await kire.render(tpl2)).toBe("");

	await rm(testDir, { recursive: true, force: true });
});
