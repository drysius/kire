import { createReadStream, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Adapter } from "../adapter";
import { FileStore } from "../features/file-store";
import { WireProperty } from "../wire-property";

type HandleRequestInput = {
	method: string;
	url: string;
	body?: any;
	signal?: AbortSignal;
};

type ActionPayload = {
	id: string;
	method: string;
	params?: any[];
	pageId?: string;
};

type HttpAdapterOptions = {
	route?: string;
	fileStore?: FileStore;
	tempDir?: string;
	maxUploadBytes?: number;
};

const BLOCKED_SET_PATH_SEGMENTS = new Set([
	"__proto__",
	"constructor",
	"prototype",
]);

function normalizeRoute(route: string): string {
	const value = String(route || "/_wire").trim();
	if (!value) return "/_wire";
	const withSlash = value.startsWith("/") ? value : `/${value}`;
	return withSlash.replace(/\/+$/, "");
}

export class HttpAdapter extends Adapter {
	private static readonly DEFAULT_MAX_UPLOAD_BYTES = 64 * 1024 * 1024; // 64MB
	private static readonly MAX_UPLOAD_ERROR_PREFIX = "KIREWIRE_UPLOAD_TOO_LARGE";
	private static readonly SOCKET_MARKER = "SocketClientAdapter";
	private static readonly HTTP_MARKER = "HttpClientAdapter";
	private static clientScriptCache: string | null = null;
	private route: string;
	private fileStore: FileStore;
	private ownsFileStore: boolean;
	private maxUploadBytes: number;

	constructor(options: HttpAdapterOptions = {}) {
		super();
		this.route = normalizeRoute(options.route || "/_wire");
		this.fileStore =
			options.fileStore ||
			new FileStore(options.tempDir || "node_modules/.kirewire_uploads");
		this.ownsFileStore = !options.fileStore;
		this.maxUploadBytes = this.normalizeMaxUploadBytes(options.maxUploadBytes);
	}

	setup() {
		console.log(`[Kirewire] HttpAdapter active on ${this.route}`);
		this.wire.reference("wire:url", () => this.getClientUrl());
		this.wire.reference("wire:upload-url", () => this.getUploadUrl());
		this.wire.reference("wire:preview-url", () => this.getPreviewUrl());
		this.wire.reference("wire:sse-url", () => `${this.route}/sse`);
		this.wire.reference("wire:session-url", () => `${this.route}/session`);
		this.wire.reference(
			"wire:client-script-url",
			() => `${this.route}/kirewire.js`,
		);
	}

	public getClientUrl() {
		return this.route;
	}

	public getUploadUrl() {
		return `${this.route}/upload`;
	}

	public getPreviewUrl() {
		return `${this.route}/preview`;
	}

