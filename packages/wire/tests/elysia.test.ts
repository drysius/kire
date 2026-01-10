import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { Kire } from "kire";
import { Kirewire, WireComponent, WireCore } from "../src";
import { Elysiawire } from "../src/server/adapters/elysia";

// --- Mock Component ---
class Counter extends WireComponent {
	public count = 0;

	async increment() {
		this.count++;
	}

	async render() {
		return `<div>Count: ${this.count}</div>`;
	}
}

describe("Elysia Wire Integration", () => {
	let app: Elysia;
	let server: any;
	let wireUrl: string;

	beforeAll(() => {
		const kire = new Kire();
		// Use specific secret to avoid conflicts if WireCore is shared/reset
		kire.plugin(Kirewire, { secret: "elysia-secret" });
		WireCore.get().registerComponent("counter", Counter);

		app = new Elysia();
		Elysiawire(app);
		server = app.listen(0);
		wireUrl = `http://localhost:${server.server?.port}/_kirewire`;
	});

	afterAll(() => {
		server.stop();
	});

	test("should handle wire request via Elysia adapter", async () => {
		const core = WireCore.get();
		const data = { count: 5 };
		const memo = {
			id: "test-id",
			name: "counter",
			path: "/",
			method: "GET",
			children: [],
			scripts: [],
			assets: [],
			errors: [],
			locale: "en",
		};
		const checksum = core.getChecksum().generate(data, memo);
		const snapshot = JSON.stringify({ data, memo, checksum });

		// 2. Client sends 'increment' action
		const payload = {
			component: "counter",
			snapshot: snapshot,
			method: "increment",
			params: [],
		};

		const req = new Request(wireUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
        const res = await app.handle(req);

		expect(res.status).toBe(200);

		const dataRes = (await res.json()) as any;
		const comp = dataRes.components[0];
		expect(comp.effects.html).toBe("<div>Count: 6</div>");

		// 4. Verify snapshot integrity
		const newSnap = JSON.parse(comp.snapshot);
		expect(newSnap.data.count).toBe(6);
	});

	test("should return 400 for invalid snapshot", async () => {
		const payload = {
			component: "counter",
			snapshot: "bad_snapshot",
			method: "increment",
		};

		const req = new Request(wireUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
        const res = await app.handle(req);

		expect(res.status).toBe(400);
		const data = (await res.json()) as any;
		expect(data.error).toBe("Invalid snapshot format");
	});

	test("should return 400 for unknown component", async () => {
		const payload = {
			component: "unknown-component",
			snapshot: "",
			method: "increment",
		};

		const req = new Request(wireUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
        const res = await app.handle(req);
		
		expect(res.status).toBe(400);
		const data = (await res.json()) as any;
		expect(data.error).toBe("Component not found");
	});
});
