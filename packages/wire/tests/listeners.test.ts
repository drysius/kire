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
        global.window = new Window();
        global.document = window.document;
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
        // Use happy-dom document provided in test context if possible, or create a temporary element
        // Since global.document is mocked with happy-dom, we can use it.
        const div = document.createElement("div");
        div.innerHTML = scriptContent;
        const scripts = div.querySelectorAll("script");
        
        for (const script of scripts) {
             if (script.textContent) {
                 new Function(script.textContent)();
             }
        }
    };



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
