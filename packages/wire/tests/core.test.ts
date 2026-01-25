import { beforeEach, describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, Wired } from "../src";

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

describe("Wired", () => {
	let kire: Kire;

	beforeEach(() => {
		kire = new Kire();
		kire.plugin(Wired.plugin, { secret: "test-secret" });
	});

	test("should register and retrieve components", () => {
		Wired.register("counter", Counter);
		const Retrieved = Wired.getComponentClass("counter");
		expect(Retrieved).toBe(Counter);
	});

	test("should handle initial request (render)", async () => {
		Wired.register("counter", Counter);

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

		const key = Wired.keystore(""); // No key for simple test
		const checksum = Wired.checksum.generate(data, memo, key);
		const snapshot = JSON.stringify({ data, memo, checksum });

		const response = (
			await Wired.payload(key, {
				component: "counter",
				snapshot: snapshot,
				method: "increment",
				params: [],
			})
		).data as any;

		expect(response.error).toBeUndefined();
		expect(response.components).toBeDefined();
		// Check HTML content inside the wrapper
		expect(response.components[0].effects.html).toContain("Count: 6");

		const newSnap = JSON.parse(response.components[0].snapshot);
		expect(newSnap.data.count).toBe(6);
	});

	test("should fail with invalid snapshot format", async () => {
		const key = Wired.keystore("");
		const response = (
			await Wired.payload(key, {
				component: "counter",
				snapshot: "invalid.json",
				method: "increment",
			})
		).data as any;

		expect(response.error).toBe("Invalid snapshot format");
	});

	test("should fail with invalid snapshot checksum", async () => {
		const key = Wired.keystore("");
		const snapshot = JSON.stringify({ data: {}, memo: {}, checksum: "wrong" });
		const response = (
			await Wired.payload(key, {
				component: "counter",
				snapshot: snapshot,
				method: "increment",
			})
		).data as any;

		expect(response.error).toBe("Invalid snapshot checksum");
	});

	test("should fail with unknown component", async () => {
		const key = Wired.keystore("");
		const response = (
			await Wired.payload(key, {
				component: "unknown-component",
				snapshot: "",
			})
		).data as any;

		expect(response.error).toBe("Component not found");
	});
});
