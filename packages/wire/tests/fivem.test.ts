import { describe, expect, test } from "bun:test";
import { LiveComponent } from "../src/component";
import { Component, prop } from "../src/decorators";
import { Kirewire } from "../src/kirewire";
import { createFiveMHandler, FiveMBroadcaster } from "../src/server/fivem";
import { FiveMTransport } from "../src/client/transport";
import type { ServerPush } from "../src/contracts";

@Component("counter")
class Counter extends LiveComponent {
	@prop count = 0;
	increment() {
		this.count++;
	}
	render() {
		return `<div>${this.count}</div>`;
	}
}

function server() {
	const w = new Kirewire({ secret: "s" });
	w.component(Counter);
	return w;
}

describe("FiveM server bridge", () => {
	test("createFiveMHandler runs the pipeline and returns via the NUI callback", async () => {
		const wire = server();
		const { snapshot } = await wire.mount("counter");
		const handler = createFiveMHandler(wire);

		const response = await new Promise<{ components: Array<{ snapshot: { data: { count: number } } }> }>(
			(resolve) => {
				handler(
					{ v: 1, components: [{ snapshot, updates: {}, calls: [{ method: "increment", params: [] }] }] },
					(res) => resolve(res as never),
				);
			},
		);
		expect(response.components[0]!.snapshot.data.count).toBe(1);
	});

	test("FiveMBroadcaster pushes a SendNuiMessage frame", () => {
		const sent: string[] = [];
		const hub = new FiveMBroadcaster((json) => sent.push(json));
		hub.publish({ v: 1, channel: "room:1", effects: { html: "x" } } satisfies ServerPush);
		expect(sent).toHaveLength(1);
		const frame = JSON.parse(sent[0]!);
		expect(frame.type).toBe("kirewire:push");
		expect(frame.push.channel).toBe("room:1");
	});
});

describe("FiveM client transport", () => {
	test("send POSTs to the NUI resource URL and returns the JSON response", async () => {
		const calls: Array<{ url: string; body: unknown }> = [];
		(globalThis as Record<string, unknown>).GetParentResourceName = () => "my-resource";
		(globalThis as Record<string, unknown>).fetch = async (url: string, init: { body: string }) => {
			calls.push({ url, body: JSON.parse(init.body) });
			return { ok: true, json: async () => ({ v: 1, components: [] }) } as never;
		};

		const transport = new FiveMTransport();
		const res = await transport.send({ v: 1, components: [] });

		expect(calls[0]!.url).toBe("https://my-resource/_wire");
		expect(res.v).toBe(1);
	});
});
