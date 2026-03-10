import { describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { MessageBus } from "../web/utils/message-bus";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).CustomEvent = dom.window.CustomEvent;

describe("MessageBus cancelation", () => {
    test("cancelPending rejects queued items before flush", async () => {
        const bus = new MessageBus(60);
        const error = new Error("cancel-before-flush");

        const p1 = bus.enqueue({ id: "a", method: "run", params: [], pageId: "p1" });
        const p2 = bus.enqueue({ id: "b", method: "run", params: [], pageId: "p1" });

        bus.cancelPending(error);

        await expect(p1).rejects.toThrow("cancel-before-flush");
        await expect(p2).rejects.toThrow("cancel-before-flush");
    });

    test("cancelPending aborts active batch through transport callback", async () => {
        const bus = new MessageBus(0);
        const error = new Error("cancel-in-flight");
        let transportCanceled = false;
        const originalError = console.error;
        console.error = () => {};

        const flushHandler = (event: Event) => {
            const custom = event as CustomEvent;
            const detail = custom.detail || {};
            if (typeof detail.setCancel === "function") {
                detail.setCancel(() => {
                    transportCanceled = true;
                });
            }
        };

        window.addEventListener("wire:bus:flush" as any, flushHandler as any);
        try {
            const pending = bus.enqueue({ id: "c", method: "run", params: [], pageId: "p1" });
            await new Promise((resolve) => setTimeout(resolve, 15));
            bus.cancelPending(error);

            await expect(pending).rejects.toThrow("cancel-in-flight");
            expect(transportCanceled).toBe(true);
        } finally {
            console.error = originalError;
            window.removeEventListener("wire:bus:flush" as any, flushHandler as any);
        }
    });
});
