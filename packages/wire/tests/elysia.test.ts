import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { Kire } from "kire";
import { Wired, WireComponent } from "../src";

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
		// Use specific secret to avoid conflicts if Wired is shared/reset
		kire.plugin(Wired.plugin, { secret: "elysia-secret" });
		Wired.register("counter", Counter);

		app = new Elysia();
        
        // Manual adapter setup for test
        app.post(Wired.options.route, async (context) => {
            if (Wired.validate(context.body)) {
                // Mock secure key for test
                const key = Wired.keystore("test-user");
                const result = await Wired.payload(key, context.body as any);
                context.set.status = result.code;
                return result.data;
            } else {
                context.set.status = 400;
                return Wired.invalid;
            }
        });

		server = app.listen(0);
		wireUrl = `http://localhost:${server.server?.port}/_wired`;
	});

	afterAll(() => {
		server.stop();
	});

	test("should handle wire request via Elysia adapter", async () => {
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
        
        const key = Wired.keystore("test-user");
		const checksum = Wired.checksum.generate(data, memo, key);
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
		expect(comp.effects.html).toBe(`<div wire:id="test-id" wire:snapshot="${comp.snapshot.replace(/"/g, '&quot;')}" wire:component="counter" x-data="kirewire"><div>Count: 6</div></div>`);

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