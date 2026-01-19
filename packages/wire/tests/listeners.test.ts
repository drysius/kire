import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { WireComponent, Wired } from "../src";
import { getClientScript } from "../src/utils/client-script";
import { Kire } from "kire";

class Cart extends WireComponent {
    public items = 0;
    public listeners = { "cart-updated": "refreshCart" };

    async refreshCart(count: number) {
        this.items = count;
    }

    async render() {
        return `<div>Cart Items: ${this.items}</div>`;
    }
}

class EmptyComponent extends WireComponent {
    async render() {
        return ""; // Renders empty initially
    }
}

describe("Wire Listeners & Placeholders", () => {
    let window: any;
    let document: any;
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    beforeEach(() => {
        const kire = new Kire();
        kire.plugin(Wired.plugin, { secret: "test" });
        Wired.register("cart", Cart);
        Wired.register("empty", EmptyComponent);

        window = new Window();
        document = window.document;
        global.window = new Window();
        global.document = window.document;
        global.CustomEvent = window.CustomEvent;
        global.Event = window.Event;
        
        window.fetch = mock(async (url, opts) => {
            const body = JSON.parse(opts.body);
            const key = Wired.keystore("");
            const res = await Wired.payload(key, body);
            return {
                ok: true,
                json: async () => res.data
            };
        });
        global.fetch = window.fetch;
        
        global.MutationObserver = window.MutationObserver;
        global.HTMLElement = window.HTMLElement;
        global.setTimeout = window.setTimeout;
        global.clearTimeout = window.clearTimeout;
        global.setInterval = window.setInterval;
        global.clearInterval = window.clearInterval;
    });

    const runScript = () => {
        const scriptContent = getClientScript({ endpoint: "/_wired" }, false);
        const matches = scriptContent.matchAll(/<script>([\s\S]*?)<\/script>/g);
        for (const match of matches) {
            new Function(match[1])();
        }
    };

    test("should render hidden placeholder for empty component", async () => {
        const key = Wired.keystore("");
        const res: any = await Wired.payload(key, {
            component: "empty",
            snapshot: "",
        });

        const html = res.data.components[0].effects.html;
        expect(html).toContain('style="display: none;"');
        expect(html).toContain('wire:id');
    });
});