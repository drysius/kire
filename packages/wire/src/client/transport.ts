import type {
	ServerPush,
	Transport,
	UpdateRequest,
	UpdateResponse,
} from "../contracts";

/** HTTP transport: POSTs a batched update and awaits the response. No push. */
export class HttpTransport implements Transport {
	constructor(
		private readonly url = "/_wire",
		private readonly token?: string,
	) {}

	async send(req: UpdateRequest): Promise<UpdateResponse> {
		const res = await fetch(this.url, {
			method: "POST",
			headers: { "content-type": "application/json", "x-kirewire": "1" },
			body: JSON.stringify(this.token ? { ...req, token: this.token } : req),
		});
		if (!res.ok) throw new Error(`Kirewire request failed (${res.status}).`);
		return (await res.json()) as UpdateResponse;
	}
}

/** Server-Sent Events push channel, layered over an HTTP transport for sends. */
export class SseTransport implements Transport {
	private source?: EventSource;
	private readonly listeners = new Set<(p: ServerPush) => void>();

	constructor(
		private readonly http: Transport,
		private readonly channelUrl = "/_wire/sse",
	) {}

	send(req: UpdateRequest): Promise<UpdateResponse> {
		return this.http.send(req);
	}

	subscribe(channel: string, onPush: (p: ServerPush) => void): () => void {
		this.listeners.add(onPush);
		if (!this.source) {
			this.source = new EventSource(
				`${this.channelUrl}?channel=${encodeURIComponent(channel)}`,
			);
			this.source.onmessage = (e) => {
				const push = JSON.parse(e.data) as ServerPush;
				for (const cb of this.listeners) cb(push);
			};
		}
		return () => {
			this.listeners.delete(onPush);
			if (this.listeners.size === 0) {
				this.source?.close();
				this.source = undefined;
			}
		};
	}
}

/** WebSocket transport: duplex; correlates responses by an incrementing id. */
export class WebSocketTransport implements Transport {
	private socket?: WebSocket;
	private seq = 0;
	private readonly pending = new Map<number, (r: UpdateResponse) => void>();
	private readonly listeners = new Set<(p: ServerPush) => void>();

	constructor(private readonly url: string) {}

	private connect(): WebSocket {
		if (this.socket && this.socket.readyState <= 1) return this.socket;
		const socket = new WebSocket(this.url);
		socket.onmessage = (e) => {
			const msg = JSON.parse(e.data) as
				| { id: number; response: UpdateResponse }
				| { push: ServerPush };
			if ("push" in msg) {
				for (const cb of this.listeners) cb(msg.push);
			} else {
				this.pending.get(msg.id)?.(msg.response);
				this.pending.delete(msg.id);
			}
		};
		this.socket = socket;
		return socket;
	}

	send(req: UpdateRequest): Promise<UpdateResponse> {
		const socket = this.connect();
		const id = ++this.seq;
		return new Promise((resolve, reject) => {
			this.pending.set(id, resolve);
			const payload = JSON.stringify({ id, request: req });
			if (socket.readyState === 1) socket.send(payload);
			else
				socket.addEventListener("open", () => socket.send(payload), {
					once: true,
				});
			setTimeout(() => {
				if (this.pending.delete(id))
					reject(new Error("Kirewire socket timeout."));
			}, 30000);
		});
	}

	subscribe(_channel: string, onPush: (p: ServerPush) => void): () => void {
		this.connect();
		this.listeners.add(onPush);
		return () => this.listeners.delete(onPush);
	}
}
