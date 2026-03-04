import { expect, test, describe, beforeEach, spyOn, afterEach } from "bun:test";
import { JSDOM } from "jsdom";

// Setup JSDOM environment before any imports
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: "http://localhost/",
    pretendToBeVisual: true
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).Node = dom.window.Node;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).Event = dom.window.Event;
(global as any).MutationObserver = dom.window.MutationObserver;
(global as any).DOMParser = dom.window.DOMParser;
(global as any).navigator = dom.window.navigator;
(global as any).ShadowRoot = dom.window.ShadowRoot;
(global as any).TextEncoder = TextEncoder;

// Import the client and bus
import { KirewireClient } from "../web/kirewire";
import { MessageBus } from "../web/utils/message-bus";

describe("Kirewire Client Unit Logic", () => {
    let wire: KirewireClient;
    let bus: MessageBus;
    let busFlushHandler: ((e: any) => Promise<void>) | null = null;

    beforeEach(() => {
        bus = new MessageBus(10); // 10ms delay
        wire = new KirewireClient();
        (wire as any).bus = bus; // Inject our test bus
        
        document.body.innerHTML = '';

        // Mock Fetch
        (global as any).fetch = async (url: string, opts: any) => {
            const body = JSON.parse(opts.body);
            return {
                ok: true,
                status: 200,
                json: async () => body.batch.map((a: any) => ({
                    id: a.id,
                    success: true,
                    state: { ...a.state, ...(a.method === '$set' ? { [a.params[0]]: a.params[1] } : {}) },
                    checksum: 'new-c'
                }))
            };
        };

        // Manual bus flush bridge
        busFlushHandler = async (e: any) => {
            const { batch, finish } = e.detail;
            const response = await fetch('', { method: 'POST', body: JSON.stringify({ batch }) });
            finish(await response.json());
        };
        window.addEventListener('wire:bus:flush' as any, busFlushHandler as any);
    });

    afterEach(() => {
        if (busFlushHandler) {
            window.removeEventListener('wire:bus:flush' as any, busFlushHandler as any);
            busFlushHandler = null;
        }
    });

    test("MessageBus should correctly batch actions", async () => {
        const fetchSpy = spyOn(global as any, "fetch");

        bus.enqueue({ id: 'A', method: 'act', params: [], state: {}, checksum: 'c', pageId: 'p' });
        bus.enqueue({ id: 'B', method: 'act', params: [], state: {}, checksum: 'c', pageId: 'p' });

        await new Promise(r => setTimeout(r, 100));

        expect(fetchSpy).toHaveBeenCalled();
        const body = JSON.parse(fetchSpy.mock.calls[0]![1].body);
        expect(body.batch).toHaveLength(2);
    });

    test("wire.call should flush deferred updates", async () => {
        const fetchSpy = spyOn(global as any, "fetch");

        document.body.innerHTML = `<div id="root" wire:id="comp1" wire:state='{"text": ""}' wire:checksum="c1"></div>`;
        const root = document.getElementById('root')!;

        // 1. Defer an update
        wire.defer('comp1', 'text', 'hello');

        // 2. Call an action (using the element to find metadata)
        await wire.call(root, 'send');

        // Allow MessageBus timer to finish
        await new Promise(r => setTimeout(r, 50));

        expect(fetchSpy).toHaveBeenCalled();
        const body = JSON.parse(fetchSpy.mock.calls[0]![1].body);
        
        // Batch should be [$set, send]
        expect(body.batch).toHaveLength(2);
        expect(body.batch[0].method).toBe('$set');
        expect(body.batch[0].params).toEqual(['text', 'hello']);
        expect(body.batch[1].method).toBe('send');
    });

    test("wire.call should send deferred $set before function call with params", async () => {
        const fetchSpy = spyOn(global as any, "fetch");

        document.body.innerHTML = `<div id="root" wire:id="comp1" wire:state='{\"text\":\"\"}' wire:checksum="c1"></div>`;
        const root = document.getElementById('root')!;

        wire.defer('comp1', 'text', 'hello');
        await wire.call(root, "save(123, 'abc')");
        await new Promise(r => setTimeout(r, 50));

        expect(fetchSpy).toHaveBeenCalled();
        const body = JSON.parse(fetchSpy.mock.calls[0]![1].body);

        expect(body.batch).toHaveLength(2);
        expect(body.batch[0]).toMatchObject({
            id: "comp1",
            method: "$set",
            params: ["text", "hello"]
        });
        expect(body.batch[1]).toMatchObject({
            id: "comp1",
            method: "save",
            params: [123, "abc"]
        });
    });

    test("wire proxy should trigger defer", async () => {
        document.body.innerHTML = `<div id="root" wire:id="comp1" wire:state='{"count": 0}' wire:checksum="c1"></div>`;
        const root = document.getElementById('root')!;
        
        // Manually create and register proxy for test
        const proxy = (wire as any).createProxy('comp1', root);
        wire.components.set('comp1', proxy);

        // 1. Set property via proxy
        proxy.count = 10;

        // 2. Verify deferred map
        const deferred = (wire as any).deferredUpdates.get('comp1');
        expect(deferred).toBeDefined();
        expect(deferred.count).toBe(10);
        
        // 3. Verify internal target update (for immediate UI feedback)
        expect(proxy.__target.count).toBe(10);
    });

    test("MessageBus should serialize flushes while a request is in-flight", async () => {
        if (busFlushHandler) {
            window.removeEventListener('wire:bus:flush' as any, busFlushHandler as any);
            busFlushHandler = null;
        }

        const isolatedBus = new MessageBus(0);
        let inFlight = 0;
        let maxInFlight = 0;
        let flushCount = 0;

        const handler = (e: any) => {
            flushCount++;
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);

            const { finish } = e.detail;
            setTimeout(() => {
                inFlight--;
                finish([{ success: true }]);
            }, 25);
        };

        window.addEventListener('wire:bus:flush' as any, handler);

        try {
            const p1 = isolatedBus.enqueue({ id: 'A', method: 'act1', params: [], pageId: 'p' } as any);
            const p2 = isolatedBus.enqueue({ id: 'B', method: 'act2', params: [], pageId: 'p' } as any);

            await new Promise(r => setTimeout(r, 5));
            expect(inFlight).toBe(1);
            const p3 = isolatedBus.enqueue({ id: 'C', method: 'act3', params: [], pageId: 'p' } as any);

            await Promise.all([p1, p2, p3]);
        } finally {
            window.removeEventListener('wire:bus:flush' as any, handler);
        }

        expect(maxInFlight).toBe(1);
        expect(flushCount).toBe(2);
    });
});
