import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Koa from "koa";
import { kireKoa } from "../src/index";

const views = join(tmpdir(), `kire-koa-${Date.now()}`);
let server: any;
let base = "";

beforeAll(async () => {
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>{{ title }}</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>About {{ who }}</p>");

	const app = new Koa();
	app.use(kireKoa({ views }));

	app.use(async (ctx, next) => {
		if (ctx.path === "/render")
			return void (await ctx.view("home", { title: "Hi" }));
		if (ctx.path === "/view")
			return void (await ctx.view("pages.about", { who: "Kire" }));
		return next();
	});

	await new Promise<void>((resolve) => {
		server = app.listen(0, () => {
			base = `http://localhost:${server.address().port}`;
			resolve();
		});
	});
});

afterAll(() => {
	server?.close();
	rmSync(views, { recursive: true, force: true });
});

describe("@kirejs/koa", () => {
	test("ctx.view renders a view as HTML", async () => {
		const res = await fetch(`${base}/render`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("ctx.view renders a dotted view path as HTML", async () => {
		const res = await fetch(`${base}/view`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<p>About Kire</p>");
	});
});
