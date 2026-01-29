import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { Kire } from "kire";
import { WireComponent, Wired } from "../src";
import { getClientScript } from "../src/utils/client-script";

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

		const kire = new Kire({ silent: true });
		kire.plugin(Wired.plugin, { secret: "test" });
		Wired.register("cart", Cart);
		Wired.register("empty", EmptyComponent);

		// Reset DOM
		document.body.innerHTML = "";

		window.fetch = mock(async (url, opts) => {
			const body = JSON.parse(opts.body);
			const key = Wired.keystore("");
			const res = await Wired.payload(key, body);
			return {
				ok: true,
				json: async () => res.data,
			};
		}) as any;
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
		expect(html).toContain("wire:id");
	});
});
