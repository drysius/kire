import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kirewire } from "../web/kirewire";
import "../web/directives/collection";
import "../web/directives/file";
import "../web/directives/intersect";
import "../web/directives/offline";
import "../web/directives/poll";
import "../web/directives/show";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).HTMLTemplateElement = dom.window.HTMLTemplateElement;
(global as any).File = dom.window.File;
(global as any).Blob = dom.window.Blob;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).Event = dom.window.Event;
(global as any).MutationObserver = dom.window.MutationObserver;
(global as any).navigator = dom.window.navigator;

type FakeWireOptions = {
    componentId?: string;
    initialState?: Record<string, any>;
    call?: (el: HTMLElement, method: string, params: any[]) => any;
};

function createFakeWire(options: FakeWireOptions = {}) {
    const componentId = options.componentId || "cmp-1";
    const listeners = new Map<string, Array<(payload: any) => void>>();
    const calls: Array<{ method: string; params: any[] }> = [];
    let state = options.initialState || {};

    const on = (event: string, callback: (payload: any) => void) => {
        const list = listeners.get(event) || [];
        list.push(callback);
        listeners.set(event, list);
        return () => {
            const current = listeners.get(event) || [];
            listeners.set(event, current.filter((item) => item !== callback));
        };
    };

    const emit = (event: string, payload: any) => {
        if (event === "component:update" && payload?.id === componentId && payload?.state) {
            state = payload.state;
        }

        const list = listeners.get(event) || [];
        for (let i = 0; i < list.length; i++) {
            list[i]!(payload);
        }
    };

    const call = async (el: HTMLElement, method: string, params: any[] = []) => {
        calls.push({ method, params });
        if (typeof options.call === "function") {
            return options.call(el, method, params);
        }
    };

    const wire = {
        components: new Map<string, any>(),
        getComponentId: () => componentId,
        getComponentState: () => state,
        getMetadata: () => ({ id: componentId, state }),
        call,
        on,
        $on: on,
        emit,
    };

    return { wire, calls, emit, getState: () => state };
}

