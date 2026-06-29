import type { Broadcaster, ServerPush } from "../contracts";

export type PushSubscriber = (push: ServerPush) => void;

/**
 * In-memory broadcaster + subscription registry. Components call
 * `kirewire.broadcaster.publish(...)` (via `$broadcast`); SSE/WebSocket hubs
 * subscribe to receive frames and forward them to connected clients. Swap this
 * for a Redis/NATS-backed implementation to broadcast across multiple servers.
 */
export class Hub implements Broadcaster {
	private readonly byChannel = new Map<string, Set<PushSubscriber>>();

	publish(push: ServerPush): void {
		for (const sub of this.byChannel.get(push.channel) ?? []) sub(push);
	}

	/** Subscribe to a channel; returns an unsubscribe function. */
	subscribe(channel: string, subscriber: PushSubscriber): () => void {
		let set = this.byChannel.get(channel);
		if (!set) this.byChannel.set(channel, (set = new Set()));
		set.add(subscriber);
		return () => {
			set!.delete(subscriber);
			if (set!.size === 0) this.byChannel.delete(channel);
		};
	}

	channelCount(): number {
		return this.byChannel.size;
	}
}
