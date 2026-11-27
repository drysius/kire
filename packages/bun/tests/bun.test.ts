import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kireBun } from "../src/index";

let views = "";
let server: any;
let base = "";

beforeAll(() => {
	views = join(tmpdir(), `kire-bun-${Date.now()}`);
	mkdirSync(join(views, "pages"), { recursive: true });
	writeFileSync(join(views, "home.kire"), "<h1>Hi</h1>");
	writeFileSync(join(views, "pages", "about.kire"), "<p>{{ who }}</p>");

	const kire = kireBun({ views });
	server = Bun.serve({
		port: 0,
		async fetch(req) {
			const res = await kire.wire(req);
			if (res !== null) return res as Response;
			const { pathname } = new URL(req.url);
			if (pathname === "/") return kire.view("home");
			if (pathname === "/about")
				return kire.view("pages.about", { who: "Kire" });
			return new Response("Not Found", { status: 404 });
		},
	});
	base = `http://localhost:${server.port}`;
});

afterAll(() => {
	server?.stop(true);
	rmSync(views, { recursive: true, force: true });
});

describe("@kirejs/bun", () => {
	test("view() renders a view as HTML", async () => {
		const res = await fetch(`${base}/`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<h1>Hi</h1>");
	});

	test("view() renders a dotted view path as HTML", async () => {
		const res = await fetch(`${base}/about`);
		expect(res.headers.get("content-type")).toContain("text/html");
		expect((await res.text()).trim()).toBe("<p>Kire</p>");
	});

	test("wire() returns null for non-wire routes", async () => {
		const kire = kireBun({ views });
		const res = await kire.wire(new Request("http://x/anything"));
		expect(res).toBeNull();
	});
});
