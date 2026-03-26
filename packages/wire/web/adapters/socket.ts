import type { WireAdapter } from "../kirewire";
import { Kirewire } from "../kirewire";
import { syncModelElements } from "../utils/model-sync";

type SocketClientAdapterOptions = {
	url: string;
	pageId: string;
	sessionId?: string;
	uploadUrl?: string;
	transport?: string;
	socketUrl?: string;
	requestTimeoutMs?: number;
	httpFallback?: boolean;
	createSocket?: (url: string) => SocketClientLike;
};

type NormalizedOptions = {
	url: string;
	pageId: string;
	sessionId: string;
	uploadUrl: string;
	transport: string;
	socketUrl: string;
	requestTimeoutMs: number;
	httpFallback: boolean;
};

type PendingRequest = {
	resolve: (value: any) => void;
	reject: (reason?: any) => void;
	timer: ReturnType<typeof setTimeout>;
	fallbackTimer?: ReturnType<typeof setTimeout>;
};

type SocketClientLike = {
	readyState: number;
	send: (data: string) => void;
	close: (code?: number, reason?: string) => void;
	onopen: ((event: any) => void) | null;
	onmessage: ((event: { data: any }) => void) | null;
	onerror: ((event: any) => void) | null;
	onclose: ((event: any) => void) | null;
};

const SOCKET_CONNECTING = 0;
const SOCKET_OPEN = 1;

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, "");
}

function resolveUploadUrl(baseUrl: string, uploadUrl?: string): string {
	if (uploadUrl) return uploadUrl;
	return `${trimTrailingSlash(baseUrl)}/upload`;
}

function resolveSocketUrl(baseUrl: string, explicitSocketUrl?: string): string {
	const target = explicitSocketUrl || `${trimTrailingSlash(baseUrl)}/socket`;
	const url = new URL(target, window.location.origin);
	url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return url.toString();
}