	/**
	 * Entry point for requests. Handles single, batch actions or SSE.
	 */
	public async handleRequest(
		req: HandleRequestInput,
		userId: string,
		_sessionId: string,
	) {
		const url = new URL(req.url, "http://localhost");

		if (req.method === "GET" && url.pathname === `${this.route}/kirewire.js`) {
			return this.handleClientScript();
		}

		if (req.method === "POST" && url.pathname === `${this.route}/upload`) {
			return await this.handleUpload(req.body);
		}

		if (req.method === "GET" && url.pathname === `${this.route}/preview`) {
			return this.handlePreview(url);
		}

		if (!this.wire) {
			return {
				status: 500,
				headers: { "Content-Type": "application/json" },
				result: {
					error:
						"HttpAdapter is not installed. Call adapter.install(wire, kire) first.",
				},
			};
		}

		const customRoute = this.wire.matchRoute(req.method, url.pathname);
		if (customRoute) {
			return await this.handleCustomRoute(
				customRoute,
				req,
				url,
				userId,
				_sessionId,
			);
		}

		if (req.method === "GET" && url.pathname === `${this.route}/sse`) {
			const pageId = String(url.searchParams.get("pageId") || "");
			return this.handleSse(req, userId, pageId);
		}

		if (req.method === "GET" && url.pathname === `${this.route}/session`) {
			const pageId = String(url.searchParams.get("pageId") || "");
			return this.handleSessionStatus(userId, pageId);
		}

		if (req.method !== "POST") {
			return { status: 405, result: { error: "Method not allowed" } };
		}

		const reqBody = req.body;
		if (!reqBody)
			return { status: 400, result: { error: "Empty request body" } };

		const actions =
			reqBody.batch && Array.isArray(reqBody.batch) ? reqBody.batch : [reqBody];
		const pageId = String(
			reqBody.pageId || actions[0]?.pageId || "default-page",
		);
		const results: Array<Record<string, any>> = [];
		const modifiedComponents = new Set<string>();
		const preparedComponents = new Set<string>();
		const touchedBroadcastRooms = new Set<string>();
		const modifiedRefs = new Set<string>();

		// 1. Execute all actions in order
		for (let i = 0; i < actions.length; i++) {
			const action = actions[i] as ActionPayload;
			try {
				const { id, method, params } = action;
				const page = this.wire.sessions.getPage(userId, pageId);
				const instance = page.components.get(id) as any;

				if (!instance) {
					console.error(
						`[HttpAdapter] Component ${id} not found for userId=${userId} pageId=${pageId}. Available components in this page:`,
						Array.from(page.components.keys()),
					);
					throw new Error(`Component ${id} not found.`);
				}

				// Reset side effects only once per component in each batch.
				if (!preparedComponents.has(id)) {
					preparedComponents.add(id);
					if (instance.$clearEffects) instance.$clearEffects();
				}

				await this.invokeComponentAction(instance, method, params);

				modifiedComponents.add(id);
				results.push({ id, success: true });
			} catch (e: any) {
				results.push({ id: action?.id, error: e?.message || "Unknown error" });
			}
		}

		// 2. Final render and SSE emit for each modified component
		for (const id of modifiedComponents) {
			const page = this.wire.sessions.getPage(userId, pageId);
			const instance = page.components.get(id) as any;
			if (!instance) continue;

			const payload = await this.renderComponentPayload(id, instance);
			const roomIds = this.getBroadcastRoomIds(instance);
			for (let j = 0; j < roomIds.length; j++)
				touchedBroadcastRooms.add(roomIds[j]);

			// Emit single update per component
			await this.wire.emit("component:update", {
				userId,
				pageId,
				id,
				...payload,
			});
			modifiedRefs.add(this.buildComponentRef(userId, pageId, id));

			for (let i = results.length - 1; i >= 0; i--) {
				if (results[i].id === id && !results[i].error) {
					Object.assign(results[i], {
						effects: instance.__effects,
						state: payload.state,
						html: payload.html,
						revision: payload.revision,
					});
					break;
				}
			}
		}

		// 3. Refresh components bound to changed broadcast rooms
		if (touchedBroadcastRooms.size > 0) {
			await this.emitBroadcastUpdatesForAllPages({
				roomIds: touchedBroadcastRooms,
				skipRefs: modifiedRefs,
			});
		}

		return {
			status: 200,
			headers: { "Content-Type": "application/json" },
			result: reqBody.batch ? results : results[0],
		};
	}

	private async handleCustomRoute(
		route: {
			name: string;
			method: string;
			path: string;
			params: Record<string, string>;
			handler: (ctx: any) => Promise<any> | any;
		},
		req: HandleRequestInput,
		url: URL,
		userId: string,
		sessionId: string,
	) {
		try {
			const output = await route.handler({
				method: req.method,
				path: url.pathname,
				url,
				query: url.searchParams,
				params: route.params,
				body: req.body,
				signal: req.signal,
				userId,
				sessionId,
				wire: this.wire,
				adapter: this,
			});

			if (
				output &&
				typeof output === "object" &&
				("status" in output || "result" in output || "headers" in output)
			) {
				const typed = output as {
					status?: number;
					headers?: Record<string, string>;
					result?: any;
				};
				return {
					status: Number(typed.status || 200),
					headers: typed.headers,
					result: typed.result,
				};
			}

			return {
				status: 200,
				headers: { "Content-Type": "application/json" },
				result: output,
			};
		} catch (error: any) {
			return {
				status: 500,
				headers: { "Content-Type": "application/json" },
				result: {
					route: route.name,
					error: String(error?.message || "Internal error"),
				},
			};
		}
	}

