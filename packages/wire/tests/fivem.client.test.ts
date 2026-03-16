import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { JSDOM } from "jsdom";
import { FiveMClientAdapter } from "../web/adapters/fivem";
import { KirewireClient } from "../web/kirewire";

describe("FiveMClientAdapter", () => {
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

	let adapter: FiveMClientAdapter | null = null;
	let wire: KirewireClient | null = null;

	function findByWireId(id: string): HTMLElement | null {
		const nodes = document.querySelectorAll("*");
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i] as HTMLElement;
			const wireId =
				node.getAttribute("wire:id") || node.getAttribute("wire-id");
			if (wireId === id) return node;
		}
		return null;
	}

	beforeEach(() => {
		document.body.innerHTML = "";
		adapter = null;
		wire = null;
	});

	afterEach(() => {
		if (adapter) adapter.destroy();
	});

	test("sends calls through NUI bridge and applies response patch", async () => {
		document.body.innerHTML = `<div id="root" wire:id="c1" wire:state='{"count":0}'>Count: 0</div>`;
		const root = document.getElementById("root") as HTMLElement;
		const fetchSpy = spyOn(globalThis as any, "fetch");
		const sentPayloads: any[] = [];

		wire = new KirewireClient();
		adapter = new FiveMClientAdapter({
			url: "/_wire",
			pageId: "page-1",
			transport: "fivem",
			createRequest: async (_callbackName, payload) => {
				sentPayloads.push(payload);
				const requestId = String(payload?.payload?.requestId || "");

				queueMicrotask(() => {
					window.dispatchEvent(
						new dom.window.MessageEvent("message", {
							data: {
								__kirewire: true,
								event: "response",
								payload: {
									requestId,
									result: {
										id: "c1",
										success: true,
										state: { count: 1 },
										html: `<div wire:id="c1" wire:state='{"count":1}'>Count: 1</div>`,
										effects: [],
										revision: 1,
									},
								},
							},
						}),
					);
				});

				return { accepted: true };
			},
		});
		wire.setAdapter(adapter as any);

		const result = await wire.call(root, "increment");
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(sentPayloads).toHaveLength(1);
		expect(sentPayloads[0]?.event).toBe("call");
		expect(sentPayloads[0]?.payload?.id).toBe("c1");
		expect(sentPayloads[0]?.payload?.method).toBe("increment");
		expect(result?.state?.count).toBe(1);

		const patched = findByWireId("c1");
		expect(patched).not.toBeNull();
		expect(String(patched?.textContent || "")).toContain("Count: 1");
	});

	test("applies update packets dispatched by bridge messages", async () => {
		document.body.innerHTML = `<div id="root" wire:id="c2" wire:state='{"count":3}'>Count: 3</div>`;

		wire = new KirewireClient();
		adapter = new FiveMClientAdapter({
			url: "/_wire",
			pageId: "page-2",
			transport: "fivem",
			createRequest: async () => ({ accepted: true }),
		});
		wire.setAdapter(adapter as any);

		window.dispatchEvent(
			new dom.window.MessageEvent("message", {
				data: {
					__kirewire: true,
					event: "update",
					payload: {
						id: "c2",
						state: { count: 4 },
						html: `<div wire:id="c2" wire:state='{"count":4}'>Count: 4</div>`,
						effects: [],
						revision: 2,
					},
				},
			}),
		);

		await new Promise((resolve) => setTimeout(resolve, 10));

		const patched = findByWireId("c2");
		expect(patched).not.toBeNull();
		expect(String(patched?.textContent || "")).toContain("Count: 4");
		const state = JSON.parse(
			String(patched?.getAttribute("wire:state") || "{}"),
		);
		expect(state.count).toBe(4);
	});
});