function withSocketContext(
	socketUrl: string,
	pageId: string,
	sessionId: string,
): string {
	const url = new URL(socketUrl, window.location.origin);
	url.searchParams.set("pageId", String(pageId || "default-page"));
	url.searchParams.set("sessionId", String(sessionId || "guest"));
	return url.toString();
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

function findStreamTarget(
	root: ParentNode,
	target: string,
): HTMLElement | null {
	let element: HTMLElement | null = null;
	try {
		element = root.querySelector(target) as HTMLElement | null;
	} catch {
		element = null;
	}
	if (!element) {
		const value = target.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		try {
			element = root.querySelector(
				`[wire\\:stream="${value}"]`,
			) as HTMLElement | null;
		} catch {
			element = null;
		}
	}
	return element;
}

function snapshotStreams(
	root: HTMLElement,
	effects: any[] | undefined,
): Map<string, string> {
	const snapshots = new Map<string, string>();
	const list = Array.isArray(effects) ? effects : [];

	for (let i = 0; i < list.length; i++) {
		const effect = list[i];
		if (!effect || effect.type !== "stream") continue;

		const targetKey = String(effect.payload?.target || "");
		if (!targetKey || snapshots.has(targetKey)) continue;

		const target = findStreamTarget(root, targetKey);
		if (target) snapshots.set(targetKey, target.innerHTML);
	}

	return snapshots;
}

function restoreStreams(root: HTMLElement, snapshots: Map<string, string>) {
	for (const [targetKey, html] of snapshots.entries()) {
		const target = findStreamTarget(root, targetKey);
		if (target) target.innerHTML = html;
	}
}

export class SocketClientAdapter implements WireAdapter {
	private options: NormalizedOptions;
	private socket: SocketClientLike | null = null;
	private connecting = false;
	private pendingByRequest = new Map<string, PendingRequest>();
	private queuedRawMessages: string[] = [];
	private lastRevisionByComponent = new Map<string, number>();
	private requestSeq = 0;
	private destroyed = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(options: SocketClientAdapterOptions) {
		this.options = {
			url: options.url || "/_wire",
			pageId: options.pageId || "default-page",
			sessionId: String(options.sessionId || "guest"),
			uploadUrl: resolveUploadUrl(options.url || "/_wire", options.uploadUrl),
			transport: options.transport || "socket",
			socketUrl: resolveSocketUrl(options.url || "/_wire", options.socketUrl),
			requestTimeoutMs: Math.max(
				1_000,
				Number(options.requestTimeoutMs || 15_000),
			),
			httpFallback: options.httpFallback === true,
		};

		this.createSocket = options.createSocket || this.createNativeSocket;

		Kirewire.pageId = this.options.pageId;
		this.setup();
	}

	private createSocket: (url: string) => SocketClientLike;

	public async call(componentId: string, method: string, params: any[] = []) {
		const id = String(componentId || "").trim();
		const action = String(method || "").trim();
		const actionParams = Array.isArray(params) ? params : [];
		if (!id) throw new Error("Component id is required.");
		if (!action) throw new Error("Action method is required.");

		if (this.options.transport !== "socket") {
			return this.callViaHttp(id, action, actionParams);
		}

		this.ensureSocket();

		const requestId = this.createRequestId();
		const envelope = {
			event: "call",
			payload: {
				id,
				method: action,
				params: actionParams,
				pageId: this.options.pageId,
				requestId,
			},
		};

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const pending = this.pendingByRequest.get(requestId);
				if (!pending) return;
				this.pendingByRequest.delete(requestId);
				if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);
				reject(
					new Error(
						`Socket request timed out after ${this.options.requestTimeoutMs}ms.`,
					),
				);
			}, this.options.requestTimeoutMs);

			const fallbackTimer = this.options.httpFallback
				? setTimeout(() => {
						const pending = this.pendingByRequest.get(requestId);
						if (!pending) return;
						if (this.socket && this.socket.readyState === SOCKET_OPEN) return;

						this.pendingByRequest.delete(requestId);
						clearTimeout(pending.timer);
						if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);
						void this.callViaHttp(id, action, actionParams)
							.then(resolve)
							.catch(reject);
					}, 180)
				: undefined;

			this.pendingByRequest.set(requestId, {
				resolve,
				reject,
				timer: timeout,
				fallbackTimer,
			});

			const raw = JSON.stringify(envelope);
			if (this.socket && this.socket.readyState === SOCKET_OPEN) {
				this.socket.send(raw);
				return;
			}

			if (this.socket && this.socket.readyState === SOCKET_CONNECTING) {
				this.queuedRawMessages.push(raw);
				return;
			}

			this.ensureSocket();
			if (this.socket && this.socket.readyState === SOCKET_OPEN) {
				this.socket.send(raw);
				return;
			}
			if (this.socket && this.socket.readyState === SOCKET_CONNECTING) {
				this.queuedRawMessages.push(raw);
				return;
			}

			const pending = this.pendingByRequest.get(requestId);
			this.pendingByRequest.delete(requestId);
			clearTimeout(timeout);
			if (pending?.fallbackTimer) clearTimeout(pending.fallbackTimer);

			if (this.options.httpFallback) {
				// Optional compatibility mode for environments without websocket endpoint.
				void this.callViaHttp(id, action, actionParams)
					.then(resolve)
					.catch(reject);
				return;
			}

			reject(
				new Error(
					"Socket transport is enabled but no websocket connection is available.",
				),
			);
		});
	}

	public defer(componentId: string, property: string, value: any) {
		Kirewire.defer(componentId, property, value);
	}

	public upload(
		files: FileList | File[],
		onProgress?: (progress: any) => void,
	): Promise<any> {
		const list = Array.isArray(files) ? files : Array.from(files || []);
		if (list.length === 0) {
			return Promise.reject(new Error("No files to upload."));
		}

		return new Promise((resolve, reject) => {
			const formData = new FormData();
			for (let i = 0; i < list.length; i++) {
				formData.append("files[]", list[i]!);
			}

			const xhr = new XMLHttpRequest();

			if (onProgress) {
				xhr.upload.addEventListener("progress", (event) => {
					if (!event.lengthComputable) return;
					onProgress({
						loaded: event.loaded,
						total: event.total,
						percent: Math.round((event.loaded / event.total) * 100),
						status: "uploading",
					});
				});
			}

			xhr.addEventListener("error", () =>
				reject(new Error("Upload request failed.")),
			);
			xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));
			xhr.addEventListener("load", () => {
				if (xhr.status < 200 || xhr.status >= 300) {
					reject(new Error(xhr.statusText || `Upload failed (${xhr.status}).`));
					return;
				}

				try {
					const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
					resolve(parsed);
				} catch {
					resolve(null);
				}
			});

			xhr.open("POST", this.options.uploadUrl);
			xhr.send(formData);
		});
	}

	public setup() {
		this.ensureSocket();
	}

	public reconfigure(next: Partial<SocketClientAdapterOptions>) {
		const current = this.options;
		const nextUrl = next.url ? String(next.url) : current.url;
		const nextPageId = next.pageId ? String(next.pageId) : current.pageId;
		const nextSessionId = next.sessionId
			? String(next.sessionId)
			: current.sessionId;
		const nextTransport = next.transport
			? String(next.transport)
			: current.transport;
		const nextUploadUrl = next.uploadUrl
			? String(next.uploadUrl)
			: resolveUploadUrl(nextUrl, current.uploadUrl);
		const nextSocketUrl = next.socketUrl
			? resolveSocketUrl(nextUrl, String(next.socketUrl))
			: resolveSocketUrl(nextUrl, current.socketUrl);

		const shouldReconnect =
			nextTransport !== current.transport ||
			nextSocketUrl !== current.socketUrl ||
			nextSessionId !== current.sessionId;

		this.options = {
			url: nextUrl,
			pageId: nextPageId,
			sessionId: nextSessionId,
			uploadUrl: nextUploadUrl,
			transport: nextTransport,
			socketUrl: nextSocketUrl,
			requestTimeoutMs: Math.max(
				1_000,
				Number(next.requestTimeoutMs || current.requestTimeoutMs),
			),
			httpFallback:
				next.httpFallback === undefined
					? current.httpFallback
					: next.httpFallback === true,
		};
		Kirewire.pageId = nextPageId;
		this.lastRevisionByComponent.clear();

		if (shouldReconnect) {
			this.closeSocket();
			this.ensureSocket();
		}
	}

	public abortAllRequests() {
		const ids = Array.from(this.pendingByRequest.keys());
		for (let i = 0; i < ids.length; i++) {
			const id = ids[i]!;
			const pending = this.pendingByRequest.get(id);
			if (!pending) continue;
			clearTimeout(pending.timer);
			if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);
			pending.reject(new Error("Socket request cancelled."));
			this.pendingByRequest.delete(id);
		}
	}

	public destroy() {
		this.destroyed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		this.abortAllRequests();
		this.closeSocket();
	}

	private ensureSocket() {
		if (this.destroyed) return;
		if (this.options.transport !== "socket") return;
		if (this.socket || this.connecting) return;

		this.connecting = true;
		let socket: SocketClientLike;
		try {
			socket = this.createSocket(
				withSocketContext(
					this.options.socketUrl,
					this.options.pageId,
					this.options.sessionId,
				),
			);
		} catch (error) {
			this.connecting = false;
			console.error("[Kirewire] Failed to create socket client:", error);
			return;
		}

		this.socket = socket;
		socket.onopen = () => {
			this.connecting = false;
			this.flushQueuedMessages();
		};
		socket.onmessage = (event) => {
			this.handleSocketMessage(event?.data);
		};
		socket.onerror = () => {
			// Do not fail all requests immediately here; onclose/fallback handles that.
		};
		socket.onclose = () => {
			this.socket = null;
			this.connecting = false;
			if (this.destroyed || this.options.transport !== "socket") return;
			if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
			this.reconnectTimer = setTimeout(() => {
				this.reconnectTimer = null;
				this.ensureSocket();
			}, 350);
		};
	}

	private closeSocket() {
		if (!this.socket) return;
		try {
			this.socket.close();
		} catch {}
		this.socket = null;
		this.connecting = false;
		this.queuedRawMessages = [];
	}

	private createNativeSocket = (url: string): SocketClientLike => {
		if (typeof WebSocket === "undefined") {
			throw new Error("WebSocket is not available in this environment.");
		}
		return new WebSocket(url) as unknown as SocketClientLike;
	};

	private createRequestId() {
		this.requestSeq += 1;
		return `${Date.now()}-${this.requestSeq}`;
	}

	private flushQueuedMessages() {
		if (!this.socket || this.socket.readyState !== SOCKET_OPEN) return;
		if (this.queuedRawMessages.length === 0) return;

		const queued = [...this.queuedRawMessages];
		this.queuedRawMessages = [];
		for (let i = 0; i < queued.length; i++) {
			try {
				this.socket.send(queued[i]!);
			} catch {
				// Leave the request timeout to reject unresolved calls.
			}
		}
	}

	private handleSocketMessage(raw: any) {
		let envelope: any;
		try {
			envelope = typeof raw === "string" ? JSON.parse(raw) : raw;
		} catch {
			return;
		}

		const event = String(envelope?.event || "").trim();
		const payload = envelope?.payload;
		if (!event) return;

		if (event === "update") {
			this.applyComponentUpdate(payload);
			return;
		}

		if (event === "response") {
			this.resolveSocketResponse(payload);
			return;
		}
	}

	private resolveSocketResponse(payload: any) {
		const requestId = String(payload?.requestId || "");
		if (!requestId) return;

		const pending = this.pendingByRequest.get(requestId);
		if (!pending) return;
		this.pendingByRequest.delete(requestId);
		clearTimeout(pending.timer);
		if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);

		const error = payload?.error;
		if (error) {
			pending.reject(new Error(String(error)));
			return;
		}

		const result = payload?.result ?? payload?.results ?? payload;
		if (Array.isArray(result)) {
			this.applyBatchUpdates(result);
			pending.resolve(result);
			return;
		}

		if (result && typeof result === "object") {
			this.applyComponentUpdate(result);
		}

		pending.resolve(result);
	}

	private async callViaHttp(
		componentId: string,
		method: string,
		params: any[],
	) {
		const endpoint = new URL(
			this.options.url,
			window.location.origin,
		).toString();
		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "same-origin",
			body: JSON.stringify({
				id: componentId,
				method,
				params,
				pageId: this.options.pageId,
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP fallback failed (${response.status}).`);
		}

		const result = await response.json();
		this.applyBatchUpdates(toArray(result));
		return Array.isArray(result) ? result[result.length - 1] : result;
	}

	private applyBatchUpdates(results: any[]) {
		const processedIds = new Set<string>();

		for (let i = results.length - 1; i >= 0; i--) {
			const item = results[i];
			if (!item || item.error) continue;

			const id = String(item.id || "");
			if (!id || processedIds.has(id)) continue;

			this.applyComponentUpdate(item);
			processedIds.add(id);
		}
	}

	private applyComponentUpdate(payload: any) {
		const id = String(payload?.id || "");
		if (!id) return;

		const revision = Number(payload?.revision);
		if (Number.isFinite(revision)) {
			const lastRevision = this.lastRevisionByComponent.get(id) ?? 0;
			if (revision <= lastRevision) return;
			this.lastRevisionByComponent.set(id, revision);
		}

		const root = this.findComponentRoot(id);

		if (root) {
			if (payload.state !== undefined) {
				root.setAttribute("wire:state", JSON.stringify(payload.state));
			} else {
				root.removeAttribute("wire:state");
			}
			root.removeAttribute("wire:checksum");
		}

		let nextRoot = root;
		if (root && typeof payload?.html === "string" && payload.html.length > 0) {
			const snapshots = snapshotStreams(root, payload.effects);

			Kirewire.patch(root, payload.html);

			nextRoot = this.findComponentRoot(id);
			if (nextRoot) {
				restoreStreams(nextRoot, snapshots);
			}
		}

		if (nextRoot && payload.state && typeof payload.state === "object") {
			syncModelElements(nextRoot, payload.state);
		}

		if (Array.isArray(payload?.effects)) {
			Kirewire.processEffects(payload.effects, id);
		}

		Kirewire.emitSync("component:update", {
			id,
			state: payload?.state || {},
			html: payload?.html || "",
			effects: Array.isArray(payload?.effects) ? payload.effects : [],
		});
	}

	private findComponentRoot(componentId: string): HTMLElement | null {
		try {
			const direct = document.querySelector(
				`[wire\\:id="${componentId}"], [wire-id="${componentId}"]`,
			) as HTMLElement | null;
			if (direct) return direct;
		} catch {
			// Fallback below handles selectors engines with limited ":" support.
		}

		const nodes = document.querySelectorAll("*");
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i] as HTMLElement;
			if (!node || typeof node.getAttribute !== "function") continue;
			const wireId =
				node.getAttribute("wire:id") || node.getAttribute("wire-id");
			if (wireId === componentId) return node;
		}
		return null;
	}
}
