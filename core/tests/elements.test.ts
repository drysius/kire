import { describe, expect, it } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Elements System (Pattern-based)", () => {
	it("should handle element with wildcard pattern (test:*)", async () => {
		const kire = new Kire({ silent: true });

		kire.element({
			name: "test:*",
			onCall(ctx) {
				ctx.write(`$kire_response += 'Wildcard: ' + ${JSON.stringify(ctx.wildcard)};`);
			},
		});

		const result = await kire.render("<test:hello />");
		expect(result).toBe("Wildcard: hello");

		const result2 = await kire.render("<test:world />");
		expect(result2).toBe("Wildcard: world");
	});

	it("should handle element with wildcard pattern (x-*)", async () => {
		const kire = new Kire({ silent: true });
        kire.$files[kire.resolvePath("button")] = "<button>@yield('default')</button>";

		const template = "<x-button>Click Me</x-button>";
		const result = await kire.render(template);

		expect(result).toContain("<button>Click Me</button>");
	});

	it("should handle native kire:if element", async () => {
		const kire = new Kire({ silent: true });
		const template = `
            <kire:if cond="show">
                Visible
            </kire:if>
        `;

		expect((await kire.render(template, { show: true })).trim()).toBe("Visible");
		expect((await kire.render(template, { show: false })).trim()).toBe("");
	});

	it("should handle native kire:if/elseif/else elements", async () => {
		const kire = new Kire({ silent: true });
		const template = `
            <kire:if cond="val === 1">
                One
            </kire:if>
            <kire:elseif cond="val === 2">
                Two
            </kire:elseif>
            <kire:else>
                Other
            </kire:else>
        `;

		expect((await kire.render(template, { val: 1 })).trim()).toBe("One");
		expect((await kire.render(template, { val: 2 })).trim()).toBe("Two");
		expect((await kire.render(template, { val: 3 })).trim()).toBe("Other");
	});

	it("should handle native kire:for element", async () => {
		const kire = new Kire({ silent: true });
		const template = `
            <ul>
                <kire:for items="[1, 2, 3]" as="num">
                    <li>{{ num }}</li>
                </kire:for>
            </ul>
        `;

		const result = await kire.render(template);
		expect(result).toContain("<li>1</li>");
		expect(result).toContain("<li>2</li>");
		expect(result).toContain("<li>3</li>");
	});

	it("should handle attributes via attribute() helper", async () => {
		const kire = new Kire({ silent: true });

		kire.element({
			name: "my-custom",
			onCall(api) {
				const title = api.getAttribute("title");
				api.write(`$kire_response += 'Title: ' + ${title};`);
			},
		});

		const result = await kire.render("<my-custom title=\"'Hello'\" />");
		expect(result).toBe("Title: Hello");

		const result2 = await kire.render("<my-custom title=\"name\" />", {
			name: "Kire",
		});
		expect(result2).toBe("Title: Kire");
	});

	it("should handle x-* components with x-slot", async () => {
		const kire = new Kire({ silent: true });
        kire.$files[kire.resolvePath("card")] = `
                    <div class="card">
                        <div class="header">@yield('header')</div>
                        <div class="body">@yield('default')</div>
                    </div>
                `;

		const template = `
            <x-card>
                <x-slot name="header">My Header</x-slot>
                Main Content
            </x-card>
        `;

		const result = await kire.render(template);
		expect(result).toContain('<div class="header">My Header</div>');
		expect(result).toContain('<div class="body">Main Content</div>');
	});

	it("should handle dotted x-* component names (x-ui.list)", async () => {
		const kire = new Kire({ silent: true });
		kire.namespace("components", kire.$root + "/components");
		kire.$files[kire.resolvePath("components.ui.list")] = "<section>@yield('default')</section>";

		const template = `<x-ui.list>Item</x-ui.list>`;
		const result = await kire.render(template);
		expect(result).toContain("<section>Item</section>");
	});
});
