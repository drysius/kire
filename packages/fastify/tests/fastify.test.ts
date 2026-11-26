import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Fastify from "fastify";
import { kireFastify } from "../src/index";

const views = join(tmpdir(), `kire-fastify-${Date.now()}`);
let app: any;
let base = "";

beforeAll(async () => {
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>{{ title }}</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>About {{ who }}</p>");

	app = Fastify();
	kireFastify(app, { views });
	app.get("/home", (_req: unknown, reply: any) =>
		reply.view("home", { title: "Hi" }),
	);
	app.get("/about", (_req: unknown, reply: any) =>
		reply.view("pages.about", { who: "Kire" }),
	);
	base = await app.listen({ port: 0 });
});

afterAll(async () => {
	await app?.close();
	rmSync(views, { recursive: true, force: true });
});

describe("@kirejs/fastify", () => {
	test("reply.view renders and sends HTML", async () => {
		const res = await fetch(`${base}/home`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("reply.view supports dotted view paths", async () => {
		const res = await fetch(`${base}/about`);
		expect((await res.text()).trim()).toBe("<p>About Kire</p>");
	});
});
