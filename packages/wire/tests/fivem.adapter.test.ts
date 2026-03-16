import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { FiveMAdapter } from "../src/adapters/fivem";
import { Component } from "../src/component";
import { Kirewire } from "../src/kirewire";

class CounterComponent extends Component {
	public count = 0;

	public async increment() {
		this.count += 1;
	}

	public async _secret() {
		this.count += 99;
	}

	render() {
		return `<div class="counter-value">Count: ${this.count}</div>` as any;
	}
}

describe("FiveMAdapter", () => {
	let wire: Kirewire | null = null;
	let adapter: FiveMAdapter | null = null;
	let offPush: (() => void) | null = null;
	let pushes: any[] = [];

	beforeEach(() => {
		pushes = [];
		offPush = null;
		wire = null;
		adapter = null;
	});

	afterEach(async () => {
		if (offPush) offPush();
		if (adapter) adapter.destroy();
		if (wire) await wire.destroy();
	});

	function createHarness(
		options: ConstructorParameters<typeof FiveMAdapter>[0] = {},
	) {
		const kire = new Kire();
		const nextWire = new Kirewire({ secret: "fivem-adapter-secret" });
		const nextAdapter = new FiveMAdapter({ route: "/_wire", ...options });
		nextAdapter.install(nextWire, kire);

		offPush = nextWire.on("fivem:push", (packet) => {
			pushes.push(packet);
		});

		wire = nextWire;
		adapter = nextAdapter;
		return { wire: nextWire, adapter: nextAdapter };
	}

	test("processes call messages and emits update/response packets", async () => {
		const { wire, adapter } = createHarness();
		const page = wire.sessions.getPage("player-1", "page-1");
		const instance = new CounterComponent() as any;
		instance.$id = "c1";
		page.components.set("c1", instance);

		await adapter.onMessage("42", "player-1", "session-1", {
			event: "call",
			payload: {
				id: "c1",
				method: "increment",
				params: [],
				pageId: "page-1",
				requestId: "req-1",
			},
		});

		expect(instance.count).toBe(1);

		const updatePacket = pushes.find((packet) => packet.event === "update");
		const responsePacket = pushes.find((packet) => packet.event === "response");

		expect(updatePacket).toBeDefined();
		expect(updatePacket?.channel).toBe("kirewire:push");
		expect(updatePacket?.userId).toBe("player-1");

		expect(responsePacket).toBeDefined();
		expect(responsePacket?.sourceId).toBe("42");
		expect(responsePacket?.data?.requestId).toBe("req-1");
		expect(responsePacket?.data?.result?.state?.count).toBe(1);
	});

	test("returns error response for private methods", async () => {
		const { wire, adapter } = createHarness();
		const page = wire.sessions.getPage("player-2", "page-2");
		const instance = new CounterComponent() as any;
		instance.$id = "c2";
		page.components.set("c2", instance);

		await adapter.onMessage("77", "player-2", "session-2", {
			event: "call",
			payload: {
				id: "c2",
				method: "_secret",
				params: [],
				pageId: "page-2",
				requestId: "req-private",
			},
		});

		const responsePacket = pushes.find((packet) => packet.event === "response");
		expect(responsePacket).toBeDefined();
		expect(responsePacket?.data?.requestId).toBe("req-private");
		expect(String(responsePacket?.data?.error || "")).toContain(
			'Method "_secret" is not callable.',
		);
		expect(instance.count).toBe(0);
	});

	test("onNetMessage resolves identity from source id", async () => {
		const { wire, adapter } = createHarness({
			resolveIdentity: (sourceId) => ({
				userId: `player-${sourceId}`,
				sessionId: `session-${sourceId}`,
			}),
		});

		const page = wire.sessions.getPage("player-99", "page-99");
		const instance = new CounterComponent() as any;
		instance.$id = "c99";
		page.components.set("c99", instance);

		await adapter.onNetMessage(99, {
			event: "call",
			payload: {
				id: "c99",
				method: "increment",
				params: [],
				pageId: "page-99",
				requestId: "req-net",
			},
		});

		const responsePacket = pushes.find((packet) => packet.event === "response");
		expect(responsePacket).toBeDefined();
		expect(responsePacket?.userId).toBe("player-99");
		expect(responsePacket?.sourceId).toBe("99");
		expect(instance.count).toBe(1);
	});

	test("blocks unauthorized $set property updates", async () => {
		const { wire, adapter } = createHarness();
		const page = wire.sessions.getPage("player-3", "page-3");
		const instance = new CounterComponent() as any;
		instance.$id = "c3";
		page.components.set("c3", instance);

		await adapter.onMessage("13", "player-3", "session-3", {
			event: "call",
			payload: {
				id: "c3",
				method: "$set",
				params: ["isAdmin", true],
				pageId: "page-3",
				requestId: "req-set",
			},
		});

		const responsePacket = pushes.find((packet) => packet.event === "response");
		expect(responsePacket).toBeDefined();
		expect(responsePacket?.data?.requestId).toBe("req-set");
		expect(String(responsePacket?.data?.error || "")).toContain(
			'Property "isAdmin" is not writable.',
		);
		expect((instance as any).isAdmin).toBeUndefined();
	});
});
