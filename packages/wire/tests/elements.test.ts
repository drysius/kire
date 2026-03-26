import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { Component } from "../src/component";
import { KirewirePlugin } from "../src/index";

function createKire() {
	const kire = new Kire({ silent: true }) as any;
	kire.plugin(
		new KirewirePlugin({
			secret: "elements-test-secret",
		}) as any,
	);
	return kire;
}

describe("Kirewire custom elements", () => {
	test("<wire:*> mounts a registered component and maps attrs to locals", async () => {
		class ChatRoom extends Component {
			public roomId = "";
			public enabled = false;

			render() {
				return `room=${this.roomId};enabled=${String(this.enabled)}` as any;
			}
		}

		const kire = createKire();
		kire.wired("chat-room", ChatRoom as any);

		const html = await kire.render(
			'<wire:chat-room room-id="{{ room.id }}" enabled />',
			{
				room: { id: 7 },
			},
		);

		expect(String(html)).toContain("room=7");
		expect(String(html)).toContain("enabled=true");
		expect(String(html)).toContain('wire:id="');
		expect(String(html)).toContain("wire:state='");
	});

	test("livewire and kirewire tags resolve namespace fallbacks", async () => {
		class StatsPanel extends Component {
			render() {
				return "components-panel" as any;
			}
		}

		class ChatBox extends Component {
			render() {
				return "kirewire-panel" as any;
			}
		}

		const kire = createKire();
		kire.wired("components.stats-panel", StatsPanel as any);
		kire.wired("kirewire.chat-box", ChatBox as any);

		const livewireHtml = await kire.render("<livewire:stats-panel />");
		const kirewireHtml = await kire.render("<kirewire:chat-box />");

		expect(String(livewireHtml)).toContain("components-panel");
		expect(String(kirewireHtml)).toContain("kirewire-panel");
	});

	test("mount aliases preserve bound, interpolated and boolean props", async () => {
		class RoomPanel extends Component {
			public roomId = "";
			public limit = 0;
			public compact = false;

			render() {
				return `${this.roomId}:${this.limit}:${String(this.compact)}` as any;
			}
		}

		const kire = createKire();
		kire.wired("components.room-panel", RoomPanel as any);

		const livewireHtml = await kire.render(
			'<livewire:room-panel room-id="{{ room.id }}" :limit="25" compact />',
			{
				room: { id: 42 },
			},
		);
		const wireHtml = await kire.render(
			'<wire:room-panel room-id="{{ room.id }}" :limit="25" compact />',
			{
				room: { id: 42 },
			},
		);

		expect(String(livewireHtml)).toContain("42:25:true");
		expect(String(wireHtml)).toContain("42:25:true");
	});
});
