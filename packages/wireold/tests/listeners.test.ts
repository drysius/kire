import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

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
	const originalFetch = global.fetch;
    let kire: Kire;

	afterEach(async () => {
		global.fetch = originalFetch;
		try {
			await GlobalRegistrator.unregister();
		} catch {}
	});

	beforeEach(async () => {
		try {
			await GlobalRegistrator.unregister();
		} catch {}
		await GlobalRegistrator.register();

		kire = new Kire({ silent: true });
		kire.plugin(wirePlugin, { secret: "test" });
		kire.wireRegister("cart", Cart);
		kire.wireRegister("empty", EmptyComponent);

		document.body.innerHTML = "";

		window.fetch = mock(async (url, opts) => {
			const body = JSON.parse(opts.body);
			const token = kire.wireKeystore("");
            const res = await kire.wireRequest({
                path: "/_wire",
                method: "POST",
                body,
                locals: { wireToken: token }
            });
			return {
				ok: true,
				json: async () => res.body,
			};
		}) as any;
	});

	test("should render hidden placeholder for empty component", async () => {
		const token = kire.wireKeystore("");
		const res: any = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: { component: "empty" },
            locals: { wireToken: token }
        });

		const html = res.body.components[0].effects.html;
		expect(html).toContain('style="display: none;"');
		expect(html).toContain("wire:id");
	});
});
