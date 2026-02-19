import { beforeEach, describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

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
		kire = new Kire({ silent: true });
		kire.plugin(wirePlugin, { secret: "test-secret" });
	});

	test("should register and retrieve components", () => {
		kire.wireRegister("counter", Counter);
		const Retrieved = kire["~wire"].registry.get("counter");
		expect(Retrieved).toBe(Counter);
	});

	test("should handle initial request (render)", async () => {
		kire.wireRegister("counter", Counter);

		const data = { count: 5 };
		const memo: any = {
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

		const token = kire.wireKeystore(""); 
		const checksum = kire.$kire["~wire"].checksum.generate(data, memo, token);
		const snapshot = JSON.stringify({ data, memo, checksum });

		const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "counter",
                snapshot: snapshot,
                method: "increment",
                params: [],
            },
            locals: { wireToken: token }
        });

        const response = res.body;
		expect(response.error).toBeUndefined();
		expect(response.components).toBeDefined();
		expect(response.components[0].effects.html).toContain("Count: 6");

		const newSnap = JSON.parse(response.components[0].snapshot);
		expect(newSnap.data.count).toBe(6);
	});

	test("should fail with invalid snapshot format", async () => {
        kire.wireRegister("counter", Counter);
		const token = kire.wireKeystore("");
		const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "counter",
                snapshot: "invalid.json",
                method: "increment",
            },
            locals: { wireToken: token }
        });

        if (res.body.error !== "Invalid snapshot format") {
            console.log("DEBUG FAIL FORMAT:", res.status, JSON.stringify(res.body));
        }
		expect(res.body.error).toBe("Invalid snapshot format");
	});

	test("should fail with invalid snapshot checksum", async () => {
        kire.wireRegister("counter", Counter);
		const token = kire.wireKeystore("");
		const snapshot = JSON.stringify({ data: {}, memo: { name: 'counter' }, checksum: "wrong" });
		const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "counter",
                snapshot: snapshot,
                method: "increment",
            },
            locals: { wireToken: token }
        });

        if (res.body.error !== "Invalid snapshot checksum") {
            console.log("DEBUG FAIL CHECKSUM:", res.status, JSON.stringify(res.body));
        }
		expect(res.body.error).toBe("Invalid snapshot checksum");
	});

	test("should fail with unknown component", async () => {
		const token = kire.wireKeystore("");
		const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "unknown-component",
                snapshot: "",
            },
            locals: { wireToken: token }
        });

		expect(res.body.components[0].error).toContain("Component not found");
	});
});
