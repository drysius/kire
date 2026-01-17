import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import { Window } from "happy-dom";
import { KireWireClient } from "../src/client/client";

// Mock fetch
const globalFetch = global.fetch;
let lastRequest: any = null;

describe("Polling State Sync", () => {
    let window: Window;
    let document: Document;
    let client: KireWireClient;

    beforeEach(() => {
        window = new Window({ url: "http://localhost:3000" });
        document = window.document;
        (global as any).window = window;
        (global as any).document = document;
        (global as any).DOMParser = window.DOMParser;
        (global as any).MutationObserver = class {
            observe() {}
            disconnect() {}
            takeRecords() { return []; }
        };

        // Patch all DOM types
        Object.getOwnPropertyNames(window).forEach(key => {
            if (key.startsWith('HTML') || key.endsWith('Element') || key === 'Node' || key === 'Document' || key === 'Comment') {
                (global as any)[key] = (window as any)[key];
            }
        });
        
        // Mock fetch globally
        global.fetch = mock(async (url: string | Request | URL, options: any) => {
             // Handle different fetch signatures if needed, but for now assumption is string + options
            const body = options.body ? JSON.parse(options.body) : {};
            lastRequest = body;
            
            const updates = body.updates || {};
            const name = updates.username || "Guest";
            
            const html = `
                <div wire:id="test-id" wire:snapshot="{}" wire:component="chat">
                    <input wire:model="username" value="${name}" />
                    <span wire:poll.100ms>${Date.now()}</span>
                </div>
            `;
            
            return {
                ok: true,
                json: async () => ({
                    components: [{
                        snapshot: JSON.stringify({ memo: { id: "test-id" }, data: { username: name } }),
                        effects: { html }
                    }]
                })
            };
        }) as any;

        // Initialize client with absolute URL
        client = new KireWireClient({ endpoint: "http://localhost:3000/_wire" });
    });

    afterEach(() => {
        global.fetch = globalFetch;
        lastRequest = null;
    });

    it("should send current input value with poll request", async () => {
        document.body.innerHTML = `
            <div wire:id="test-id" wire:snapshot="{}" wire:component="chat">
                <input wire:model="username" value="Guest" />
                <span wire:poll.100ms>Time</span>
            </div>
        `;

        // Initialize components manually (since observer is async)
        (client as any).initComponents();
        (client as any).initPolls();

        // 1. User types "MyName"
        const input = document.querySelector("input")!;
        input.value = "MyName";
        input.dispatchEvent(new window.Event("input")); // Trigger input event to update internal state/dirty check? 
        // Note: KireWire collects state from DOM at request time, so simple value change is enough usually.

        // 2. Poll triggers (simulate timer)
        // Access the interval callback? or just call .call manually mimicking the poll logic
        // We can check if 'updates' are collected.
        
        await client.call("test-id", "{}", "chat", "$refresh", []);

        // 3. Verify Request contains updates
        expect(lastRequest).toBeTruthy();
        expect(lastRequest.updates).toEqual({ username: "MyName" });
        
        // 4. Verify DOM is updated (morph) but value is preserved (because server echoed it)
        const newInput = document.querySelector("input")!;
        expect(newInput.value).toBe("MyName");
    });

    it("should preserve input value if server returns old state (simulation of bug)", async () => {
        // Force server to ignore updates to simulate the "bug" where server state wins
        global.fetch = mock(async () => {
            const html = `
                <div wire:id="test-id" wire:snapshot="{}" wire:component="chat">
                    <input wire:model="username" value="Guest" /> <!-- Old State -->
                    <span wire:poll.100ms>${Date.now()}</span>
                </div>
            `;
            return {
                ok: true,
                json: async () => ({
                    components: [{
                        snapshot: JSON.stringify({ memo: { id: "test-id" }, data: { username: "Guest" } }),
                        effects: { html }
                    }]
                })
            };
        }) as any;

        document.body.innerHTML = `
            <div wire:id="test-id" wire:snapshot="{}" wire:component="chat">
                <input wire:model="username" value="Guest" />
                <span wire:poll.100ms>Time</span>
            </div>
        `;
        (client as any).initComponents();

        const input = document.querySelector("input")!;
        input.value = "MyName"; // User typed
        
        // Poll happens
        await client.call("test-id", "{}", "chat", "$refresh", []);
        
        // If our preservation logic works, the input should still be "MyName" 
        // even though server returned "Guest".
        // HOWEVER, since the element is NOT focused (we didn't focus it), 
        // standard behavior might be to overwrite it.
        // But the user complained about this scenario ("sair dele e ir pro texto ele muda").
        
        const newInput = document.querySelector("input")!;
        
        // We want strict preservation for dirty inputs?
        // Current logic in dom.ts only preserves if toEl has NO value attribute.
        // But server DOES send value attribute.
        // So currently this test should FAIL (it will revert to Guest).
        
        expect(newInput.value).toBe("MyName");
    });
});
