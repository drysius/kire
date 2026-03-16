import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { Kire } from "kire";
import { HttpAdapter } from "../src/adapters/http";
import { Component } from "../src/component";
import { Kirewire } from "../src/kirewire";
import { KirewireClient } from "../web/kirewire";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
	url: "http://localhost/",
	pretendToBeVisual: true,
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).HTMLTemplateElement = dom.window.HTMLTemplateElement;
(global as any).Node = dom.window.Node;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).Event = dom.window.Event;
(global as any).MutationObserver = dom.window.MutationObserver;
(global as any).DOMParser = dom.window.DOMParser;
(global as any).navigator = dom.window.navigator;

describe("wire:collection", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	test("client applies state collection patches to proxy state", () => {
		const wire = new KirewireClient();

		document.body.innerHTML = `
            <div id="root" wire:id="cmp-1" wire:state='{"entries":[{"id":1,"text":"first"}]}'>
                <template wire:collection="entries"></template>
            </div>
        `;

		const root = document.getElementById("root") as HTMLElement;
		const proxy = (wire as any).createProxy("cmp-1", root);
		wire.components.set("cmp-1", proxy);

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "entries",
						action: "append",
						items: [{ id: 2, text: "second" }],
						key: "id",
					},
				},
			],
			"cmp-1",
		);

		expect(proxy.entries).toHaveLength(2);
		expect(proxy.entries[1]).toEqual({ id: 2, text: "second" });

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "entries",
						action: "upsert",
						items: [{ id: 2, text: "updated" }],
						key: "id",
						position: "prepend",
					},
				},
			],
			"cmp-1",
		);

		expect(proxy.entries[0]).toEqual({ id: 2, text: "updated" });

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "entries",
						action: "remove",
						keys: [1],
						key: "id",
					},
				},
			],
			"cmp-1",
		);

		expect(proxy.entries.map((entry: any) => entry.id)).toEqual([2]);
	});

	test("client applies DOM collection patches with keyed fragments", () => {
		const wire = new KirewireClient();

		document.body.innerHTML = `
            <div id="root" wire:id="cmp-2" wire:state='{}'>
                <div wire:collection="logs"></div>
            </div>
        `;

		const root = document.getElementById("root") as HTMLElement;
		const proxy = (wire as any).createProxy("cmp-2", root);
		wire.components.set("cmp-2", proxy);

		const target = root.firstElementChild as HTMLElement;

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "logs",
						mode: "dom",
						action: "append",
						key: "log-1",
						content: '<div data-wire-collection-key="log-1">alpha</div>',
					},
				},
			],
			"cmp-2",
		);

		expect(target.textContent).toContain("alpha");

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "logs",
						mode: "dom",
						action: "append",
						key: "log-1",
						content: '<div data-wire-collection-key="log-1">ignored</div>',
					},
				},
			],
			"cmp-2",
		);

		expect(target.querySelectorAll("[data-wire-collection-key]").length).toBe(
			1,
		);

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "logs",
						mode: "dom",
						action: "upsert",
						key: "log-1",
						content: '<div data-wire-collection-key="log-1">beta</div>',
					},
				},
			],
			"cmp-2",
		);

		expect(target.textContent).toContain("beta");

		wire.processEffects(
			[
				{
					type: "collection",
					payload: {
						name: "logs",
						mode: "dom",
						action: "remove",
						keys: ["log-1"],
					},
				},
			],
			"cmp-2",
		);

		expect(target.querySelectorAll("[data-wire-collection-key]").length).toBe(
			0,
		);
	});

	test("server can skip html and emit collection effects", async () => {
		class CollectionComponent extends Component {
			public entries: Array<{ id: number; text: string }> = [];

			add() {
				const entry = { id: 1, text: "hello" };
				this.entries = [entry];
				this.prependToCollection("entries", entry, { key: "id" });
				this.$skipRender();
			}

			render() {
				return '<div wire:collection="entries"></div>' as any;
			}
		}

		const kire = new Kire();
		const wire = new Kirewire({ secret: "collection-secret" });
		const adapter = new HttpAdapter();
		adapter.install(wire, kire);
		wire.components.set("collection", CollectionComponent as any);

		const page = wire.sessions.getPage("user-1", "page-1");
		const instance = new CollectionComponent() as any;
		instance.$id = "collection-1";
		instance.$kire = kire;
		page.components.set("collection-1", instance);

		const response = await adapter.handleRequest(
			{
				method: "POST",
				url: "/_wire",
				body: {
					batch: [
						{ id: "collection-1", method: "add", params: [], pageId: "page-1" },
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
		expect(result.html).toBe("");
		expect(result.state.entries).toEqual([{ id: 1, text: "hello" }]);
		expect(result.effects).toContainEqual({
			type: "collection",
			payload: {
				name: "entries",
				mode: "state",
				path: "entries",
				action: "prepend",
				items: [{ id: 1, text: "hello" }],
				key: "id",
				limit: undefined,
			},
		});
	});
});
