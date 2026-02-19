import { describe, expect, it, beforeEach } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

class Simple extends WireComponent {
    async render() { return `<span>Hello</span>`; }
}

describe("Wired Fragments", () => {
    let kire: Kire;
    beforeEach(() => {
        kire = new Kire({ silent: true });
        kire.plugin(wirePlugin);
        kire.wireRegister("simple", Simple);
    });

    it("should return wrapped html in effects", async () => {
        const res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: { component: "simple" }
        });

        const html = res.body.components[0].effects.html;
        expect(html).toContain("<div");
        expect(html).toContain("wire:id");
        expect(html).toContain("<span>Hello</span>");
    });
});
