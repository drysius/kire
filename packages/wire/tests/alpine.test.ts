import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "../../../core/src/index";
import { start } from "../src/client/index";
import { LiveComponent } from "../src/component";
import type { Transport, UpdateRequest } from "../src/contracts";
import { Component, prop } from "../src/decorators";
import { kirewirePlugin } from "../src/kire/plugin";
import { Kirewire } from "../src/kirewire";

@Component("counter")
class Counter extends LiveComponent {
	@prop count = 0;
	increment() {
		this.count++;
	}
	render() {
		return (
			`<div class="counter">` +
			`<span class="n">${this.count}</span>` +
			`<button wire:click="increment">+</button>` +
			`</div>`
		);
	}
}

function inProcessTransport(server: Kirewire): Transport {
	return { send: (req: UpdateRequest) => server.handle(req) };
}

async function ssrHtml(): Promise<{ html: string; server: Kirewire }> {
	const kire = new Kire({ production: true });
	const server = new Kirewire({ secret: "alpine-secret" });
	server.component(Counter);
	kire.plugin(kirewirePlugin(server));
	const html = (await kire.render(`@wire("counter")`)) as string;
	return { html, server };
}

function installDom(html: string): void {
	const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, {
		url: "https://example.test/",
	});
	const w = dom.window as unknown as Record<string, unknown>;
	for (const key of [
		"window",
		"document",
		"Element",
		"HTMLElement",
		"HTMLInputElement",
		"HTMLTextAreaElement",
		"Event",
		"CustomEvent",
		"Node",
	]) {
		(globalThis as Record<string, unknown>)[key] = w[key];
	}
}

const tick = () => new Promise((r) => setTimeout(r, 25));

describe("Alpine.js integration", () => {
	let server: Kirewire;

	beforeEach(async () => {
		const ssr = await ssrHtml();
		server = ssr.server;
		installDom(ssr.html);
	});

	test("Alpine.initTree runs on the morphed subtree after an action", async () => {
		const initialized: Element[] = [];
		(window as unknown as { Alpine: unknown }).Alpine = {
			initTree: (el: Element) => initialized.push(el),
		};

		start({ transport: inProcessTransport(server), alpine: true });

		document
			.querySelector("button")!
			.dispatchEvent(new window.Event("click", { bubbles: true }));
		await tick();

		expect(document.querySelector(".n")!.textContent).toBe("1");
		// The morphed component element was handed to Alpine for re-initialization.
		expect(initialized.length).toBeGreaterThan(0);
		expect(initialized.some((el) => el.querySelector?.(".n"))).toBe(true);
	});

	test("no Alpine integration when disabled and no window.Alpine", async () => {
		const initialized: Element[] = [];
		(window as unknown as { Alpine?: unknown }).Alpine = undefined;
		start({ transport: inProcessTransport(server), alpine: false });

		document
			.querySelector("button")!
			.dispatchEvent(new window.Event("click", { bubbles: true }));
		await tick();
		expect(initialized.length).toBe(0);
	});
});
