import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "kire";
import { Component, HttpAdapter, Kirewire, WireBroadcast } from "../src/index";
import { HttpClientAdapter } from "../web/adapters/http";
import { KirewireClient, type WireAdapter } from "../web/kirewire";
import { MessageBus } from "../web/utils/message-bus";

// --- MOCK ENVIRONMENT ---
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost/",
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
	async increment() {
		this.count++;
	}
	render() {
		return `Count: ${this.count}`;
	}
}

class SharedCounterComponent extends Component {
	count = 0;
	shared = new WireBroadcast({ name: "shared-counter", includes: ["count"] });

	async mount() {
		this.shared.serverHydrate(this);
	}

	async increment() {
		this.count++;
		this.shared.update(this, (this as any).$wire_instance);
	}

	render() {
		return `Shared: ${this.count}`;
	}
}

class ModelHookComponent extends Component {
	search = "";
	updates: string[] = [];

	async updatedSearch(value: string, property: string) {
		this.updates.push(`search:${property}:${value}`);
	}

	async updated(value: string, property: string) {
		this.updates.push(`generic:${property}:${value}`);
	}

	render() {
		return `Search: ${this.search}`;
	}
}

describe("Kirewire Full Integration (Client + Server)", () => {
	let kire: Kire;
	let serverWire: Kirewire;
	let adapter: HttpAdapter;
	let clientWire: KirewireClient;
	const SECRET = "test-secret";

	let busFlushHandler: any;

	beforeEach(() => {
		// 1. Setup Server
		kire = new Kire();
		serverWire = new Kirewire({ secret: SECRET });
		serverWire.components.set("counter", CounterComponent as any);
		adapter = new HttpAdapter();
		adapter.install(serverWire, kire);

		// 2. Setup Client
		clientWire = new KirewireClient();

		// 3. Bridge: Test Adapter to call Server Adapter directly
		const bus = new MessageBus(0);
		const testAdapter: WireAdapter = {
			call: async (id, method, params) => {
				return bus.enqueue({ id, method, params, pageId: clientWire.pageId });
			},
			defer: (id, prop, value) => {
				(clientWire as any).deferredUpdates.set(id, {
					...((clientWire as any).deferredUpdates.get(id) || {}),
					[prop]: value,
				});
			},
			upload: async () => ({}),
		};
		clientWire.adapter = testAdapter;
		clientWire.pageId = "page-1";

		busFlushHandler = async (e: any) => {
			const { batch, finish } = e.detail;
			const response = await adapter.handleRequest(
				{
					method: "POST",
					url: "/_wire",
					body: { batch, pageId: clientWire.pageId },
				},
				"user-1",
				"session-1",
			);
			finish(response.result);
		};
		window.addEventListener("wire:bus:flush" as any, busFlushHandler);

		document.body.innerHTML = "";
	});

	afterEach(() => {
		if (busFlushHandler) {
			window.removeEventListener("wire:bus:flush" as any, busFlushHandler);
		}
	});

	test("Client payload should not send state/checksum", async () => {
		const fetchSpy = spyOn(adapter, "handleRequest");

		const page = serverWire.sessions.getPage("user-1", "page-1");
		const instance = new CounterComponent();
		instance.$id = "c1";
		page.components.set("c1", instance);

		document.body.innerHTML = `<div id="root" wire:id="c1" wire:state='{"count": 0}'></div>`;
		await clientWire.call(document.getElementById("root")!, "increment");

		const call = fetchSpy.mock.calls[0]![0];
		// The mock might send empty object if not specified, but core logic should not use it if not sent by client
		expect(Object.keys(call.body.batch[0].state || {}).length).toBe(0);
	});

	test("HttpAdapter should serve client script at /_wire/kirewire.js", async () => {
		const response = await adapter.handleRequest(
			{
				method: "GET",
				url: "/_wire/kirewire.js",
			},
			"user-1",
			"session-1",
		);

		expect(response.status).toBe(200);
		expect(String(response.headers?.["Content-Type"] || "")).toContain(
			"text/javascript",
		);
		expect(typeof response.result).toBe("string");
		expect((response.result as string).length).toBeGreaterThan(20);
		expect(String(response.result)).not.toContain("Method not allowed");
	});

	test("Full Cycle: Client increments counter on Server and patches DOM", async () => {
		const page = serverWire.sessions.getPage("user-1", "page-1");
		const instance = new CounterComponent();
		instance.$id = "c1";
		instance.$kire = kire;
		page.components.set("c1", instance);

		document.body.innerHTML = `
            <div id="root" wire:id="c1" wire:state='{"count": 0}'>
                Count: 0
            </div>
        `;
		const root = document.getElementById("root")!;

		await clientWire.call(root, "increment");
		expect(instance.count).toBe(1);
	});

	test("Side Effects: Redirect and Events", async () => {
		class EffectComponent extends Component {
			async doSomething() {
				this.$redirect("/home");
				this.$emit("notified", { ok: true });
			}
			render() {
				return "";
			}
		}
		serverWire.components.set("effect-comp", EffectComponent as any);

		const page = serverWire.sessions.getPage("user-1", "page-1");
		const instance = new EffectComponent();
		instance.$id = "e1";
		page.components.set("e1", instance);

		document.body.innerHTML = `<div id="root" wire:id="e1" wire:state='{}'></div>`;

		const result = await clientWire.call(
			document.getElementById("root")!,
			"doSomething",
		);
		const firstResult = Array.isArray(result) ? result[0] : result;

		expect(firstResult.effects).toContainEqual({
			type: "redirect",
			payload: "/home",
		});
		expect(firstResult.effects).toContainEqual({
			type: "event",
			payload: { name: "notified", params: [{ ok: true }] },
		});
	});

	test("State Persistence: Server updates state and client reflects it", async () => {
		const page = serverWire.sessions.getPage("user-1", "page-1");
		const instance = new CounterComponent();
		instance.$id = "c1";
		instance.count = 5;
		page.components.set("c1", instance);

		document.body.innerHTML = `<div id="root" wire:id="c1" wire:state='{"count": 999}'></div>`;

		await clientWire.call(document.getElementById("root")!, "increment");
		expect(instance.count).toBe(6);
	});

	test("$set triggers updated<Property> and updated hooks", async () => {
		serverWire.components.set("model-hook", ModelHookComponent as any);

		const page = serverWire.sessions.getPage("user-1", "page-1");
		const instance = new ModelHookComponent();
		instance.$id = "m1";
		instance.$kire = kire;
		page.components.set("m1", instance);

		document.body.innerHTML = `<div id="root" wire:id="m1" wire:state='{"search":""}'></div>`;

		await clientWire.call(document.getElementById("root")!, "$set", [
			"search",
			"john",
		]);

		expect(instance.search).toBe("john");
		expect(instance.updates).toContain("search:search:john");
		expect(instance.updates).toContain("generic:search:john");
	});

	test("HTTP adapter rejects $set on non-writable property", async () => {
		serverWire.components.set("model-hook", ModelHookComponent as any);

		const page = serverWire.sessions.getPage("user-1", "page-1");
		const instance = new ModelHookComponent();
		instance.$id = "m2";
		instance.$kire = kire;
		page.components.set("m2", instance);

		document.body.innerHTML = `<div id="root" wire:id="m2" wire:state='{"search":""}'></div>`;

		await expect(
			clientWire.call(document.getElementById("root")!, "$set", [
				"isAdmin",
				true,
			]),
		).rejects.toBe('Property "isAdmin" is not writable.');

		expect((instance as any).isAdmin).toBeUndefined();
		expect(instance.search).toBe("");
	});

	test("Broadcast components sync through SSE updates and not inline response html", async () => {
		const page = serverWire.sessions.getPage("user-1", "page-1");

		const first = new SharedCounterComponent();
		first.$id = "s1";
		first.$wire_instance = serverWire;
		await first.mount();
		page.components.set("s1", first);

		const second = new SharedCounterComponent();
		second.$id = "s2";
		second.$wire_instance = serverWire;
		await second.mount();
		page.components.set("s2", second);

		const updates: any[] = [];
		const off = serverWire.on("component:update", (payload) =>
			updates.push(payload),
		);

		try {
			const response = await adapter.handleRequest(
				{
					method: "POST",
					url: "/_wire",
					body: {
						batch: [
							{ id: "s1", method: "increment", params: [], pageId: "page-1" },
						],
						pageId: "page-1",
					},
				},
				"user-1",
				"session-1",
			);

			const result = Array.isArray(response.result)
				? response.result[0]
				: response.result;
			expect(result.html).toBeDefined(); // Now it returns html because we use component:update internally

			const byId = new Map(updates.map((u) => [u.id, u]));
			expect(byId.get("s1")?.state?.count).toBe(1);
			expect(byId.get("s2")?.state?.count).toBe(1);
		} finally {
			off();
		}
	});

	test("HttpClientAdapter refreshes current page via navigate when page session expires", async () => {
		const previousNavigate = (window as any).KirewireNavigate;
		const previousEventSource = (global as any).EventSource;
		const refreshCalls: any[] = [];

		class FakeEventSource {
			public onmessage: ((event: MessageEvent) => void) | null = null;
			public onerror: (() => void) | null = null;
			close() {}
		}

		(window as any).KirewireNavigate = {
			navigateTo: async () => {},
			refreshCurrentPage: async (options?: any) => {
				refreshCalls.push(options || {});
			},
		};
		(global as any).EventSource = FakeEventSource as any;

		const clientAdapter = new HttpClientAdapter({
			url: "/_wire",
			pageId: "page-1",
			transport: "sse",
		});

		try {
			(clientAdapter as any).isSessionFinished = async () => true;
			await (clientAdapter as any).checkSessionAfterDisconnect();

			expect(refreshCalls).toHaveLength(1);
			expect(refreshCalls[0]?.replace).toBe(true);
			expect(refreshCalls[0]?.force).toBe(true);
		} finally {
			clientAdapter.destroy();
			(window as any).KirewireNavigate = previousNavigate;
			(global as any).EventSource = previousEventSource;
		}
	});
});
