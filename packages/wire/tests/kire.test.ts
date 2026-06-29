import { describe, expect, test } from "bun:test";
import { Kire } from "../../../core/src/kire";
import { LiveComponent } from "../src/component";
import { Kirewire } from "../src/kirewire";
import { Component, prop } from "../src/decorators";
import { kirewirePlugin } from "../src/kire/plugin";
import type { Snapshot } from "../src/contracts";

@Component("counter")
class Counter extends LiveComponent {
	@prop count = 0;
	increment() {
		this.count++;
	}
	render() {
		return `<div class="counter">${this.count}</div>`;
	}
}

function setup() {
	const kire = new Kire({ production: true });
	const wire = new Kirewire({ secret: "ssr-secret" });
	wire.component(Counter);
	kire.plugin(kirewirePlugin(wire, { scriptUrl: "/kirewire.js" }));
	return { kire, wire };
}

/** Pull the wire:snapshot JSON out of rendered SSR HTML. */
function extractSnapshot(html: string): Snapshot {
	const m = html.match(/wire:snapshot='([^']*)'/);
	if (!m) throw new Error("no wire:snapshot found");
	const json = m[1]!.replace(/&#39;/g, "'").replace(/&amp;/g, "&");
	return JSON.parse(json) as Snapshot;
}

describe("kire SSR integration", () => {
	test("@wire directive mounts and injects wire:* attributes into the root", async () => {
		const { kire } = setup();
		const html = (await kire.render(`<section>@wire("counter")</section>`)) as string;
		expect(html).toContain('wire:name="counter"');
		expect(html).toMatch(/wire:id="[0-9a-f-]{36}"/);
		expect(html).toContain("wire:snapshot='");
		// attributes injected into the component's own root <div>, not a wrapper
		expect(html).toContain('class="counter"');
		expect(html).toContain(">0</div>");
	});

	test("<wire:*> element mounts with attribute params", async () => {
		const { kire } = setup();
		const html = (await kire.render(`<wire:counter />`)) as string;
		expect(html).toContain('wire:name="counter"');
		expect(html).toContain(">0</div>");
	});

	test("embedded snapshot verifies and drives a follow-up update", async () => {
		const { kire, wire } = setup();
		const html = (await kire.render(`@wire("counter")`)) as string;
		const snapshot = extractSnapshot(html);

		const res = await wire.update({
			snapshot,
			updates: {},
			calls: [{ method: "increment", params: [] }],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.snapshot.data.count).toBe(1);
		expect(res.effects.html).toContain(">1</div>");
	});

	test("@kirewireScripts injects the runtime script tag", async () => {
		const { kire } = setup();
		const html = (await kire.render(`@kirewireScripts`)) as string;
		expect(html).toContain('<script src="/kirewire.js" defer></script>');
	});
});
