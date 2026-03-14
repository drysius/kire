import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "kire";
import { Kirewire } from "../src/kirewire";
import { SocketAdapter } from "../src/adapters/socket";
import { Component } from "../src/component";
import { KirewireClient } from "../web/kirewire";
import { SocketClientAdapter } from "../web/adapters/socket";

class InMemorySocket {
    public readyState = 0;
    public onopen: ((event: any) => void) | null = null;
    public onmessage: ((event: { data: any }) => void) | null = null;
    public onerror: ((event: any) => void) | null = null;
    public onclose: ((event: any) => void) | null = null;

    constructor(private readonly sendToServer: (raw: string) => void) {
        queueMicrotask(() => {
            this.readyState = 1;
            this.onopen?.({});
        });
    }

    public send(raw: string) {
        if (this.readyState !== 1) {
            throw new Error("Socket is not open.");
        }
        this.sendToServer(raw);
    }

    public receive(raw: string) {
        this.onmessage?.({ data: raw });
    }

    public close() {
        if (this.readyState >= 2) return;
        this.readyState = 3;
        this.onclose?.({});
    }
}

class CounterComponent extends Component {
    public count = 0;

    public async increment() {
        this.count += 1;
    }

    public async _secret() {
        this.count += 99;
    }

    render() {
        return `<div class="counter-value">Count: ${this.count}</div>` as any;
    }
}

describe("Socket transport E2E", () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "http://localhost/",
        pretendToBeVisual: true,
    });

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLElement = dom.window.HTMLElement;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
    (global as any).DOMParser = dom.window.DOMParser;
    (global as any).CustomEvent = dom.window.CustomEvent;
    (global as any).MutationObserver = dom.window.MutationObserver;
    (global as any).navigator = dom.window.navigator;
    (global as any).TextEncoder = TextEncoder;

    (window as any).Alpine = {
        morph(from: HTMLElement, to: HTMLElement) {
            from.replaceWith(to);
        },
    };

    let offPush: (() => void) | null = null;
    let clientAdapter: SocketClientAdapter | null = null;
    let serverWire: Kirewire | null = null;
    let socketAdapter: SocketAdapter | null = null;

    beforeEach(() => {
        document.body.innerHTML = "";
        offPush = null;
        clientAdapter = null;
        serverWire = null;
        socketAdapter = null;
    });

    afterEach(async () => {
        if (offPush) offPush();
        if (clientAdapter) clientAdapter.destroy();
        if (socketAdapter) socketAdapter.destroy();
        if (serverWire) await serverWire.destroy();
    });

    function createHarness() {
        const kire = new Kire();
        const wire = new Kirewire({ secret: "socket-e2e-secret" });
        const adapter = new SocketAdapter({ route: "/_wire" });
        adapter.install(wire, kire);

        const page = wire.sessions.getPage("user-1", "page-1");
        const instance = new CounterComponent() as any;
        instance.$id = "c1";
        page.components.set("c1", instance);

        document.body.innerHTML = `<div id="root" wire:id="c1" wire:state='{"count":0}'>Count: 0</div>`;
        const root = document.getElementById("root") as HTMLElement;

        let socketRef: InMemorySocket | null = null;
        const clientWire = new KirewireClient();
        const bridgeOff = wire.on("socket:push", (packet: any) => {
            if (packet?.userId !== "user-1") return;
            if (!socketRef) return;
            socketRef.receive(JSON.stringify({
                event: packet.event,
                payload: packet.data,
            }));
        });

        const adapterClient = new SocketClientAdapter({
            url: "/_wire",
            pageId: "page-1",
            transport: "socket",
            createSocket: () => {
                socketRef = new InMemorySocket((raw) => {
                    const message = JSON.parse(raw);
                    void adapter.onMessage("sock-1", "user-1", "session-1", message);
                });
                return socketRef as any;
            },
        });
        clientWire.setAdapter(adapterClient as any);

        offPush = bridgeOff;
        clientAdapter = adapterClient;
        serverWire = wire;
        socketAdapter = adapter;

        return { clientWire, root, component: instance };
    }

    test("processes socket call and patches component state/html", async () => {
        const { clientWire, root, component } = createHarness();
        const fetchSpy = spyOn(globalThis as any, "fetch");

        const result = await clientWire.call(root, "increment");
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(component.count).toBe(1);
        expect(result?.success).toBe(true);
        expect(result?.state?.count).toBe(1);

        const all = document.querySelectorAll("*");
        let patched: HTMLElement | null = null;
        for (let i = 0; i < all.length; i++) {
            const candidate = all[i] as HTMLElement;
            if (candidate.getAttribute("wire:id") === "c1" || candidate.getAttribute("wire-id") === "c1") {
                patched = candidate;
                break;
            }
        }
        expect(patched).not.toBeNull();
        const state = JSON.parse(String(patched?.getAttribute("wire:state") || "{}"));
        expect(state.count).toBe(1);
        expect(String(patched?.textContent || "")).toContain("Count: 1");
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    test("blocks private component methods over socket transport", async () => {
        const { clientWire, root, component } = createHarness();

        await expect(clientWire.call(root, "_secret")).rejects.toThrow('Method "_secret" is not callable.');
        expect(component.count).toBe(0);
    });

    test("blocks unauthorized $set over socket transport", async () => {
        const { clientWire, root, component } = createHarness();

        await expect(
            clientWire.call(root, "$set", ["isAdmin", true]),
        ).rejects.toThrow('Property "isAdmin" is not writable.');

        expect(component.count).toBe(0);
        expect((component as any).isAdmin).toBeUndefined();
    });
});
