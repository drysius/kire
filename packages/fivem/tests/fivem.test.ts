import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Kirewire } from "@kirejs/wire";
import { kireFivem } from "../src/index";

const views = join(tmpdir(), `kire-fivem-${Date.now()}`);

beforeAll(() => {
	mkdirSync(views, { recursive: true });
	writeFileSync(join(views, "page.kire"), "<h1>{{ title }}</h1>");
});
afterAll(() => rmSync(views, { recursive: true, force: true }));

describe("@kirejs/fivem", () => {
	test("renders a NUI view and exposes the update handler", async () => {
		const wire = new Kirewire({ secret: "fivem-secret" });
		const fivem = kireFivem({ views, wire: { instance: wire } });

		expect((await fivem.render("page", { title: "NUI" })).trim()).toBe(
			"<h1>NUI</h1>",
		);
		expect(typeof fivem.handler).toBe("function");
		expect(fivem.path).toBe("_wire");
	});

	test("handler runs the Kirewire pipeline and calls back with a response", async () => {
		const wire = new Kirewire({ secret: "fivem-secret" });
		const fivem = kireFivem({ views, wire: { instance: wire } });

		const response = await new Promise<Record<string, unknown>>((resolve) => {
			fivem.handler({ components: [] }, (r) =>
				resolve(r as Record<string, unknown>),
			);
		});
		expect(Array.isArray(response.components)).toBe(true);
	});

	test("broadcaster wraps SendNuiMessage", () => {
		const wire = new Kirewire({ secret: "fivem-secret" });
		const fivem = kireFivem({ views, wire: { instance: wire } });
		const sent: string[] = [];
		const b = fivem.broadcaster((json) => sent.push(json));
		b.publish({ event: "x", params: [] } as never);
		expect(sent.length).toBe(1);
		expect(sent[0]).toContain("kirewire:push");
	});
});
