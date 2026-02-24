import { describe, expect, test, beforeEach } from "bun:test";
import { Kire } from "kire";
import { wirePlugin, Component, processWireAction, type WirePayload } from "../src/index";

class Counter extends Component {
    public count = 0;
    public increment() { this.count++; }
    public render() { return `<div>${this.count}</div>`; }
}

describe("Wire Core", () => {
    let kire: Kire;

    beforeEach(() => {
        kire = new Kire();
        kire.plugin(wirePlugin, { secret: "test-secret" });
        kire.wireRegister("counter", Counter);
    });

    test("should render initial component", async () => {
        const html = await kire.render('<wire:counter count="10" />');
        expect(html).toContain('wire:component="counter"');
        expect(html).toContain('wire:state="{&quot;count&quot;:10}"');
        expect(html).toContain('<div>10</div>');
    });

    test("should process increment action", async () => {
        // Mock initial state
        const state = { count: 5 };
        // Generate valid checksum for the mock state
        const checksum = kire["~wire"].checksum.generate(state, "");

        const payload: WirePayload = {
            id: "test-id",
            component: "counter",
            method: "increment",
            params: [],
            state,
            checksum
        };

        const result = await processWireAction(kire, payload);

        expect(result.state.count).toBe(6);
        expect(result.html).toContain('<div>6</div>');
        // New checksum should be generated
        expect(result.checksum).not.toBe(checksum);
    });

    test("should reject invalid checksum", async () => {
        const payload: WirePayload = {
            id: "test-id",
            component: "counter",
            method: "increment",
            state: { count: 999 },
            checksum: "invalid-checksum"
        };

        expect(processWireAction(kire, payload)).rejects.toThrow("checksum");
    });

    test("should support adapter option in plugin state", async () => {
        const k = new Kire();
        k.plugin(wirePlugin, { secret: "test-secret", adapter: "socket" });
        expect(k.$wire.adapter).toBe("socket");
    });

    test("@kirewire should expose frontend config with adapter", async () => {
        const k = new Kire();
        k.plugin(wirePlugin, { secret: "test-secret", adapter: "socket", route: "/_wirex", bus_delay: 75 });
        const html = await k.render("@kirewire");
        expect(html).toContain("__WIRE_INITIAL_CONFIG__");
        expect(html).toContain('"adapter":"socket"');
        expect(html).toContain('"endpoint":"/_wirex"');
    });
});
