import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Kire } from "../src/kire";

describe("Layout Directives", () => {
	const testDir = resolve("./test-layout-env");

	beforeAll(async () => {
		await mkdir(testDir, { recursive: true });
	});

	afterAll(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("should render a layout with parameters", async () => {
		const kire = new Kire();
		kire.namespace("layouts", testDir);
		kire.$resolver = async (p) => await readFile(p, "utf-8");

		await writeFile(join(testDir, "main.kire"), `<h1>{{ it.title }}</h1>`);

		const template = `@include('layouts.main', { title: 'Hello Layout' })`;
		const result = await kire.render(template);

		expect(result).toBe("<h1>Hello Layout</h1>");
	});

	it("should render a layout with implicit locals", async () => {
		const kire = new Kire();
		kire.namespace("layouts", testDir);
		kire.$resolver = async (p) => await readFile(p, "utf-8");

		await writeFile(join(testDir, "implicit.kire"), `<h1>{{ it.title }}</h1>`);

		const template = `@include('layouts.implicit', { title: 'Implicit' })`;
		const result = await kire.render(template);

		expect(result).toBe("<h1>Implicit</h1>");
	});
});
