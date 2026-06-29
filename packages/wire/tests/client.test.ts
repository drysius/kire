import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "../../../core/src/kire";
import { LiveComponent } from "../src/component";
import { Kirewire } from "../src/kirewire";
import { Component, prop } from "../src/decorators";
import { kirewirePlugin } from "../src/kire/plugin";
import { WireRuntime } from "../src/client/runtime";
import { createDefaultDirectives } from "../src/client/directives";
import type { Transport, UpdateRequest } from "../src/contracts";

@Component("counter")
class Counter extends LiveComponent {
	@prop count = 0;
	@prop label = "";
	increment() {
		this.count++;
	}
	render() {
		return (
			`<div class="counter">` +
			`<span class="n">${this.count}</span>` +
			`<em class="l">${this.label}</em>` +
			`<button wire:click="increment">+</button>` +
			`<input wire:model.live="label">` +
			`</div>`
		);
	}
}

/** A transport that calls the real server in-process (no network). */
function inProcessTransport(server: Kirewire): Transport {
	return { send: (req: UpdateRequest) => server.handle(req) };
}

async function ssrHtml(): Promise<{ html: string; server: Kirewire }> {
	const kire = new Kire({ production: true });
	const server = new Kirewire({ secret: "client-secret" });
	server.component(Counter);
	kire.plugin(kirewirePlugin(server));
	const html = (await kire.render(`@wire("counter")`)) as string;
	return { html, server };
}

function installDom(html: string): void {
	const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
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

describe("client end-to-end (JSDOM)", () => {
	let server: Kirewire;

	beforeEach(async () => {
		const ssr = await ssrHtml();
		server = ssr.server;
		installDom(ssr.html);
	});

	test("mounts a component discovered in the DOM", () => {
		const runtime = new WireRuntime({
			transport: inProcessTransport(server),
			directives: createDefaultDirectives(),
		});
		runtime.start();
		expect(runtime.components.size).toBe(1);
		const comp = [...runtime.components.values()][0]!;
		expect(comp.name).toBe("counter");
		expect(comp.get("count")).toBe(0);
	});

	test("wire:click fires an action and morphs the new count in", async () => {
		const runtime = new WireRuntime({
			transport: inProcessTransport(server),
			directives: createDefaultDirectives(),
		});
		runtime.start();

		const button = document.querySelector("button")!;
		button.dispatchEvent(new window.Event("click", { bubbles: true }));
		await tick();

		expect(document.querySelector(".n")!.textContent).toBe("1");
		const comp = [...runtime.components.values()][0]!;
		expect(comp.get("count")).toBe(1);
	});

	test("wire:model.live binds input -> server -> DOM", async () => {
		const runtime = new WireRuntime({
			transport: inProcessTransport(server),
			directives: createDefaultDirectives(),
		});
		runtime.start();

		const input = document.querySelector("input")! as HTMLInputElement;
		input.value = "hello";
		input.dispatchEvent(new window.Event("input", { bubbles: true }));
		await tick();

		const comp = [...runtime.components.values()][0]!;
		expect(comp.get("label")).toBe("hello");
		expect(document.querySelector(".l")!.textContent).toBe("hello");
	});

	test("two clicks batch state across round-trips", async () => {
		const runtime = new WireRuntime({
			transport: inProcessTransport(server),
			directives: createDefaultDirectives(),
		});
		runtime.start();
		const button = document.querySelector("button")!;
		button.dispatchEvent(new window.Event("click", { bubbles: true }));
		await tick();
		button.dispatchEvent(new window.Event("click", { bubbles: true }));
		await tick();
		expect(document.querySelector(".n")!.textContent).toBe("2");
	});
});
