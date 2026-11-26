import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { H3 } from "h3";
import { kireH3 } from "../src/index";

const views = join(tmpdir(), `kire-h3-${Date.now()}`);
let app: H3;

beforeAll(() => {
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>{{ title }}</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>About {{ who }}</p>");

	const kire = kireH3({ views });
	app = new H3();
	app.get("/", () => kire.view("home", { title: "Hi" }));
	app.get("/about", () => kire.view("pages.about", { who: "Kire" }));
});

afterAll(() => {
	rmSync(views, { recursive: true, force: true });
});

describe("@kirejs/h3", () => {
	test("view() renders a view as an HTML Response", async () => {
		const res = await app.fetch(new Request("http://localhost/"));
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("view() renders a dotted view path", async () => {
		const res = await app.fetch(new Request("http://localhost/about"));
		expect((await res.text()).trim()).toBe("<p>About Kire</p>");
	});
});