	private async handleUpload(body: any) {
		const files = this.extractFilesFromBody(body);
		if (!files.length) {
			return { status: 400, result: { error: "No files uploaded" } };
		}

		const uploaded: Array<{
			id: string;
			name: string;
			size: number;
			mime: string;
			type: string;
		}> = [];

		for (let i = 0; i < files.length; i++) {
			const raw = files[i]!;
			const file = this.normalizeUploadFile(raw);
			const name = String(file.name || "upload.bin");
			const mime = String(file.mime || "application/octet-stream");
			let buffer: Buffer | null;
			try {
				buffer = await this.readUploadBuffer(file.source, this.maxUploadBytes);
			} catch (error: any) {
				if (this.isUploadTooLargeError(error)) {
					return {
						status: 413,
						result: {
							error: String(error?.message || "Uploaded file is too large."),
						},
					};
				}
				return {
					status: 400,
					result: {
						error: String(error?.message || "Unable to read uploaded file."),
					},
				};
			}

			if (!buffer) {
				return {
					status: 400,
					result: { error: `Unable to read uploaded file "${name}".` },
				};
			}

			const size = buffer.length || Number(file.size || 0);
			let id: string;

			try {
				id = this.fileStore.store(name, buffer);
			} catch (error: any) {
				return {
					status: 500,
					result: {
						error:
							`Failed to store uploaded file "${name}". ${String(error?.message || "")}`.trim(),
					},
				};
			}

			uploaded.push({ id, name, size, mime, type: mime });
		}

		return { status: 200, result: { files: uploaded } };
	}

	private handlePreview(url: URL) {
		const id = String(url.searchParams.get("id") || "").trim();
		if (!id) {
			return {
				status: 400,
				headers: { "Content-Type": "application/json" },
				result: { error: "Preview id is required." },
			};
		}

		const filePath = this.fileStore.get(id);
		if (!filePath || !existsSync(filePath)) {
			return {
				status: 404,
				headers: { "Content-Type": "application/json" },
				result: { error: "Preview file not found." },
			};
		}

		const explicitMime = String(url.searchParams.get("mime") || "").trim();
		const ext = filePath.split(".").pop()?.toLowerCase() || "";
		const typeByExt: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
			pdf: "application/pdf",
			txt: "text/plain; charset=utf-8",
			ogg: "audio/ogg",
			mp3: "audio/mpeg",
			wav: "audio/wav",
			m4a: "audio/mp4",
			mp4: "video/mp4",
			webm: "video/webm",
		};

