import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../../src";
import { processRequest } from "../../src/core/process";

// Mock Component
class TestComponent extends WireComponent {
	public count = 0;
	public title = "Hello";

	async increment() {
		this.count++;
	}

	async render() {
		return `<div>${this.title}: ${this.count}</div>`;
	}
}

describe("Process Core Logic", () => {
    const kire = new Kire({ silent: true });
    kire.plugin(wirePlugin, { secret: 'test-secret' });
    kire.wireRegister('test', TestComponent);

	test("processRequest should handle initial mount", async () => {
        const body = { component: 'test', updates: { title: 'Mounted' } };
        const res = await processRequest(kire, body);
        
        expect(res.code).toBe(200);
        const comp = res.data.components[0];
        expect(comp.effects.html).toContain("Mounted: 0");
        
        const snap = JSON.parse(comp.snapshot);
        expect(snap.data.title).toBe('Mounted');
        expect(snap.checksum).toBeDefined();
	});

    test("processRequest should handle method calls with snapshot", async () => {
        // First get a snapshot
        const initial = await processRequest(kire, { component: 'test' });
        const snapshot = initial.data.components[0].snapshot;

        // Call increment
        const res = await processRequest(kire, {
            snapshot,
            method: 'increment',
            params: []
        });

        expect(res.code).toBe(200);
        const comp = res.data.components[0];
        expect(comp.effects.html).toContain("Hello: 1");
        
        const snap = JSON.parse(comp.snapshot);
        expect(snap.data.count).toBe(1);
    });

    test("processRequest should validate checksum", async () => {
        const initial = await processRequest(kire, { component: 'test' });
        const snap = JSON.parse(initial.data.components[0].snapshot);
        
        // Tamper with data
        snap.data.count = 999;
        const tamperedSnapshot = JSON.stringify(snap);

        const res = await processRequest(kire, {
            snapshot: tamperedSnapshot,
            method: 'increment'
        });

        expect(res.code).toBe(403); // Invalid checksum
    });

	test("processRequest should handle property updates", async () => {
        const initial = await processRequest(kire, { component: 'test' });
        const snapshot = initial.data.components[0].snapshot;

        const res = await processRequest(kire, {
            snapshot,
            updates: { count: 50, title: 'Updated' }
        });

        expect(res.code).toBe(200);
        const comp = res.data.components[0];
        expect(comp.effects.html).toContain("Updated: 50");
	});

    test("processRequest should fail for forbidden methods", async () => {
        const initial = await processRequest(kire, { component: 'test' });
        const snapshot = initial.data.components[0].snapshot;

        const res = await processRequest(kire, {
            snapshot,
            method: 'render'
        });

        expect(res.code).toBe(405);
    });
});
