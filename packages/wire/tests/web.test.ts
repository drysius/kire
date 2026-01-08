import { describe, expect, test, mock, beforeEach } from "bun:test";
import { getClientScript } from "../src/web/client";
import { Window } from 'happy-dom';

describe("KireWire Advanced Client Features", () => {
    let window: any;
    let document: any;

    beforeEach(() => {
        window = new Window();
        document = window.document;
        
        window.fetch = mock(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ html: '<div>Updated</div>', snapshot: 'new-snap' })
        }));

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
        const scriptContent = getClientScript({ endpoint: '/_wire' }, false);
        const matches = scriptContent.matchAll(/<script>([\s\S]*?)<\/script>/g);
        let rawJs = "";
        for (const match of matches) {
            rawJs += match[1] + ";\n";
        }
        const fn = new Function(rawJs);
        fn();
    };

    test("wire:poll should trigger periodic refreshes", async () => {
        runScript();
        document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="s1" wire:component="comp">
                <div wire:poll="50ms">Polling content</div>
            </div>
        `;
        
        // Wait for poll
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(window.fetch).toHaveBeenCalled();
        const body = JSON.parse(window.fetch.mock.calls[0][1].body);
        expect(body.method).toBe('$refresh');
    });

    test("wire:model.lazy should only sync on change", async () => {
        runScript();
        document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="s1" wire:component="comp">
                <input wire:model.lazy="name">
            </div>
        `;
        const input = document.querySelector('input');
        
        // 1. Trigger input
        input.dispatchEvent(new window.Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(window.fetch).not.toHaveBeenCalled();

        // 2. Trigger change
        input.value = "lazy-john";
        input.dispatchEvent(new window.Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 10)); // tiny wait
        
        expect(window.fetch).toHaveBeenCalled();
        const body = JSON.parse(window.fetch.mock.calls[0][1].body);
        expect(body.params).toEqual(['name', 'lazy-john']);
    });

    test("wire:loading.class should add and remove classes", async () => {
        runScript();
        document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="s1" wire:component="comp">
                <button wire:click="save">Save</button>
                <div id="target" wire:loading.class="is-loading">Content</div>
            </div>
        `;
        
        let promiseResolver: Function;
        const fetchPromise = new Promise(r => promiseResolver = r);
        window.fetch = mock(() => fetchPromise);

        const btn = document.querySelector('button');
        const target = document.getElementById('target');

        btn.click();
        await new Promise(process.nextTick);

        expect(target.classList.contains('is-loading')).toBe(true);

        promiseResolver({ ok: true, json: () => Promise.resolve({}) });
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(target.classList.contains('is-loading')).toBe(false);
    });

    test("should handle nested parameters in events", async () => {
        runScript();
        document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="s1" wire:component="comp">
                <button wire:click="remove(1, 'tags', true, null)">Delete</button>
            </div>
        `;
        
        document.querySelector('button').click();
        await new Promise(process.nextTick);

        const body = JSON.parse(window.fetch.mock.calls[0][1].body);
        expect(body.method).toBe('remove');
        expect(body.params).toEqual([1, 'tags', true, null]);
    });

    test("should dispatch kirewire:error on network failure", async () => {
        runScript();
        document.body.innerHTML = `
            <div wire:id="c1" wire:snapshot="s1" wire:component="comp">
                <button wire:click="save">Save</button>
            </div>
        `;
        
        window.fetch = mock(() => Promise.resolve({ ok: false, status: 500 }));
        
        let errorCaught = false;
        window.addEventListener('kirewire:error', () => {
            errorCaught = true;
        });

        document.querySelector('button').click();
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(errorCaught).toBe(true);
    });
});