		return {
			status: 200,
			headers: {
				"Cache-Control": "no-store",
				"Content-Type":
					explicitMime || typeByExt[ext] || "application/octet-stream",
			},
			result: createReadStream(filePath),
		};
	}

	private extractFilesFromBody(body: any): any[] {
		if (!body) return [];
		if (typeof FormData !== "undefined" && body instanceof FormData) {
			return [...body.getAll("files[]"), ...body.getAll("files")].filter(
				Boolean,
			);
		}
		if (body && typeof body === "object") {
			const candidates = [body["files[]"], body.files, body.file];
			const out: any[] = [];
			for (let i = 0; i < candidates.length; i++) {
				const c = candidates[i];
				if (!c) continue;
				if (Array.isArray(c)) {
					for (let j = 0; j < c.length; j++) {
						const item = c[j];
						if (!item) continue;
						if (
							item &&
							typeof item === "object" &&
							"value" in item &&
							(item as any).value
						) {
							out.push((item as any).value);
							continue;
						}
						out.push(item);
					}
					continue;
				}
				if (c && typeof c === "object" && "value" in c && (c as any).value) {
					out.push((c as any).value);
					continue;
				}
				out.push(c);
			}
			return out.filter(Boolean);
		}
		return [];
	}

	private normalizeUploadFile(file: any): {
		name: string;
		mime: string;
		size: number;
		source: any;
	} {
		if (
			file &&
			typeof file === "object" &&
			"value" in file &&
			(file as any).value
		) {
			return this.normalizeUploadFile((file as any).value);
		}

		return {
			name: String(
				(file as any)?.name || (file as any)?.filename || "upload.bin",
			),
			mime: String(
				(file as any)?.type ||
					(file as any)?.mime ||
					(file as any)?.mimetype ||
					"application/octet-stream",
			),
			size: Number((file as any)?.size || 0),
			source: file,
		};
	}

	private async readUploadBuffer(
		file: any,
		maxBytes: number,
	): Promise<Buffer | null> {
		if (!file || typeof file !== "object") return null;

		const enforceLimit = (bytes: number) => {
			if (!Number.isFinite(maxBytes) || maxBytes <= 0) return;
			if (bytes <= maxBytes) return;
			throw new Error(
				`${HttpAdapter.MAX_UPLOAD_ERROR_PREFIX}: Uploaded file exceeds the maximum allowed size (${maxBytes} bytes).`,
			);
		};

		const declaredSize = Number((file as any).size || 0);
		if (Number.isFinite(declaredSize) && declaredSize > 0) {
			enforceLimit(declaredSize);
		}

		if (typeof (file as any).arrayBuffer === "function") {
			const data = await (file as any).arrayBuffer();
			enforceLimit(data?.byteLength || 0);
			return Buffer.from(data);
		}

		if (typeof (file as any).toBuffer === "function") {
			const data = await (file as any).toBuffer();
			const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
			enforceLimit(buffer.length);
			return buffer;
		}

		if (Buffer.isBuffer((file as any).buffer)) {
			enforceLimit((file as any).buffer.length);
			return (file as any).buffer;
		}

		const stream = (file as any).file;
		if (stream && typeof stream[Symbol.asyncIterator] === "function") {
			const chunks: Buffer[] = [];
			let total = 0;
			for await (const chunk of stream as AsyncIterable<any>) {
				let normalized: Buffer | null = null;
				if (Buffer.isBuffer(chunk)) normalized = chunk;
				else if (chunk) normalized = Buffer.from(chunk);
				if (!normalized) continue;

				total += normalized.length;
				enforceLimit(total);
				chunks.push(normalized);
			}
			return chunks.length > 0 ? Buffer.concat(chunks) : null;
		}

		return null;
	}

	private async invokeComponentAction(
		instance: any,
		method: string,
		params: any,
	) {
		const name = String(method || "").trim();
		const callParams = Array.isArray(params) ? params : [];

		if (name === "$set") {
			const property = String(callParams[0] ?? "").trim();
			const value = callParams[1];
			if (!this.isWritableSetPath(instance, property)) {
				throw new Error(`Property "${property}" is not writable.`);
			}
			instance.$set(property, value);
			await this.runUpdatedHooks(instance, property, value);
			return;
		}

		if (name === "$refresh" || name === "$commit") {
			return;
		}

		if (!name) {
			throw new Error("Action method is required.");
		}

		if (name.startsWith("_")) {
			throw new Error(`Method "${name}" is not callable.`);
		}

		if (name.startsWith("$")) {
			throw new Error(`Internal method "${name}" is not callable.`);
		}

		if (typeof instance[name] !== "function") {
			throw new Error(
				`Method "${name}" not found on component ${instance.$id}.`,
			);
		}

		await instance[name](...callParams);
	}

	private isWritableSetPath(instance: any, property: string): boolean {
		const normalized = String(property || "").trim();
		if (!normalized) return false;

		if (typeof instance?.$canSet === "function") {
			try {
				return !!instance.$canSet(normalized);
			} catch {
				return false;
			}
		}

		const segments = normalized
			.split(".")
			.map((part) => part.trim())
			.filter(Boolean);
		if (segments.length === 0) return false;
		for (let i = 0; i < segments.length; i++) {
			if (BLOCKED_SET_PATH_SEGMENTS.has(segments[i]!)) return false;
		}

		const root = segments[0]!;
		const first = root.charCodeAt(0);
		if (first === 36 || first === 95) return false;

		if (typeof instance?.getPublicState === "function") {
			const state = instance.getPublicState();
			return Object.hasOwn(state, root);
		}

		return true;
	}

	private async runUpdatedHooks(instance: any, property: string, value: any) {
		if (!instance || !property) return;

		const callHook = async (hookName: string, args: any[]) => {
			if (!hookName) return;
			const fn = instance[hookName];
			if (typeof fn !== "function") return;
			await fn.apply(instance, args);
		};

		const toStudly = (raw: string) =>
			String(raw || "")
				.split(/[\s._-]+/)
				.filter(Boolean)
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join("");

		const rootProperty = property.split(".")[0] || property;
		const fullPathHook = `updated${toStudly(property)}`;
		const rootHook = `updated${toStudly(rootProperty)}`;

		await callHook(fullPathHook, [value, property]);
		if (rootHook !== fullPathHook) {
			await callHook(rootHook, [value, property]);
		}
		await callHook("updated", [value, property]);
	}

	private handleSse(req: HandleRequestInput, userId: string, pageId?: string) {
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			start: (controller) => {
				const send = (data: any) => {
					try {
						controller.enqueue(
							encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
						);
					} catch (_e) {}
				};
				controller.enqueue(encoder.encode(": connected\n\n"));
				const cleanup = this.wire.on("component:update", (data: any) => {
					if (data.userId !== userId) return;
					if (pageId && data.pageId !== pageId) return;
					send({ type: "update", ...data });
				});
				const keepAlive = setInterval(() => {
					try {
						controller.enqueue(encoder.encode(": keep-alive\n\n"));
					} catch (_e) {
						clearInterval(keepAlive);
						cleanup();
					}
				}, 15000);
				req.signal?.addEventListener("abort", () => {
					clearInterval(keepAlive);
					cleanup();
					try {
						controller.close();
					} catch (_e) {}
				});
			},
		});
		return {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
			result: stream,
		};
	}

	private handleSessionStatus(userId: string, pageId?: string) {
		const active = this.wire.sessions.hasActiveSession(userId);
		const pageActive = pageId
			? this.wire.sessions.hasActivePage(userId, pageId)
			: active;
		const status = active && pageActive ? 200 : 410;

		return {
			status,
			headers: { "Content-Type": "application/json" },
			result: {
				active,
				pageActive,
			},
		};
	}

	private async emitBroadcastUpdatesForAllPages(params: {
		roomIds: Set<string>;
		skipRefs: Set<string>;
	}) {
		const { roomIds, skipRefs } = params;
		const activePages = this.wire.sessions.getActivePages();

		for (let i = 0; i < activePages.length; i++) {
			const { userId, pageId, page } = activePages[i];
			const entries = Array.from(page.components.entries());

			for (let j = 0; j < entries.length; j++) {
				const [id, instance] = entries[j];
				const ref = this.buildComponentRef(userId, pageId, id);
				if (skipRefs.has(ref)) continue;

				const matchedRooms = this.getMatchingBroadcastRooms(instance, roomIds);
				if (matchedRooms.length === 0) continue;

				if (typeof instance.$clearEffects === "function")
					instance.$clearEffects();

				// Call serverHydrate on each broadcast property
				const typedInstance = instance as any;
				const keys = Object.keys(typedInstance);
				for (let k = 0; k < keys.length; k++) {
					const val = typedInstance[keys[k]!];
					if (val instanceof WireProperty && val.__wire_type === "broadcast") {
						const roomId = (val as any).getRoomId?.();
						if (roomIds.has(roomId)) {
							(val as any).serverHydrate?.(instance);
						}
					}
				}

				const payload = await this.renderComponentPayload(id, instance);
				await this.wire.emit("component:update", {
					userId,
					pageId,
					id,
					...payload,
				});
			}
		}
	}

	private async renderComponentPayload(id: string, instance: any) {
		const nextRevision = Number((instance as any).__wireRevision || 0) + 1;
		(instance as any).__wireRevision = nextRevision;

		const state = instance.getPublicState();
		const stateStr = JSON.stringify(state).replace(/'/g, "&#39;");
		const skipRender = Boolean(instance.__skipRender);
		instance.__skipRender = false;
		let html = "";

		if (!skipRender) {
			const rendered = await instance.render();
			html = `<div wire:id="${id}" wire:state='${stateStr}'>${rendered.toString()}</div>`;
		}

		return { html, state, effects: instance.__effects, revision: nextRevision };
	}

	private getBroadcastRoomIds(instance: any): string[] {
		const out: string[] = [];
		const keys = Object.keys(instance);
		for (let i = 0; i < keys.length; i++) {
			const value = instance[keys[i]];
			if (value instanceof WireProperty && value.__wire_type === "broadcast") {
				const roomId = (value as any).getRoomId?.();
				if (roomId) out.push(roomId);
			}
		}
		return out;
	}

	private getMatchingBroadcastRooms(
		instance: any,
		roomIds: Set<string>,
	): string[] {
		const out: string[] = [];
		const keys = Object.keys(instance);
		for (let i = 0; i < keys.length; i++) {
			const value = instance[keys[i]];
			if (value instanceof WireProperty && value.__wire_type === "broadcast") {
				const roomId = value.getRoomId();
				if (roomId && roomIds.has(roomId)) out.push(roomId);
			}
		}
		return out;
	}

	private buildComponentRef(userId: string, pageId: string, id: string) {
		return `${userId}::${pageId}::${id}`;
	}

	private handleClientScript() {
		return {
			status: 200,
			headers: {
				"Content-Type": "text/javascript; charset=utf-8",
				"Cache-Control": "no-store",
			},
			result: this.getClientScriptSource(),
		};
	}

	private getClientScriptSource(): string {
		if (HttpAdapter.clientScriptCache) return HttpAdapter.clientScriptCache;

		const adapterDir = dirname(fileURLToPath(import.meta.url));
		const workspaceClient = this.findWorkspaceClientScript();
		const candidates = [
			workspaceClient,
			// Source runtime (monorepo / ts execution)
			resolve(adapterDir, "../../dist/client/wire.js"),
			// Built runtime (dist/esm/adapters or dist/cjs/adapters)
			resolve(adapterDir, "../../client/wire.js"),
			// Consumer installs
			resolve(process.cwd(), "node_modules/@kirejs/wire/dist/client/wire.js"),
			resolve(process.cwd(), "dist/client/wire.js"),
			// Monorepo docs execution path
			resolve(process.cwd(), "packages/wire/dist/client/wire.js"),
			resolve(process.cwd(), "../packages/wire/dist/client/wire.js"),
			resolve(process.cwd(), "../../packages/wire/dist/client/wire.js"),
		].filter(
			(value, index, list): value is string =>
				Boolean(value) && list.indexOf(value) === index,
		);

		let fallback: string | null = null;

		for (let i = 0; i < candidates.length; i++) {
			const path = candidates[i]!;
			if (!existsSync(path)) continue;
			try {
				const content = readFileSync(path, "utf8");
				if (!fallback) fallback = content;

				if (this.isSocketCapableClientScript(content)) {
					HttpAdapter.clientScriptCache = content;
					return content;
				}
			} catch {}
		}

		if (fallback) {
			HttpAdapter.clientScriptCache = fallback;
			return fallback;
		}

		console.error(
			"[Kirewire] Client script not found. Expected dist/client/wire.js",
		);
		return `console.error("[Kirewire] Client script not found.");`;
	}

	private isSocketCapableClientScript(content: string): boolean {
		return (
			content.includes(HttpAdapter.HTTP_MARKER) &&
			content.includes(HttpAdapter.SOCKET_MARKER)
		);
	}

	private findWorkspaceClientScript(): string | null {
		let current = process.cwd();
		for (let i = 0; i < 8; i++) {
			const candidate = resolve(current, "packages/wire/dist/client/wire.js");
			if (existsSync(candidate)) return candidate;

			const parent = resolve(current, "..");
			if (parent === current) break;
			current = parent;
		}
		return null;
	}

	public destroy() {
		if (
			this.ownsFileStore &&
			this.fileStore &&
			typeof this.fileStore.destroy === "function"
		) {
			this.fileStore.destroy();
		}
	}

	private normalizeMaxUploadBytes(value?: number): number {
		if (value === undefined || value === null) {
			return HttpAdapter.DEFAULT_MAX_UPLOAD_BYTES;
		}
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return Number.POSITIVE_INFINITY;
		}
		return Math.floor(parsed);
	}

	private isUploadTooLargeError(error: unknown): boolean {
		const message = String((error as any)?.message || "");
		return message.startsWith(HttpAdapter.MAX_UPLOAD_ERROR_PREFIX);
	}
}
