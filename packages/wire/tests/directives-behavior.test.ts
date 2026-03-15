import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kirewire } from "../web/kirewire";
import "../web/directives/model";
import "../web/directives/loading";

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
(global as any).Event = dom.window.Event;

function createFakeWire(componentId = "cmp-1") {
    const listeners = new Map<string, Array<(data: any) => void>>();
    const calls: Array<{ expression: string; method: string; params: any[] }> = [];
    const deferred: Array<{ id: string; expression: string; value: any }> = [];

    const on = (event: string, callback: (data: any) => void) => {
        const list = listeners.get(event) || [];
        list.push(callback);
        listeners.set(event, list);
        return () => {
            const current = listeners.get(event) || [];
            listeners.set(event, current.filter((fn) => fn !== callback));
        };
    };

    const wire = {
        call: (el: HTMLElement, method: string, params: any[]) => {
            calls.push({ expression: el.getAttribute("wire:model") || "", method, params });
        },
        defer: (id: string, expression: string, value: any) => {
            deferred.push({ id, expression, value });
        },
        on,
        $on: on,
        emit: (event: string, data: any) => {
            const list = listeners.get(event) || [];
            for (let i = 0; i < list.length; i++) {
                list[i]!(data);
            }
        },
        getComponentId: () => componentId,
    };

    return { wire, calls, deferred };
}

