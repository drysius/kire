import type { WireAdapter } from "../kirewire";
import { Kirewire } from "../kirewire";
import { syncModelElements } from "../utils/model-sync";

type FiveMClientAdapterOptions = {
	url: string;
	pageId: string;
	sessionId?: string;
	uploadUrl?: string;
	transport?: string;
	callbackName?: string;
	resourceName?: string;
	requestTimeoutMs?: number;
	httpFallback?: boolean;
	createRequest?: (callbackName: string, payload: any) => Promise<any>;
};

type NormalizedOptions = {
	url: string;
	pageId: string;
	sessionId: string;
	uploadUrl: string;
	transport: string;
	callbackName: string;
	resourceName: string;
	requestTimeoutMs: number;
	httpFallback: boolean;
};

type PendingRequest = {
	resolve: (value: any) => void;
	reject: (reason?: any) => void;
	timer: ReturnType<typeof setTimeout>;
	fallbackTimer?: ReturnType<typeof setTimeout>;
};

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, "");
}

function resolveUploadUrl(baseUrl: string, uploadUrl?: string): string {
	if (uploadUrl) return uploadUrl;
	return `${trimTrailingSlash(baseUrl)}/upload`;
}

function resolveResourceName(explicit?: string): string {
	if (explicit) return String(explicit);

	const maybeGetter = (window as any).GetParentResourceName;
	if (typeof maybeGetter === "function") {
		try {
			const value = String(maybeGetter() || "").trim();
			if (value) return value;
		} catch {}
	}

	return "kirewire";
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

export class FiveMClientAdapter implements WireAdapter {
	private options: NormalizedOptions;
	private pendingByRequest = new Map<string, PendingRequest>();
	private lastRevisionByComponent = new Map<string, number>();
	private requestSeq = 0;
	private messageListener: ((event: MessageEvent) => void) | null = null;

	constructor(options: FiveMClientAdapterOptions) {
		this.options = {
			url: options.url || "/_wire",
			pageId: options.pageId || "default-page",
			sessionId: String(options.sessionId || "guest"),
			uploadUrl: resolveUploadUrl(options.url || "/_wire", options.uploadUrl),
			transport: options.transport || "fivem",
			callbackName: String(options.callbackName || "kirewire_call"),
			resourceName: resolveResourceName(options.resourceName),
			requestTimeoutMs: Math.max(
				1_000,
				Number(options.requestTimeoutMs || 15_000),
			),
			httpFallback: options.httpFallback === true,
		};

		this.createRequest = options.createRequest || this.createNuiRequest;

		Kirewire.pageId = this.options.pageId;
		this.setup();
	}

	private createRequest: (callbackName: string, payload: any) => Promise<any>;

	public async call(componentId: string, method: string, params: any[] = []) {
		const id = String(componentId || "").trim();
		const action = String(method || "").trim();
		const actionParams = Array.isArray(params) ? params : [];
		if (!id) throw new Error("Component id is required.");
		if (!action) throw new Error("Action method is required.");

		if (this.options.transport !== "fivem") {
			return this.callViaHttp(id, action, actionParams);
		}

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
						`FiveM request timed out after ${this.options.requestTimeoutMs}ms.`,
					),
				);
			}, this.options.requestTimeoutMs);

			const fallbackTimer = this.options.httpFallback
				? setTimeout(() => {
						const pending = this.pendingByRequest.get(requestId);
						if (!pending) return;
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

			void this.createRequest(this.options.callbackName, envelope)
				.then((ack) => {
					// Some bridges resolve directly with response payload, others return only an ACK.
					this.handleBridgeAck(ack);
				})
				.catch((error) => {
					const pending = this.pendingByRequest.get(requestId);
					if (!pending) return;
					this.pendingByRequest.delete(requestId);
					clearTimeout(pending.timer);
					if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);
					pending.reject(error);
				});
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
		this.messageListener = (event: MessageEvent) => {
			const data = event?.data;
			if (!data || typeof data !== "object") return;
			if ((data as any).__kirewire !== true) return;

			const eventName = String((data as any).event || "").trim();
			const payload = (data as any).payload;
			if (!eventName) return;

			if (eventName === "response") {
				this.resolveBridgeResponse(payload);
				return;
			}

			if (eventName === "update") {
				this.applyComponentUpdate(payload);
				return;
			}
		};

		window.addEventListener("message", this.messageListener);
	}

	public reconfigure(next: Partial<FiveMClientAdapterOptions>) {
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
		const nextCallbackName = next.callbackName
			? String(next.callbackName)
			: current.callbackName;
		const nextResourceName = next.resourceName
			? String(next.resourceName)
			: current.resourceName;

		this.options = {
			url: nextUrl,
			pageId: nextPageId,
			sessionId: nextSessionId,
			uploadUrl: nextUploadUrl,
			transport: nextTransport,
			callbackName: nextCallbackName,
			resourceName: nextResourceName,
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
	}

	public abortAllRequests() {
		const ids = Array.from(this.pendingByRequest.keys());
		for (let i = 0; i < ids.length; i++) {
			const id = ids[i]!;
			const pending = this.pendingByRequest.get(id);
			if (!pending) continue;
			clearTimeout(pending.timer);
			if (pending.fallbackTimer) clearTimeout(pending.fallbackTimer);
			pending.reject(new Error("FiveM request cancelled."));
			this.pendingByRequest.delete(id);
		}
	}

	public destroy() {
		this.destroyed = true;
		if (this.messageListener) {
			window.removeEventListener("message", this.messageListener);
			this.messageListener = null;
		}
		this.abortAllRequests();
	}

	private createNuiRequest = async (
		callbackName: string,
		payload: any,
	): Promise<any> => {
		const response = await fetch(
			`https://${this.options.resourceName}/${callbackName}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json; charset=UTF-8" },
				body: JSON.stringify(payload || {}),
			},
		);

		const text = await response.text();
		if (!text) return null;

		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	};

	private createRequestId() {
		this.requestSeq += 1;
		return `${Date.now()}-${this.requestSeq}`;
	}

	private handleBridgeAck(ack: any) {
		if (!ack || typeof ack !== "object") return;

		const event = String((ack as any).event || "").trim();
		if (event === "response") {
			this.resolveBridgeResponse((ack as any).payload);
			return;
		}

		const requestId = String((ack as any).requestId || "");
		if (!requestId) return;
		this.resolveBridgeResponse(ack);
	}

	private resolveBridgeResponse(payload: any) {
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
