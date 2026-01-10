import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { WireComponent, WireCore } from "../src";
import { getClientScript } from "../src/server/web/client";
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
    let core: WireCore;
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    beforeEach(() => {
        const kire = new Kire();
        core = WireCore.get();
        core.init(kire, { secret: "test" });
        core.registerComponent("cart", Cart);
        core.registerComponent("empty", EmptyComponent);

        window = new Window();
        document = window.document;
        global.window = window;
        global.document = document;
        global.CustomEvent = window.CustomEvent;
        global.Event = window.Event;
        
        window.fetch = mock(async (url, opts) => {
            const body = JSON.parse(opts.body);
            const res = await core.handleRequest(body);
            return {
                ok: true,
                json: async () => res
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
        const scriptContent = getClientScript({ endpoint: "/_wire" }, false);
        const matches = scriptContent.matchAll(/<script>([\s\S]*?)<\/script>/g);
        for (const match of matches) {
            new Function(match[1])();
        }
    };

    test("should register listeners and trigger update on event", async () => {
        const cart = new Cart();
        const memo = { id: "cart-1", name: "cart", path: "/", method: "GET", children: [], scripts: [], assets: [], errors: [], locale: "en", listeners: cart.listeners };
        const checksum = core.getChecksum().generate({ items: 0 }, memo);
        const initialSnap = JSON.stringify({
            data: { items: 0 },
            memo: memo,
            checksum: checksum
        }).replace(/"/g, '&quot;');

        document.body.innerHTML = `
            <div wire:id="cart-1" wire:snapshot="${initialSnap}" wire:component="cart">
                <div>Cart Items: 0</div>
            </div>
        `;

        runScript();
        await new Promise(r => setTimeout(r, 10));

        window.dispatchEvent(new CustomEvent("cart-updated", { detail: 5 }));
        
        await new Promise(r => setTimeout(r, 100));

        expect(window.fetch).toHaveBeenCalled();
        const body = JSON.parse(window.fetch.mock.calls[0][1].body);
        expect(body.method).toBe("refreshCart");
        expect(body.params).toEqual([5]);
        
        const res: any = await core.handleRequest(body);
        expect(res.components[0].effects.html).toContain("Cart Items: 5");
    });

    test("should render hidden placeholder for empty component", async () => {
        const res: any = await core.handleRequest({
            component: "empty",
            snapshot: "",
        });

        const html = res.components[0].effects.html;
        expect(html).toContain('style="display: none;"');
        expect(html).toContain('wire:id');
    });
});
