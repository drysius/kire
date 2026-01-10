import { afterAll, describe, expect, test } from "bun:test";
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
	// Setup Kire & Wire
	const kire = new Kire();
	kire.plugin(Kirewire);

	// Register Component
	WireCore.get().registerComponent("counter", Counter);

	// Setup Elysia App
	const app = new Elysia();

	// Mount Wire Adapter
	Elysiawire(app);

	// Start Server
	const server = app.listen(0); // Port 0 = random available port
	const port = server.server?.port;
	const baseUrl = `http://localhost:${port}`;
	const wireUrl = `${baseUrl}/_kirewire`;

	afterAll(() => {
		server.stop();
	});

	test("should handle wire request via Elysia adapter", async () => {
		// 1. Get Initial Snapshot (simulating initial SSR)
		// Since we can't easily SSR the directive without a full view setup in this test,
		// we'll manually create a valid snapshot using the core.
		const comp = new Counter();
		comp.count = 5;
		const initialSnapshot = WireCore.get()
			.getCrypto()
			.sign(comp.getPublicProperties());

		// 2. Client sends 'increment' action
		const payload = {
			component: "counter",
			snapshot: initialSnapshot,
			method: "increment",
			params: [],
		};

		const res = await fetch(wireUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		expect(res.status).toBe(200);

		const data = (await res.json()) as any;
		console.log(data);
		// 3. Verify Response
		expect(data.html).toBe("<div>Count: 6</div>");
		expect(data.updates).toEqual({ count: 6 });
		expect(data.snapshot).toBeDefined();

		// 4. Verify snapshot integrity
		const newState = WireCore.get().getCrypto().verify(data.snapshot);
		expect(newState.count).toBe(6);
	});

	test("should return 400 for invalid snapshot", async () => {
		const payload = {
			component: "counter",
			snapshot: "bad_snapshot",
			method: "increment",
		};

		const res = await fetch(wireUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		expect(res.status).toBe(400);
		const data = (await res.json()) as any;
		expect(data.error).toBe("Invalid snapshot signature");
	});

	test("should return 400 for unknown component", async () => {
		const payload = {
			component: "unknown-component",
			snapshot: "",
			method: "increment",
		};

		const res = await fetch(wireUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		console.log(await res.json());
		expect(res.status).toBe(400);
		const data = (await res.json()) as any;
		expect(data.error).toBe("Component not found");
	});
});
