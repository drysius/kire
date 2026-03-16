import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { KirewireClient } from "../web/kirewire";
import { morphDom, resolveMorphKey } from "../web/utils/morph";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost/",
	pretendToBeVisual: true,
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).Element = dom.window.Element;
(global as any).Node = dom.window.Node;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).MutationObserver = dom.window.MutationObserver;

describe("wire morph utilities", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	test("resolveMorphKey prefers explicit wire and DOM identity attributes", () => {
		const row = document.createElement("div");
		row.setAttribute("wire:key", "row-1");
		expect(resolveMorphKey(row)).toBe("wire:key:row-1");

		const collection = document.createElement("div");
		collection.setAttribute("data-wire-collection-key", "item-7");
		expect(resolveMorphKey(collection)).toBe("data-wire-collection-key:item-7");

		const root = document.createElement("section");
		root.setAttribute("wire:id", "cmp-9");
		expect(resolveMorphKey(root)).toBe("wire:id:cmp-9");
	});

	test("resolveMorphKey derives stable keys for interactive wire elements", () => {
		const button = document.createElement("button");
		button.setAttribute("wire:click", "edit(14)");
		expect(resolveMorphKey(button)).toBe(
			"wire:click:edit(14)|target:|tag:button",
		);

		const link = document.createElement("a");
		link.setAttribute("wire:navigate", "");
		link.setAttribute("href", "/accounts");
		expect(resolveMorphKey(link)).toBe("wire:navigate:/accounts");
	});

	test("morphDom passes stable key options to Alpine.morph", () => {
		const calls: any[] = [];
		(window as any).Alpine = {
			morph(from: HTMLElement, to: HTMLElement, options: any) {
				calls.push({ from, to, options });
				from.replaceWith(to);
			},
		};

		const from = document.createElement("div");
		from.innerHTML = '<button wire:click="create">Add</button>';
		const to = document.createElement("div");
		to.innerHTML = '<button wire:click="create">Add</button>';
		document.body.appendChild(from);

		morphDom(from, to);

		expect(calls).toHaveLength(1);
		expect(typeof calls[0]!.options?.key).toBe("function");
		expect(calls[0]!.options?.lookahead).toBe(true);
		expect(calls[0]!.options.key(to.firstElementChild)).toBe(
			"wire:click:create|target:|tag:button",
		);
	});

	test("cleanupTree clears wire init markers so reused nodes can be rebound", () => {
		const wire = new KirewireClient();
		document.body.innerHTML = `
            <div wire:id="cmp-1">
                <button id="action" wire:click="save">Save</button>
            </div>
        `;

		const button = document.getElementById("action") as HTMLElement;
		(button as any)._kirewire_init = true;

		wire.cleanupTree(document.body);

		expect((button as any)._kirewire_init).toBeUndefined();
	});
});
