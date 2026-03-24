import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { JSDOM } from "jsdom";

// Setup JSDOM environment before any imports
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost/",
	pretendToBeVisual: true,
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
import { KirewireClient, type WireAdapter } from "../web/kirewire";
import { MessageBus } from "../web/utils/message-bus";

describe("Kirewire Client Unit Logic", () => {
	let wire: KirewireClient;
	let bus: MessageBus;
	let adapter: WireAdapter;

	beforeEach(() => {
		bus = new MessageBus(10); // 10ms delay
		wire = new KirewireClient();

		// Mock Adapter
		adapter = {
			call: async (id, method, params) => {
				return bus.enqueue({ id, method, params, pageId: "p" });
			},
			defer: (id, prop, value) => {
				(wire as any).deferredUpdates.set(id, {
					...((wire as any).deferredUpdates.get(id) || {}),
					[prop]: value,
				});
				const proxy = wire.components.get(id);
				if (proxy && (proxy as any).__target) {
					(proxy as any).__target[prop] = value;
				}
			},
			upload: async () => ({}),
		};
		wire.adapter = adapter;

		document.body.innerHTML = "";

		// Mock Fetch
		(global as any).fetch = async (_url: string, opts: any) => {
			const body = JSON.parse(opts.body);
			return {
				ok: true,
				status: 200,
				json: async () =>
					body.batch.map((a: any) => ({
						id: a.id,
						success: true,
						state: {
							...(a.method === "$set" ? { [a.params[0]]: a.params[1] } : {}),
						},
					})),
			};
		};

		// Manual bus flush bridge
		window.addEventListener("wire:bus:flush" as any, async (e: any) => {
			const { batch, finish } = e.detail;
			const response = await fetch("", {
				method: "POST",
				body: JSON.stringify({ batch }),
			});
			finish(await response.json());
		});
	});

	afterEach(() => {
		mock.restore();
	});

	test("MessageBus should correctly batch actions", async () => {
		const fetchSpy = spyOn(global as any, "fetch");

		bus.enqueue({ id: "A", method: "act", params: [], pageId: "p" });
		bus.enqueue({ id: "B", method: "act", params: [], pageId: "p" });

		await new Promise((r) => setTimeout(r, 100));

		expect(fetchSpy).toHaveBeenCalled();
		const body = JSON.parse(fetchSpy.mock.calls[0]![1].body);
		expect(body.batch).toHaveLength(2);
	});

	test("wire.call should flush deferred updates", async () => {
		const fetchSpy = spyOn(global as any, "fetch");

		document.body.innerHTML = `<div id="root" wire:id="comp1" wire:state='{"text": ""}'></div>`;
		const root = document.getElementById("root")!;

		// 1. Defer an update via adapter
		wire.adapter.defer("comp1", "text", "hello");

		// 2. Call an action
		const mockCall = spyOn(wire.adapter, "call");
		await wire.call(root, "send");

		// Allow MessageBus timer to finish
		await new Promise((r) => setTimeout(r, 50));

		expect(mockCall).toHaveBeenCalled();
		expect(fetchSpy).toHaveBeenCalled();
	});

	test("wire proxy should trigger defer via wire client queue", async () => {
		document.body.innerHTML = `<div id="root" wire:id="comp1" wire:state='{"count": 0}'></div>`;
		const root = document.getElementById("root")!;

		// Manually create and register proxy for test
		const proxy = (wire as any).createProxy("comp1", root);
		wire.components.set("comp1", proxy);

		// 1. Set property via proxy
		proxy.count = 10;

		// 2. Verify deferred state was queued on wire core
		const deferred = (wire as any).deferredUpdates.get("comp1");
		expect(deferred).toEqual({ count: 10 });
	});

	test("wire.call restores deferred updates when transport call fails", async () => {
		document.body.innerHTML = `<div id="root" wire:id="comp1" wire:state='{"text": ""}'></div>`;
		const root = document.getElementById("root")!;

		wire.defer("comp1", "text", "draft-value");
		expect((wire as any).deferredUpdates.get("comp1")).toEqual({
			text: "draft-value",
		});

		wire.adapter = {
			call: async () => {
				throw new Error("transport failed");
			},
			defer: adapter.defer,
			upload: adapter.upload,
		};

		await expect(wire.call(root, "send")).rejects.toThrow("transport failed");
		expect((wire as any).deferredUpdates.get("comp1")).toEqual({
			text: "draft-value",
		});
	});

	test("live API initializes component, proxies methods/state and saves local changes", async () => {
		const callSpy = spyOn(adapter, "call").mockImplementation(
			async (_id, method) => {
				if (method === "increment") {
					return { state: { count: 1, pcount: 0 }, effects: [] };
				}
				return { state: { count: 0, pcount: 0 }, effects: [] };
			},
		);

		const fetchSpy = spyOn(global as any, "fetch").mockImplementation(
			async (url: string, opts: any) => {
				const rawUrl = String(url || "");
				const body = JSON.parse(String(opts?.body || "{}"));

				if (rawUrl.includes("/live/init")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							id: "live-1",
							state: { count: 0, pcount: body.locals?.pcount ?? 0 },
							ready: true,
						}),
					} as any;
				}

				if (rawUrl.includes("/live/save")) {
					return {
						ok: true,
						status: 200,
						json: async () => ({
							state: body.state || {},
						}),
					} as any;
				}

				return {
					ok: true,
					status: 200,
					json: async () => ({}),
				} as any;
			},
		);

		const live = wire.live("counter", { pcount: 3 });
		expect(live.loading).toBe(true);

		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(live.ready).toBe(true);
		expect(live.loading).toBe(false);
		expect(live.$id).toBe("live-1");
		expect(live.pcount).toBe(3);

		await live.increment();
		expect(callSpy).toHaveBeenCalledWith("live-1", "increment", []);
		expect(live.count).toBe(1);

		live.pcount = 12;
		const saved = await live.save();

		expect(saved.state.pcount).toBe(12);
		expect(fetchSpy).toHaveBeenCalled();
	});
});
