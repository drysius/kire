import { describe, expect, it, beforeEach } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

class TestCounter extends WireComponent {
    count = 0;
    async mount(params: any) {
        if (params.initial) this.count = params.initial;
    }
    increment() {
        this.count++;
        this.emit('counter-incremented', { value: this.count });
    }
    async render() {
        return `<div>Count: ${this.count}</div>`;
    }
}

describe("Wire Lifecycle Integration", () => {
    let kire: Kire;

    beforeEach(() => {
        kire = new Kire({ silent: true });
        kire.plugin(wirePlugin, { secret: 'test-secret' });
        kire.wireRegister('counter', TestCounter);
    });

    it("should handle initial mount with properties", async () => {
        const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "counter",
                updates: { initial: 10 }
            }
        });

        expect(res.status).toBe(200);
        const comp = res.body.components[0];
        expect(comp.effects.html).toContain("Count: 10");
        
        const snap = JSON.parse(comp.snapshot);
        expect(snap.data.count).toBe(10);
    });

    it("should handle method execution and queue emits for polling", async () => {
        // 1. Get initial snapshot
        const initial = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: { component: "counter" }
        });
        const snapStr = initial.body.components[0].snapshot;
        const compId = JSON.parse(snapStr).memo.id;

        // 2. Call increment
        const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                snapshot: snapStr,
                method: "increment"
            }
        });

        expect(res.status).toBe(200);
        expect(res.body.components[0].effects.html).toContain("Count: 1");
        
        // 3. Test Polling for the emit
        const pollRes = await kire.wireRequest({
            path: "/_wire/sync",
            method: "POST",
            body: { id: compId }
        });

        expect(pollRes.status).toBe(200);
        expect(pollRes.body.emits.length).toBe(1);
        expect(pollRes.body.emits[0].event).toBe('counter-incremented');
        expect(pollRes.body.emits[0].params[0].value).toBe(1);
    });

    it("should fail on invalid checksum", async () => {
        const initial = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: { component: "counter" }
        });
        const snap = JSON.parse(initial.body.components[0].snapshot);
        
        // Tamper
        snap.data.count = 999;
        
        const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                snapshot: JSON.stringify(snap),
                method: "increment"
            }
        });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Invalid snapshot checksum");
    });
});
