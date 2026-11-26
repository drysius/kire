import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "../../../core/src/kire";
import { createDefaultDirectives } from "../src/client/directives";
import { WireRuntime } from "../src/client/runtime";
import { LiveComponent } from "../src/component";
import type { Transport, UpdateRequest } from "../src/contracts";
import { Component, prop } from "../src/decorators";
import { kirewirePlugin } from "../src/kire/plugin";
import { Kirewire } from "../src/kirewire";

@Component("form")
class Form extends LiveComponent {
	@prop name = "";
	@prop email = "";
	save() {
		/* commits pending updates */
	}
	render() {
		return (
			`<div class="form">` +
			`<input class="name" wire:model="name">` +
			`<input class="email" wire:model="email">` +
			`<span class="dirty-any" wire:dirty>unsaved</span>` +
			`<span class="dirty-name" wire:dirty wire:target="name">name changed</span>` +
			`<b class="dirty-cls" wire:dirty.class="is-dirty" wire:target="email"></b>` +
			`<span class="offline" wire:offline>offline</span>` +
			`<button wire:click="save">Save</button>` +
			`</div>`
		);
	}
}

function inProcessTransport(server: Kirewire): Transport {
	return { send: (req: UpdateRequest) => server.handle(req) };
}

async function ssrHtml(): Promise<{ html: string; server: Kirewire }> {
	const kire = new Kire({ production: true });
	const server = new Kirewire({ secret: "client-secret" });
	server.component(Form);
	kire.plugin(kirewirePlugin(server));
	const html = (await kire.render(`@wire("form")`)) as string;
	return { html, server };
}

function installDom(html: string): JSDOM {
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
		"navigator",
	]) {
		(globalThis as Record<string, unknown>)[key] = w[key];
	}
	return dom;
}

const tick = () => new Promise((r) => setTimeout(r, 25));
const disp = (el: Element) => (el as HTMLElement).style.display;

describe("wire:dirty / wire:target / wire:offline (JSDOM)", () => {
	let server: Kirewire;

	beforeEach(async () => {
		const ssr = await ssrHtml();
		server = ssr.server;
		installDom(ssr.html);
	});

	const boot = () => {
		const runtime = new WireRuntime({
			transport: inProcessTransport(server),
			directives: createDefaultDirectives(),
		});
		runtime.start();
		return runtime;
	};

	test("wire:dirty hides until a change, shows while dirty", async () => {
		boot();
		expect(disp(document.querySelector(".dirty-any")!)).toBe("none");

		const name = document.querySelector(".name")! as HTMLInputElement;
		name.value = "Ana";
		name.dispatchEvent(new window.Event("input", { bubbles: true }));
		await tick();

		expect(disp(document.querySelector(".dirty-any")!)).not.toBe("none");
	});

	test("wire:target scopes dirtiness to a property", async () => {
		boot();
		const email = document.querySelector(".email")! as HTMLInputElement;
		email.value = "a@b.c";
		email.dispatchEvent(new window.Event("input", { bubbles: true }));
		await tick();

		// Only the email-targeted indicator reacts; the name-targeted one stays hidden.
		expect(disp(document.querySelector(".dirty-name")!)).toBe("none");
		expect(document.querySelector(".dirty-cls")!.classList.contains("is-dirty")).toBe(true);
	});

	test("wire:offline reflects navigator.onLine via online/offline events", async () => {
		boot();
		const el = document.querySelector(".offline")!;
		// JSDOM defaults navigator.onLine to true → hidden.
		expect(disp(el)).toBe("none");

		Object.defineProperty(window.navigator, "onLine", {
			value: false,
			configurable: true,
		});
		window.dispatchEvent(new window.Event("offline"));
		expect(disp(el)).not.toBe("none");

		Object.defineProperty(window.navigator, "onLine", {
			value: true,
			configurable: true,
		});
		window.dispatchEvent(new window.Event("online"));
		expect(disp(el)).toBe("none");
	});
});