describe("wire directives: extended behavior", () => {
    let onlineValue = true;
    let hiddenValue = false;

    beforeEach(() => {
        document.body.innerHTML = "";

        Object.defineProperty(window.navigator, "onLine", {
            configurable: true,
            get: () => onlineValue,
        });
        Object.defineProperty(document, "hidden", {
            configurable: true,
            get: () => hiddenValue,
        });

        onlineValue = true;
        hiddenValue = false;
    });

    test("wire:collection.empty toggles fallback block from collection path", () => {
        document.body.innerHTML = `
            <div wire:id="cmp-1" wire:state='{"entries":[]}'>
                <template wire:collection="entries"></template>
                <div id="empty">No items</div>
            </div>
        `;

        const empty = document.getElementById("empty") as HTMLElement;
        const directive = Kirewire.getDirective("collection")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, emit } = createFakeWire({
            initialState: { entries: [] },
        });

        directive({
            el: empty,
            value: "collection",
            expression: "entries",
            modifiers: ["empty"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(empty.style.display).not.toBe("none");

        emit("component:update", {
            id: "cmp-1",
            state: { entries: [{ id: 1, text: "first" }] },
        });
        expect(empty.style.display).toBe("none");

        emit("component:update", {
            id: "cmp-1",
            state: { entries: [] },
        });
        expect(empty.style.display).not.toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:show evaluates expression against component state", () => {
        const block = document.createElement("div");
        document.body.appendChild(block);

        const directive = Kirewire.getDirective("show")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, emit } = createFakeWire({
            initialState: { open: false, count: 1 },
        });

        directive({
            el: block,
            value: "show",
            expression: "open && count > 0",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(block.style.display).toBe("none");

        emit("component:update", {
            id: "cmp-1",
            state: { open: true, count: 2 },
        });
        expect(block.style.display).not.toBe("none");

        emit("component:update", {
            id: "cmp-1",
            state: { open: false, count: 2 },
        });
        expect(block.style.display).toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:show supports nullish coalescing and nested state paths", () => {
        const block = document.createElement("div");
        document.body.appendChild(block);

        const directive = Kirewire.getDirective("show")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, emit } = createFakeWire({
            initialState: {
                file: { uploading: { percent: 15 } },
            },
        });

        directive({
            el: block,
            value: "show",
            expression: "file && file.uploading && (file.uploading.percent ?? 100) < 100",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(block.style.display).not.toBe("none");

        emit("component:update", {
            id: "cmp-1",
            state: {
                file: { uploading: { percent: 100 } },
            },
        });

        expect(block.style.display).toBe("none");
        cleanupFns.forEach((fn) => fn());
    });

    test("wire:show uses strict equality semantics for == and !=", () => {
        const block = document.createElement("div");
        document.body.appendChild(block);

        const directive = Kirewire.getDirective("show")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, emit } = createFakeWire({
            initialState: { count: 0 },
        });

        directive({
            el: block,
            value: "show",
            expression: "count == ''",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(block.style.display).toBe("none");

        emit("component:update", {
            id: "cmp-1",
            state: { count: "" },
        });
        expect(block.style.display).not.toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:show fails closed for unsupported expressions", () => {
        const block = document.createElement("div");
        document.body.appendChild(block);

        const directive = Kirewire.getDirective("show")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire({
            initialState: { open: true },
        });

        directive({
            el: block,
            value: "show",
            expression: "dangerousCall()",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(block.style.display).toBe("none");
        cleanupFns.forEach((fn) => fn());
    });

    test("wire:offline and wire:online toggle visibility from navigator state", () => {
        const offlineBlock = document.createElement("div");
        const onlineBlock = document.createElement("div");
        document.body.appendChild(offlineBlock);
        document.body.appendChild(onlineBlock);

        const offlineDirective = Kirewire.getDirective("offline")!;
        const onlineDirective = Kirewire.getDirective("online")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        offlineDirective({
            el: offlineBlock,
            value: "offline",
            expression: "",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        onlineDirective({
            el: onlineBlock,
            value: "online",
            expression: "",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(offlineBlock.style.display).toBe("none");
        expect(onlineBlock.style.display).not.toBe("none");

        onlineValue = false;
        window.dispatchEvent(new Event("offline"));
        expect(offlineBlock.style.display).not.toBe("none");
        expect(onlineBlock.style.display).toBe("none");

        onlineValue = true;
        window.dispatchEvent(new Event("online"));
        expect(offlineBlock.style.display).toBe("none");
        expect(onlineBlock.style.display).not.toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:intersect supports directional edge filtering and once", async () => {
        const target = document.createElement("div");
        document.body.appendChild(target);

        const observers: Array<{ callback: (entries: any[]) => void; disconnected: boolean }> = [];
        (global as any).IntersectionObserver = class MockIntersectionObserver {
            private index: number;
            constructor(callback: (entries: any[]) => void) {
                observers.push({ callback, disconnected: false });
                this.index = observers.length - 1;
            }
            observe() {}
            disconnect() {
                observers[this.index]!.disconnected = true;
            }
        };

        const directive = Kirewire.getDirective("intersect")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, calls } = createFakeWire();

        directive({
            el: target,
            value: "intersect",
            expression: "loadMore",
            modifiers: ["top", "once"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        const observer = observers[0]!;
        observer.callback([{
            isIntersecting: true,
            intersectionRect: { top: 95, bottom: 100, left: 0, right: 20 },
            rootBounds: { top: 0, bottom: 100, left: 0, right: 100 },
        }]);
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(calls).toHaveLength(0);

        observer.callback([{
            isIntersecting: true,
            intersectionRect: { top: 0, bottom: 6, left: 0, right: 20 },
            rootBounds: { top: 0, bottom: 100, left: 0, right: 100 },
        }]);
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(calls).toHaveLength(1);
        expect(calls[0]!.method).toBe("loadMore");
        expect(observer.disconnected).toBe(true);

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:intersect disconnects safely when element is removed from DOM", async () => {
        const target = document.createElement("div");
        document.body.appendChild(target);

        const observers: Array<{ callback: (entries: any[]) => void; disconnected: boolean }> = [];
        (global as any).IntersectionObserver = class MockIntersectionObserver {
            private index: number;
            constructor(callback: (entries: any[]) => void) {
                observers.push({ callback, disconnected: false });
                this.index = observers.length - 1;
            }
            observe() {}
            disconnect() {
                observers[this.index]!.disconnected = true;
            }
        };

        const directive = Kirewire.getDirective("intersect")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, calls } = createFakeWire();

        directive({
            el: target,
            value: "intersect",
            expression: "loadMore",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        target.remove();
        observers[0]!.callback([{
            isIntersecting: true,
            intersectionRect: { top: 0, bottom: 10, left: 0, right: 10 },
            rootBounds: { top: 0, bottom: 100, left: 0, right: 100 },
        }]);
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(calls).toHaveLength(0);
        expect(observers[0]!.disconnected).toBe(true);
        cleanupFns.forEach((fn) => fn());
    });

    test("wire:poll.visible respects visibility and prevents concurrent calls", async () => {
        const target = document.createElement("div");
        document.body.appendChild(target);

        const observers: Array<{ callback: (entries: any[]) => void }> = [];
        (global as any).IntersectionObserver = class MockIntersectionObserver {
            constructor(callback: (entries: any[]) => void) {
                observers.push({ callback });
            }
            observe() {}
            disconnect() {}
        };

        let activeCalls = 0;
        let maxActiveCalls = 0;
        const { wire, calls } = createFakeWire({
            call: async () => {
                activeCalls += 1;
                if (activeCalls > maxActiveCalls) maxActiveCalls = activeCalls;
                await new Promise((resolve) => setTimeout(resolve, 25));
                activeCalls -= 1;
            },
        });

        const directive = Kirewire.getDirective("poll")!;
        const cleanupFns: Array<() => void> = [];

        directive({
            el: target,
            value: "poll",
            expression: "$refresh",
            modifiers: ["visible", "10ms"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        await new Promise((resolve) => setTimeout(resolve, 40));
        expect(calls).toHaveLength(0);

        observers[0]!.callback([{ isIntersecting: true }]);
        await new Promise((resolve) => setTimeout(resolve, 120));

        expect(calls.length).toBeGreaterThan(0);
        expect(maxActiveCalls).toBe(1);

        const callCountBeforeHidden = calls.length;
        hiddenValue = true;
        document.dispatchEvent(new Event("visibilitychange"));
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(calls.length).toBe(callCountBeforeHidden);

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:poll stops interval when element leaves DOM", async () => {
        const target = document.createElement("div");
        document.body.appendChild(target);

        const originalClearInterval = globalThis.clearInterval;
        let clearCount = 0;
        (globalThis as any).clearInterval = ((id: any) => {
            clearCount += 1;
            return originalClearInterval(id);
        }) as any;

        const directive = Kirewire.getDirective("poll")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        try {
            directive({
                el: target,
                value: "poll",
                expression: "$refresh",
                modifiers: ["15ms"],
                cleanup: (fn) => cleanupFns.push(fn),
                wire: wire as any,
                adapter: {} as any,
                componentId: "cmp-1",
            });

            await new Promise((resolve) => setTimeout(resolve, 25));
            expect(clearCount).toBe(0);

            target.remove();
            await new Promise((resolve) => setTimeout(resolve, 40));
            expect(clearCount).toBeGreaterThan(0);
        } finally {
            (globalThis as any).clearInterval = originalClearInterval;
            cleanupFns.forEach((fn) => fn());
        }
    });

    test("wire:file.preview renders media previews and revokes object URLs", () => {
        const originalCreate = (URL as any).createObjectURL;
        const originalRevoke = (URL as any).revokeObjectURL;

        const created: string[] = [];
        const revoked: string[] = [];
        (URL as any).createObjectURL = (blob: Blob) => {
            const id = `blob:test-${created.length + 1}`;
            created.push(`${id}:${blob.type || "application/octet-stream"}`);
            return id;
        };
        (URL as any).revokeObjectURL = (value: string) => {
            revoked.push(value);
        };

        try {
            const preview = document.createElement("div");
            document.body.appendChild(preview);

            const directive = Kirewire.getDirective("file")!;
            const cleanupFns: Array<() => void> = [];
            const { wire, emit } = createFakeWire({
                initialState: {
                    uploads: [new File(["hello"], "image.png", { type: "image/png" })],
                },
            });

            directive({
                el: preview,
                value: "file",
                expression: "uploads",
                modifiers: ["preview"],
                cleanup: (fn) => cleanupFns.push(fn),
                wire: wire as any,
                adapter: {} as any,
                componentId: "cmp-1",
            });

            expect(preview.innerHTML).toContain("<img");
            expect(created.length).toBe(1);

            emit("component:update", {
                id: "cmp-1",
                state: { uploads: [] },
            });

            expect(preview.innerHTML.trim()).toBe("");
            expect(revoked).toContain("blob:test-1");

            cleanupFns.forEach((fn) => fn());
        } finally {
            (URL as any).createObjectURL = originalCreate;
            (URL as any).revokeObjectURL = originalRevoke;
        }
    });

    test("stream effects ignore invalid CSS selectors without throwing", () => {
        expect(() => {
            Kirewire.processEffects([
                {
                    type: "stream",
                    payload: {
                        target: "[invalid-selector",
                        content: "noop",
                        method: "update",
                    },
                },
            ]);
        }).not.toThrow();
    });
});