describe("wire model/loading directives", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    test("wire:start hydrates nested loading descendants inside a component tree", () => {
        document.body.innerHTML = `
            <div wire:id="cmp-1" wire:state='{}'>
                <button wire:click="save" wire:target="save" wire:loading.attr="disabled">
                    <span id="idle" wire:loading.remove wire:target="save">Save</span>
                    <span id="busy" wire:loading wire:target="save">Loading</span>
                </button>
            </div>
        `;

        const fakeAlpine: any = {
            started: false,
            plugin() {},
            magic() {},
            addRootSelector() {},
            skipDuringClone(fn: any) { return fn; },
            interceptInit(fn: any) { this._init = fn; },
            start() { this.started = true; },
            morph() {},
        };

        (Kirewire as any).started = false;
        if ((Kirewire as any).observer) {
            (Kirewire as any).observer.disconnect();
            (Kirewire as any).observer = null;
        }
        Kirewire.resetClientState();

        Kirewire.start(fakeAlpine);

        const idle = document.getElementById("idle") as HTMLElement;
        const busy = document.getElementById("busy") as HTMLElement;

        expect(idle.style.display).not.toBe("none");
        expect(busy.style.display).toBe("none");

        Kirewire.$emit("component:call", { id: "cmp-1", method: "save", params: [] });
        expect(idle.style.display).toBe("none");
        expect(busy.style.display).not.toBe("none");

        Kirewire.$emit("component:finished", { id: "cmp-1", method: "save", params: [] });
        expect(idle.style.display).not.toBe("none");
        expect(busy.style.display).toBe("none");

        (Kirewire as any).started = false;
        if ((Kirewire as any).observer) {
            (Kirewire as any).observer.disconnect();
            (Kirewire as any).observer = null;
        }
    });

    test("wire:model.blur commits only on blur", () => {
        const input = document.createElement("input");
        input.setAttribute("wire:model.blur", "name");
        document.body.appendChild(input);

        const directive = Kirewire.getDirective("model")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, calls } = createFakeWire();

        directive({
            el: input,
            value: "model",
            expression: "name",
            modifiers: ["blur"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        input.value = "alpha";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        expect(calls).toHaveLength(0);

        input.dispatchEvent(new Event("blur", { bubbles: true }));
        expect(calls).toHaveLength(1);
        expect(calls[0]!.method).toBe("$set");
        expect(calls[0]!.params).toEqual(["name", "alpha"]);

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:model.debounce sends only the last value", async () => {
        const input = document.createElement("input");
        input.setAttribute("wire:model.live.debounce.60ms", "search");
        document.body.appendChild(input);

        const directive = Kirewire.getDirective("model")!;
        const cleanupFns: Array<() => void> = [];
        const { wire, calls } = createFakeWire();

        directive({
            el: input,
            value: "model",
            expression: "search",
            modifiers: ["live", "debounce", "60ms"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        input.value = "a";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.value = "ab";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(calls).toHaveLength(1);
        expect(calls[0]!.params).toEqual(["search", "ab"]);

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:model does not overwrite focused text input with stale server state", () => {
        const input = document.createElement("input");
        input.setAttribute("wire:model", "name");
        document.body.appendChild(input);

        const directive = Kirewire.getDirective("model")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        directive({
            el: input,
            value: "model",
            expression: "name",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        input.focus();
        input.value = "new-local-value";
        (wire as any).emit("component:update", {
            id: "cmp-1",
            state: { name: "old-server-value" },
        });

        expect(input.value).toBe("new-local-value");

        input.blur();
        (wire as any).emit("component:update", {
            id: "cmp-1",
            state: { name: "fresh-server-value" },
        });

        expect(input.value).toBe("fresh-server-value");
        cleanupFns.forEach((fn) => fn());
    });

    test("wire:loading respects wire:target method filter", () => {
        const indicator = document.createElement("span");
        indicator.setAttribute("wire:loading", "");
        indicator.setAttribute("wire:target", "save");
        document.body.appendChild(indicator);

        const directive = Kirewire.getDirective("loading")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        directive({
            el: indicator,
            value: "loading",
            expression: "",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(indicator.style.display).toBe("none");

        (wire as any).emit("component:call", { id: "cmp-1", method: "refresh" });
        expect(indicator.style.display).toBe("none");

        (wire as any).emit("component:call", { id: "cmp-1", method: "save" });
        expect(indicator.style.display).not.toBe("none");

        (wire as any).emit("component:finished", { id: "cmp-1" });
        expect(indicator.style.display).toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:loading.remove works with wire:target property for $set", () => {
        const indicator = document.createElement("span");
        indicator.setAttribute("wire:loading.remove", "");
        indicator.setAttribute("wire:target", "search");
        document.body.appendChild(indicator);

        const directive = Kirewire.getDirective("loading")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        directive({
            el: indicator,
            value: "loading",
            expression: "",
            modifiers: ["remove"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        expect(indicator.style.display).not.toBe("none");

        (wire as any).emit("component:call", {
            id: "cmp-1",
            method: "$set",
            params: ["search", "term"],
        });
        expect(indicator.style.display).toBe("none");

        (wire as any).emit("component:finished", { id: "cmp-1" });
        expect(indicator.style.display).not.toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:loading ignores unrelated finish events when target is set", () => {
        const indicator = document.createElement("span");
        indicator.setAttribute("wire:loading", "");
        indicator.setAttribute("wire:target", "send");
        document.body.appendChild(indicator);

        const directive = Kirewire.getDirective("loading")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        directive({
            el: indicator,
            value: "loading",
            expression: "",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        (wire as any).emit("component:call", { id: "cmp-1", method: "send", params: [] });
        expect(indicator.style.display).not.toBe("none");

        (wire as any).emit("component:finished", { id: "cmp-1", method: "refresh", params: [] });
        expect(indicator.style.display).not.toBe("none");

        (wire as any).emit("component:finished", { id: "cmp-1", method: "send", params: [] });
        expect(indicator.style.display).toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:loading keeps visible while multiple target calls are pending", () => {
        const indicator = document.createElement("span");
        indicator.setAttribute("wire:loading", "");
        indicator.setAttribute("wire:target", "save");
        document.body.appendChild(indicator);

        const directive = Kirewire.getDirective("loading")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        directive({
            el: indicator,
            value: "loading",
            expression: "",
            modifiers: [],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        (wire as any).emit("component:call", { id: "cmp-1", method: "save", params: [] });
        (wire as any).emit("component:call", { id: "cmp-1", method: "save", params: [] });
        expect(indicator.style.display).not.toBe("none");

        (wire as any).emit("component:finished", { id: "cmp-1", method: "save", params: [] });
        expect(indicator.style.display).not.toBe("none");

        (wire as any).emit("component:finished", { id: "cmp-1", method: "save", params: [] });
        expect(indicator.style.display).toBe("none");

        cleanupFns.forEach((fn) => fn());
    });

    test("wire:loading releases UI via failsafe timeout when request lifecycle gets stuck", async () => {
        const indicator = document.createElement("span");
        indicator.setAttribute("wire:loading.failsafe.35ms", "");
        indicator.setAttribute("wire:target", "save");
        document.body.appendChild(indicator);

        const directive = Kirewire.getDirective("loading")!;
        const cleanupFns: Array<() => void> = [];
        const { wire } = createFakeWire();

        directive({
            el: indicator,
            value: "loading",
            expression: "",
            modifiers: ["failsafe", "35ms"],
            cleanup: (fn) => cleanupFns.push(fn),
            wire: wire as any,
            adapter: {} as any,
            componentId: "cmp-1",
        });

        (wire as any).emit("component:call", { id: "cmp-1", method: "save", params: [] });
        expect(indicator.style.display).not.toBe("none");

        await new Promise((resolve) => setTimeout(resolve, 60));
        expect(indicator.style.display).toBe("none");

        cleanupFns.forEach((fn) => fn());
    });
});
