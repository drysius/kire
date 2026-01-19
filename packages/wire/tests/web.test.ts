import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { getClientScript } from "../src/utils/client-script";

describe("KireWire Advanced Client Features", () => {
	let window: any;
	let document: any;
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

	beforeEach(() => {
		window = new Window();
		document = window.document;

		window.fetch = mock(() =>
			Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						components: [
							{
								snapshot: JSON.stringify({ memo: { id: "c1" } }),
								effects: { html: "<div>Updated</div>" },
						},
						],
					}),
			})
		);

		window.confirm = mock(() => true);

		global.window = window;
		global.document = document;
		global.fetch = window.fetch;
		global.CustomEvent = window.CustomEvent;
		global.Event = window.Event;
		global.KeyboardEvent = window.KeyboardEvent;
		global.HTMLElement = window.HTMLElement;
		global.HTMLInputElement = window.HTMLInputElement;
		global.setTimeout = window.setTimeout;
		global.clearTimeout = window.clearTimeout;
		global.setInterval = window.setInterval;
		global.clearInterval = window.clearInterval;
		global.MutationObserver = window.MutationObserver;
		global.confirm = window.confirm;
	});

	const runScript = () => {
		const scriptContent = getClientScript({ endpoint: "/_wire" }, false);
		const matches = scriptContent.matchAll(/<script>([\s\S]*?)<\/script>/g);
		let rawJs = "";
		for (const match of matches) {
			rawJs += `${match[1]};\n`;
		}
		const fn = new Function(rawJs);
		fn();
	};

	test("wire:poll should trigger periodic refreshes", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <div wire:poll="50ms">Polling content</div>
            </div>
        `;

		// Wait for poll
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(window.fetch).toHaveBeenCalled();
		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.method).toBe("$refresh");
        
        document.body.innerHTML = "";
        await new Promise((resolve) => setTimeout(resolve, 60));
	});

	test("wire:model.lazy should only sync on change", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <input wire:model.lazy="name">
            </div>
        `;
		const input = document.querySelector("input");

        // Wait for initialization
        await new Promise((resolve) => setTimeout(resolve, 10));
        window.fetch.mockClear();

		// 1. Trigger input
		input.dispatchEvent(new window.Event("input", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(window.fetch).not.toHaveBeenCalled();

		// 2. Trigger change
		input.value = "lazy-john";
		input.dispatchEvent(new window.Event("change", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 10)); // tiny wait

		expect(window.fetch).toHaveBeenCalled();
		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.params).toEqual(["name", "lazy-john"]);

        document.body.innerHTML = "";
        await new Promise((resolve) => setTimeout(resolve, 50));
	});

	test("should handle nested parameters in events", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <button wire:click="remove(1, 'tags', true, null)">Delete</button>
            </div>
        `;

		document.querySelector("button").click();
		await new Promise(process.nextTick);

		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.method).toBe("remove");
		expect(body.params).toEqual([1, "tags", true, null]);
	});

	test("wire:confirm should block actions if cancelled", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <button wire:click="delete" wire:confirm="Are you sure?">Delete</button>
            </div>
        `;

		window.confirm = mock(() => false);
		global.confirm = window.confirm;
		document.querySelector("button").click();
		expect(window.fetch).not.toHaveBeenCalled();

		window.confirm = mock(() => true);
		global.confirm = window.confirm;
		document.querySelector("button").click();
		expect(window.fetch).toHaveBeenCalled();
	});

	test("wire:navigate should dispatch kirewire:navigate event", async () => {
		runScript();
		document.body.innerHTML = `
            <a href="/target" wire:navigate>Link</a>
        `;

		let navUrl = "";
		window.addEventListener("kirewire:navigate", (e: any) => {
			navUrl = e.detail.url;
		});

		document.querySelector("a").click();
		expect(navUrl).toBe("/target");
	});

	test("wire:init should trigger action on load", async () => {
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp" wire:init="loadData">
            </div>
        `;
		runScript();

		// Wait for observer
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(window.fetch).toHaveBeenCalled();
		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.method).toBe("loadData");
	});

    test("wire:click should trigger action", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <button wire:click="increment">Click Me</button>
            </div>
        `;
		document.querySelector("button").click();
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(window.fetch).toHaveBeenCalled();
		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.method).toBe("increment");
	});

	test("wire:submit should trigger action on form submission", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <form wire:submit.prevent="save">
                    <button type="submit">Save</button>
                </form>
            </div>
        `;
		const form = document.querySelector("form");
		form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
		
        await new Promise((resolve) => setTimeout(resolve, 50));
		expect(window.fetch).toHaveBeenCalled();
		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.method).toBe("save");
	});

	test("wire:keydown.enter should trigger action", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <input wire:keydown.enter="search">
            </div>
        `;
		const input = document.querySelector("input");
		const event = new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true });
		input.dispatchEvent(event);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(window.fetch).toHaveBeenCalled();
		const body = JSON.parse(window.fetch.mock.calls[0][1].body);
		expect(body.method).toBe("search");
	});



    test("wire:loading.attr should toggle attribute", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <button wire:click="save" wire:loading.attr="disabled">Save</button>
            </div>
        `;
        
        let resolveFetch: Function;
        window.fetch = mock(() => new Promise(r => resolveFetch = r));
        global.fetch = window.fetch;

		const btn = document.querySelector("button");
		btn.click();
		await new Promise(process.nextTick);

		expect(btn.hasAttribute("disabled")).toBe(true);

        resolveFetch({ ok: true, json: () => Promise.resolve({ components: [] }) });
        await new Promise((resolve) => setTimeout(resolve, 50));
        
        expect(btn.hasAttribute("disabled")).toBe(false);
    });

    test("wire:target should scope loading", async () => {
		runScript();
		document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="{}" wire:component="comp">
                <button wire:click="save">Save</button>
                <button wire:click="delete">Delete</button>
                <div id="loader" wire:loading wire:target="save" style="display: none;">Saving...</div>
            </div>
        `;
        
        let resolveFetch: Function;
        window.fetch = mock(() => new Promise(r => resolveFetch = r));
        global.fetch = window.fetch;

        // Click Delete (should NOT trigger loader)
		const deleteBtn = document.querySelectorAll("button")[1];
		deleteBtn.click();
		await new Promise(process.nextTick);
        
        const loader = document.getElementById("loader");
        expect(loader.style.display).toBe("none");
        
        resolveFetch({ ok: true, json: () => Promise.resolve({ components: [] }) });
        await new Promise(r => setTimeout(r, 10));

        // Click Save (should trigger loader)
        window.fetch = mock(() => new Promise(r => resolveFetch = r));
        const saveBtn = document.querySelectorAll("button")[0];
        saveBtn.click();
        await new Promise(process.nextTick);
        
        expect(loader.style.display).not.toBe("none");
    });
});