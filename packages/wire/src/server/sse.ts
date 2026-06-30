import type { Hub } from "./hub";

/** Abstraction over a one-way Server-Sent Events connection. */
export interface SseConnection {
	/** Write a raw SSE frame (caller is responsible for `data:`/`\n\n` already). */
	write(frame: string): void;
	/** Register a callback for when the client disconnects. */
	onClose(cb: () => void): void;
}

/**
 * Bridge a subscribed channel to an SSE connection: every {@link ServerPush}
 * published to `channel` is serialized as an SSE `data:` frame. Returns an
 * unsubscribe function (also fired automatically on disconnect).
 */
export function serveSse(
	hub: Hub,
	channel: string,
	conn: SseConnection,
): () => void {
	const unsubscribe = hub.subscribe(channel, (push) => {
		conn.write(`data: ${JSON.stringify(push)}\n\n`);
	});
	conn.onClose(unsubscribe);
	return unsubscribe;
}

/** Standard SSE response headers. */
export const SSE_HEADERS = {
	"content-type": "text/event-stream",
	"cache-control": "no-cache",
	connection: "keep-alive",
} as const;
