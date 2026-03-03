import { expect, test, describe, beforeEach, spyOn } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "kire";
import { Kirewire, Component, HttpAdapter } from "../src/index";
import { KirewireClient } from "../web/kirewire";
import { MessageBus } from "../web/utils/message-bus";

// --- MOCK ENVIRONMENT ---
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: "http://localhost/"
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).navigator = dom.window.navigator;
(global as any).DOMParser = dom.window.DOMParser;
(global as any).CustomEvent = dom.window.CustomEvent;

// --- TEST COMPONENT ---
class CounterComponent extends Component {
    count = 0;
    async increment() { this.count++; }
    render() { return `Count: ${this.count}`; }
}

describe("Kirewire Full Integration (Client + Server)", () => {
    let kire: Kire;
    let serverWire: Kirewire;
    let adapter: HttpAdapter;
    let clientWire: KirewireClient;
    const SECRET = "test-secret";

    beforeEach(() => {
        // 1. Setup Server
        kire = new Kire();
        serverWire = new Kirewire({ secret: SECRET });
        serverWire.components.set('counter', CounterComponent as any);
        adapter = new HttpAdapter();
        adapter.install(serverWire, kire);

        // 2. Setup Client
        clientWire = new KirewireClient();
        clientWire.bus = new MessageBus(0); // No delay for tests
        clientWire.pageId = 'page-1';
        
        document.body.innerHTML = '';

        // 3. Bridge: Mock Fetch to call Server Adapter directly
        (global as any).fetch = async (url: string, opts: any) => {
            const body = JSON.parse(opts.body);
            const response = await adapter.handleRequest({
                method: 'POST',
                url: url,
                body: body
            }, 'user-1', 'session-1');

            return {
                ok: true,
                status: response.status,
                json: async () => response.result
            };
        };

        // Connect Bus to our Mock Fetch
        window.addEventListener('wire:bus:flush' as any, async (e: any) => {
            const { batch, finish } = e.detail;
            const res = await fetch('/_wire', { method: 'POST', body: JSON.stringify({ batch, pageId: 'page-1' }) });
            finish(await res.json());
        });
    });

    test("Full Cycle: Client increments counter on Server and patches DOM", async () => {
        const page = serverWire.sessions.getPage('user-1', 'page-1');
        const instance = new CounterComponent();
        instance.$id = 'c1';
        instance.$kire = kire;
        page.components.set('c1', instance);

        const state = { count: 0 };
        const checksum = serverWire.generateChecksum(state, 'session-1');
        
        document.body.innerHTML = `
            <div id="root" wire:id="c1" wire:state='${JSON.stringify(state)}' wire:checksum="${checksum}">
                Count: 0
            </div>
        `;
        const root = document.getElementById('root')!;

        await clientWire.call(root, 'increment');
        expect(instance.count).toBe(1);
    });

    test("Security: Server should reject tampered state", async () => {
        document.body.innerHTML = `
            <div id="root" wire:id="c1" wire:state='{"count": 999}' wire:checksum="WRONG"></div>
        `;
        const root = document.getElementById('root')!;

        try {
            await clientWire.call(root, 'increment');
        } catch (e: any) {
            expect(e.message).toBe("Invalid state checksum.");
        }
    });

    test("Side Effects: Redirect and Events", async () => {
        class EffectComponent extends Component {
            async doSomething() {
                this.$redirect('/home');
                this.$emit('notified', { ok: true });
            }
            render() { return ""; }
        }
        serverWire.components.set('effect-comp', EffectComponent as any);
        
        const page = serverWire.sessions.getPage('user-1', 'page-1');
        const instance = new EffectComponent();
        instance.$id = 'e1';
        page.components.set('e1', instance);

        const checksum = serverWire.generateChecksum({}, 'session-1');
        document.body.innerHTML = `<div id="root" wire:id="e1" wire:state='{}' wire:checksum="${checksum}"></div>`;

        const result = await clientWire.call(document.getElementById('root')!, 'doSomething');

        expect(result.effects.redirect).toBe('/home');
        expect(result.effects.events).toContainEqual({ name: 'notified', params: [{ ok: true }] });
    });

    test("Client Directives: wire:poll simulation", async () => {
        const fetchSpy = spyOn(global as any, "fetch");
        
        // Setup Component on Server
        const page = serverWire.sessions.getPage('user-1', 'page-1');
        const instance = new CounterComponent();
        instance.$id = 'c1';
        page.components.set('c1', instance);

        const checksum = serverWire.generateChecksum({count: 0}, 'session-1');
        document.body.innerHTML = `
            <div id="root" wire:id="c1" wire:state='{"count": 0}' wire:checksum="${checksum}" wire:poll="increment"></div>
        `;
        const root = document.getElementById('root')!;
        
        // Register mock poll directive
        clientWire.directive('poll', ({ el, expression, wire }) => {
            // Instant trigger for test
            wire.call(el, expression);
        });

        // Initialize directives on the element
        (clientWire as any).processWireAttributes(root);

        // Wait for microtasks
        await new Promise(r => setTimeout(r, 10));

        expect(fetchSpy).toHaveBeenCalled();
        const body = JSON.parse(fetchSpy.mock.calls[0]![1].body);
        expect(body.batch[0].method).toBe('increment');
    });

    test("State Persistence: Server updates state and client reflects it", async () => {
        const page = serverWire.sessions.getPage('user-1', 'page-1');
        const instance = new CounterComponent();
        instance.$id = 'c1';
        instance.count = 5;
        page.components.set('c1', instance);

        const state = { count: 5 };
        const checksum = serverWire.generateChecksum(state, 'session-1');
        document.body.innerHTML = `<div id="root" wire:id="c1" wire:state='${JSON.stringify(state)}' wire:checksum="${checksum}"></div>`;

        await clientWire.call(document.getElementById('root')!, 'increment');
        expect(instance.count).toBe(6);
    });
});
