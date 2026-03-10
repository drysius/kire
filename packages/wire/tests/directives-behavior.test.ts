import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kirewire } from "../web/kirewire";
import "../web/directives/model";
import "../web/directives/loading";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
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
});