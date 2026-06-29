import { describe, expect, test } from "bun:test";
import { LiveComponent } from "../src/component";
import type { ServerPush } from "../src/contracts";
import { Component, prop } from "../src/decorators";
import { Kirewire } from "../src/kirewire";
import { handleUpdate } from "../src/server/http";
import { Hub } from "../src/server/hub";
import { type SseConnection, serveSse } from "../src/server/sse";
import { serveWs, type WsConnection } from "../src/server/ws";

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
	const hub = new Hub();
	const wire = new Kirewire({ secret: "s", broadcaster: hub });
	wire.component(Counter);
	return { wire, hub };
}

describe("Hub broadcast", () => {
	test("fans pushes out to channel subscribers only", () => {
		const hub = new Hub();
		const a: ServerPush[] = [];
		const b: ServerPush[] = [];
		const unsubA = hub.subscribe("room:1", (p) => a.push(p));
		hub.subscribe("room:2", (p) => b.push(p));

		hub.publish({ v: 1, channel: "room:1", effects: { html: "x" } });
		expect(a.length).toBe(1);
		expect(b.length).toBe(0);

		unsubA();
		hub.publish({ v: 1, channel: "room:1", effects: { html: "y" } });
		expect(a.length).toBe(1);
		expect(hub.channelCount()).toBe(1);
	});

	test("$broadcast from a component reaches subscribers", async () => {
		const { wire, hub } = server();
		const received: ServerPush[] = [];
		hub.subscribe("room:1", (p) => received.push(p));

		// A component method that broadcasts.
		class Broadcaster extends Counter {
			ping() {
				this.$broadcast?.("room:1", {
					dispatches: [{ event: "pinged", params: [] }],
				});
			}
		}
		wire.component("broadcaster", Broadcaster);
		const { snapshot } = await wire.mount("broadcaster");
		await wire.update({
			snapshot,
			updates: {},
			calls: [{ method: "ping", params: [] }],
		});

		expect(received.length).toBe(1);
		expect(received[0]!.channel).toBe("room:1");
		expect(received[0]!.effects.dispatches?.[0]?.event).toBe("pinged");
	});
});

describe("handleUpdate (HTTP core)", () => {
	test("returns 200 + response for a valid request", async () => {
		const { wire } = server();
		const { snapshot } = await wire.mount("counter");
		const res = await handleUpdate(wire, {
			v: 1,
			components: [
				{ snapshot, updates: {}, calls: [{ method: "increment", params: [] }] },
			],
		});
		expect(res.status).toBe(200);
		const body = res.body as unknown as {
			components: Array<{ snapshot: { data: { count: number } } }>;
		};
		expect(body.components[0]!.snapshot.data.count).toBe(1);
	});

	test("returns 400 on malformed body", async () => {
		const { wire } = server();
		expect((await handleUpdate(wire, "not json")).status).toBe(400);
		expect((await handleUpdate(wire, { v: 1 } as never)).status).toBe(400);
	});

	test("returns 419 on a tampered snapshot", async () => {
		const { wire } = server();
		const { snapshot } = await wire.mount("counter");
		snapshot.data.count = 999;
		const res = await handleUpdate(wire, {
			v: 1,
			components: [
				{ snapshot, updates: {}, calls: [{ method: "increment", params: [] }] },
			],
		});
		expect(res.status).toBe(419);
	});
});

describe("WebSocket adapter", () => {
	test("answers a request frame and forwards channel pushes", async () => {
		const { wire, hub } = server();
		const sent: string[] = [];
		let messageCb: ((d: string) => void) | undefined;
		const conn: WsConnection = {
			send: (d) => sent.push(d),
			onMessage: (cb) => (messageCb = cb),
			onClose: () => {},
		};
		serveWs(wire, hub, conn, { channel: "room:1" });

		const { snapshot } = await wire.mount("counter");
		messageCb!(
			JSON.stringify({
				id: 7,
				request: {
					v: 1,
					components: [
						{
							snapshot,
							updates: {},
							calls: [{ method: "increment", params: [] }],
						},
					],
				},
			}),
		);
		await new Promise((r) => setTimeout(r, 5));
		const reply = JSON.parse(sent[0]!);
		expect(reply.id).toBe(7);
		expect(reply.response.components[0].snapshot.data.count).toBe(1);

		hub.publish({ v: 1, channel: "room:1", effects: { html: "x" } });
		const push = JSON.parse(sent[1]!);
		expect(push.push.channel).toBe("room:1");
	});
});

describe("SSE adapter", () => {
	test("writes channel pushes as SSE data frames", () => {
		const hub = new Hub();
		const frames: string[] = [];
		const conn: SseConnection = {
			write: (f) => frames.push(f),
			onClose: () => {},
		};
		serveSse(hub, "room:1", conn);
		hub.publish({ v: 1, channel: "room:1", effects: { html: "x" } });
		expect(frames[0]).toStartWith("data: ");
		expect(JSON.parse(frames[0]!.slice(6)).effects.html).toBe("x");
	});
});
