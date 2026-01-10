import { beforeEach, describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, WireCore } from "../src";

// Mock component
class Counter extends WireComponent {
	public count = 0;

	async increment() {
		this.count++;
	}

	async render() {
		return `Count: ${this.count}`;
	}
}

describe("WireCore", () => {
	let kire: Kire;
	let core: WireCore;

	beforeEach(() => {
		kire = new Kire();
		core = WireCore.get();
		core.init(kire, { secret: "test-secret" });
	});

	test("should register and retrieve components", () => {
		core.registerComponent("counter", Counter);
		const Retrieved = core.getComponentClass("counter");
		expect(Retrieved).toBe(Counter);
	});

	test("should handle initial request (render)", async () => {
		core.registerComponent("counter", Counter);

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

		const response = (await core.handleRequest({
			component: "counter",
			snapshot: snapshot,
			method: "increment",
			params: [],
		})) as any;

		expect(response.error).toBeUndefined();
		expect(response.components).toBeDefined();
		expect(response.components[0].effects.html).toBe("Count: 6");

		const newSnap = JSON.parse(response.components[0].snapshot);
		expect(newSnap.data.count).toBe(6);
	});

	test("should fail with invalid snapshot format", async () => {
		const response = (await core.handleRequest({
			component: "counter",
			snapshot: "invalid.json",
			method: "increment",
		})) as any;

		expect(response.error).toBe("Invalid snapshot format");
	});

    test("should fail with invalid snapshot checksum", async () => {
        const snapshot = JSON.stringify({ data: {}, memo: {}, checksum: "wrong" });
		const response = (await core.handleRequest({
			component: "counter",
			snapshot: snapshot,
			method: "increment",
		})) as any;

		expect(response.error).toBe("Invalid snapshot checksum");
	});

	test("should fail with unknown component", async () => {
		const response = (await core.handleRequest({
			component: "unknown-component",
			snapshot: "",
		})) as any;

		expect(response.error).toBe("Component not found");
	});
});