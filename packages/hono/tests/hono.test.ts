import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Hono } from "hono";
import { kireHono } from "../src/index";

const views = join(tmpdir(), `kire-hono-${Date.now()}`);
let app: Hono;

beforeAll(() => {
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>{{ title }}</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>About {{ who }}</p>");

	app = new Hono();
	app.use(kireHono({ views }));
	app.get("/home", (c) => c.var.view("home", { title: "Hi" }));
	app.get("/about", (c) => c.get("view")("pages.about", { who: "Kire" }));
});

afterAll(() => {
	rmSync(views, { recursive: true, force: true });
});

describe("@kirejs/hono", () => {
	test("context.view renders and sends HTML", async () => {
		const res = await app.fetch(new Request("http://localhost/home"));
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("context.view supports dotted view paths", async () => {
		const res = await app.fetch(new Request("http://localhost/about"));
		expect((await res.text()).trim()).toBe("<p>About Kire</p>");
	});
});
