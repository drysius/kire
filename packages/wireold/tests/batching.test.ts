import { describe, expect, it, beforeEach } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

class Counter extends WireComponent {
    count = 0;
    increment() { this.count++; }
    async render() { return `<div>${this.count}</div>`; }
}

describe("Wired Batching", () => {
    let kire: Kire;
    beforeEach(() => {
        kire = new Kire({ silent: true });
        kire.plugin(wirePlugin, { secret: "test" });
        kire.wireRegister("counter", Counter);
    });

    it("should handle multiple components in a single request", async () => {
        const payload = {
            components: [
                { component: "counter", method: "increment", params: [] },
                { component: "counter", method: "increment", params: [] },
                { component: "counter", method: "increment", params: [] }
            ]
        };

        const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: payload
        });

        expect(res.status).toBe(200);
        expect(res.body.components.length).toBe(3);
        
        // Each starts from 0 in this payload because no snapshot is provided
        expect(JSON.parse(res.body.components[0].snapshot).data.count).toBe(1);
        expect(JSON.parse(res.body.components[1].snapshot).data.count).toBe(1);
    });
});
