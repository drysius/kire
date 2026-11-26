import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Elysia } from "elysia";
import { kireElysia } from "../src/index";

const views = join(tmpdir(), `kire-elysia-${Date.now()}`);
let app: any;
let base = "";

beforeAll(() => {
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>{{ title }}</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>About {{ who }}</p>");

	app = new Elysia()
		.use(kireElysia({ views }))
		.get("/home", ({ view }: any) => view("home", { title: "Hi" }))
		.get("/about", ({ view }: any) => view("pages.about", { who: "Kire" }))
		.listen(0);
	base = `http://localhost:${app.server.port}`;
});

afterAll(() => {
	app?.stop();
	rmSync(views, { recursive: true, force: true });
});

describe("@kirejs/elysia", () => {
	test("context.view renders and sends HTML", async () => {
		const res = await fetch(`${base}/home`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("context.view supports dotted view paths", async () => {
		const res = await fetch(`${base}/about`);
		expect((await res.text()).trim()).toBe("<p>About Kire</p>");
	});
});
