import type { Kire } from "kire";
import type { UpdateRequest } from "../contracts";
import type { Kirewire } from "../kirewire";
import type { Hub } from "./hub";

/** Abstraction over a duplex WebSocket connection. */
export interface WsConnection {
	send(data: string): void;
	onMessage(cb: (data: string) => void): void;
	onClose(cb: () => void): void;
}

export interface WsOptions {
	/** Channel this socket subscribes to for server pushes. */
	channel?: string;
	/** Per-message request-scoped Kire fork factory. */
	engineFactory?: () => Kire<boolean>;
}

/**
 * Wire a WebSocket connection to Kirewire: incoming `{ id, request }` frames are
 * handled and answered with `{ id, response }`; pushes on the subscribed channel
 * arrive as `{ push }`. Mirrors the client {@link WebSocketTransport} framing.
 */
export function serveWs(
	kirewire: Kirewire,
	hub: Hub,
	conn: WsConnection,
	options: WsOptions = {},
): void {
	conn.onMessage(async (data) => {
		let msg: { id: number; request: UpdateRequest };
		try {
			msg = JSON.parse(data);
		} catch {
			return;
		}
		if (!msg.request) return;
		const response = await kirewire.handle(msg.request, options.engineFactory?.());
		conn.send(JSON.stringify({ id: msg.id, response }));
	});

	if (options.channel) {
		const unsubscribe = hub.subscribe(options.channel, (push) => {
			conn.send(JSON.stringify({ push }));
		});
		conn.onClose(unsubscribe);
	}
}
