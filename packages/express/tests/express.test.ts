import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { kireExpress } from "../src/index";

const views = join(tmpdir(), `kire-express-${Date.now()}`);
let server: any;
let base = "";

beforeAll(async () => {
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>{{ title }}</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>About {{ who }}</p>");

	const app = express();
	kireExpress(app, { views });
	app.get("/render", (_req, res) => res.render("home", { title: "Hi" }));
	app.get("/view", (_req, res) =>
		(res as any).view("pages.about", { who: "Kire" }),
	);

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

describe("@kirejs/express", () => {
	test("res.render uses Kire as the view engine", async () => {
		const res = await fetch(`${base}/render`);
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("res.view renders a dotted view path as HTML", async () => {
		const res = await fetch(`${base}/view`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<p>About Kire</p>");
	});
});
