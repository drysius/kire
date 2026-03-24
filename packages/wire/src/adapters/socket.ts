import { Adapter } from "../adapter";
import { Component } from "../component";
import type { FileStore } from "../features/file-store";
import { WireBroadcast } from "../features/wire-broadcast";
import { HttpAdapter } from "./http";

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
	requestId?: string;
};

type SocketAdapterOptions = {
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

const RESERVED_REMOTE_ACTIONS = new Set([
	"constructor",
	"render",
	"mount",
	"unmount",
	"view",
	"fill",
	"validate",
	"rule",
	"getPublicState",
]);

function normalizeRoute(route: string): string {
	const value = String(route || "/_wire").trim();
	if (!value) return "/_wire";
	const withSlash = value.startsWith("/") ? value : `/${value}`;
	return withSlash.replace(/\/+$/, "");
}

export class SocketAdapter extends Adapter {
	private route: string;
	private fallbackHttp: HttpAdapter;

	constructor(options: SocketAdapterOptions = {}) {
		super();
		this.route = normalizeRoute(options.route || "/_wire");
		this.fallbackHttp = new HttpAdapter({
			route: this.route,
			fileStore: options.fileStore,
			tempDir: options.tempDir,
			maxUploadBytes: options.maxUploadBytes,
		});
	}

	setup() {
		// Keep HTTP endpoints available (/kirewire.js, /upload, /session) while
		// socket transport handles action calls and pushes.
		this.fallbackHttp.install(this.wire, this.kire);

		console.log(`[Kirewire] SocketAdapter initialized on ${this.route}.`);
		this.wire.reference("wire:socket-url", () => this.getSocketUrl());

		this.wire.on("component:update", (data) => {
			this.pushToClient(data.userId, "update", data, data.sessionId);
		});
	}

	public getClientUrl() {
		return this.route;
	}

	public getUploadUrl() {
		return `${this.route}/upload`;
	}

	public getSocketUrl() {
		return `${this.route}/socket`;
	}

	public autoCleanUploads() {
		if (typeof this.fallbackHttp.autoCleanUploads === "function") {
			this.fallbackHttp.autoCleanUploads();
		}
	}

	public async handleRequest(
		req: HandleRequestInput,
		userId: string,
		sessionId: string,
	) {
		return this.fallbackHttp.handleRequest(req, userId, sessionId);
	}

	/**
	 * Called when a socket message arrives from a client.
	 */
	public async onMessage(
		_socketId: string,
		userId: string,
		sessionId: string,
		message: any,
	) {
		const event = String(message?.event || "").trim();
		const payload = message?.payload || {};

		if (event === "ping") {
			this.pushToClient(userId, "pong", { at: Date.now() }, sessionId);
			return;
		}

		if (event !== "call") return;

		const actions = Array.isArray(payload?.batch) ? payload.batch : [payload];
		const pageId = String(
			payload?.pageId || actions[0]?.pageId || "default-page",
		);
		const results: Array<Record<string, any>> = [];

		for (let i = 0; i < actions.length; i++) {
			const action = actions[i] as ActionPayload;
			const actionRequestId = String(
				action?.requestId || payload?.requestId || "",
			);

			try {
				const result = await this.executeAction(
					userId,
					sessionId,
					pageId,
					action,
				);
				results.push({
					requestId: actionRequestId,
					...result,
				});
			} catch (error: any) {
				results.push({
					requestId: actionRequestId,
					id: String(action?.id || ""),
					error: String(error?.message || "Unknown socket call error"),
				});
			}
		}

		if (Array.isArray(payload?.batch)) {
			this.pushToClient(userId, "response", {
				requestId: String(payload?.requestId || ""),
				results,
			}, sessionId);
			return;
		}

		const single = results[0] || {
			requestId: String(payload?.requestId || ""),
			id: String(actions[0]?.id || ""),
			error: "Unknown socket call error",
		};

		if (single.error) {
			this.pushToClient(userId, "response", {
				requestId: single.requestId,
				id: single.id,
				error: single.error,
			}, sessionId);
			return;
		}

		this.pushToClient(userId, "response", {
			requestId: single.requestId,
			result: single,
		}, sessionId);
	}

	private async executeAction(
		userId: string,
		sessionId: string,
		pageId: string,
		action: ActionPayload,
	) {
		const id = String(action?.id || "").trim();
		if (!id) throw new Error("Component id is required.");

		const method = String(action?.method || "").trim();
		const params = Array.isArray(action?.params) ? action.params : [];
		const page = this.wire.sessions.getPage(userId, pageId, sessionId);
		const instance = page.components.get(id) as any;
		if (!instance) {
			throw new Error(`Component ${id} not found.`);
		}

		if (typeof instance.$clearEffects === "function") {
			instance.$clearEffects();
		}

		await this.invokeComponentAction(instance, method, params);
		const payload = await this.renderComponentPayload(id, instance);
		const touchedBroadcastRooms = new Set(this.getBroadcastRoomIds(instance));
		const skipRefs = new Set([
			this.buildComponentRef(userId, sessionId, pageId, id),
		]);

		await this.wire.emit("component:update", {
			userId,
			sessionId,
			pageId,
			id,
			...payload,
		});

		if (touchedBroadcastRooms.size > 0) {
			await this.emitBroadcastUpdatesForAllPages({
				roomIds: touchedBroadcastRooms,
				skipRefs,
			});
		}

		return {
			id,
			success: true,
			html: payload.html,
			state: payload.state,
			effects: payload.effects,
			revision: payload.revision,
		};
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

		if (!this.isAllowedActionMethod(instance, name)) {
			throw new Error(
				`Method "${name}" not found on component ${instance.$id}.`,
			);
		}

		await instance[name](...callParams);
	}

	private isAllowedActionMethod(instance: any, name: string): boolean {
		if (!instance || !name) return false;
		if (RESERVED_REMOTE_ACTIONS.has(name)) return false;
		if (typeof instance[name] !== "function") return false;

		const exposed = instance.$actions;
		if (Array.isArray(exposed) && exposed.length > 0) {
			return exposed.includes(name);
		}

		if (Object.hasOwn(instance, name)) return true;

		let proto = Object.getPrototypeOf(instance);
		while (proto && proto !== Object.prototype) {
			if (Object.hasOwn(proto, name)) {
				return proto !== Component.prototype;
			}
			proto = Object.getPrototypeOf(proto);
		}

		return false;
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

	private async renderComponentPayload(id: string, instance: any) {
		const nextRevision = Number((instance as any).__wireRevision || 0) + 1;
		(instance as any).__wireRevision = nextRevision;

		const state = instance.getPublicState();
		const stateStr = JSON.stringify(state).replace(/'/g, "&#39;");
		const skipRender = Boolean(instance.__skipRender || instance.$live);
		instance.__skipRender = false;
		let html = "";

		if (!skipRender) {
			const rendered = await instance.render();
			html = `<div wire:id="${id}" wire:state='${stateStr}'>${rendered.toString()}</div>`;
		}

		return { html, state, effects: instance.__effects, revision: nextRevision };
	}

	private async emitBroadcastUpdatesForAllPages(params: {
		roomIds: Set<string>;
		skipRefs: Set<string>;
	}) {
		const { roomIds, skipRefs } = params;
		const activePages = this.wire.sessions.getActivePages();

		for (let i = 0; i < activePages.length; i++) {
			const { userId, sessionId, pageId, page } = activePages[i];
			const entries = Array.from(page.components.entries());

			for (let j = 0; j < entries.length; j++) {
				const [id, instance] = entries[j];
				const ref = this.buildComponentRef(userId, sessionId, pageId, id);
				if (skipRefs.has(ref)) continue;

				const matchedRooms = this.getMatchingBroadcastRooms(instance, roomIds);
				if (matchedRooms.length === 0) continue;

				if (typeof instance.$clearEffects === "function") {
					instance.$clearEffects();
				}

				const typedInstance = instance as any;
				const keys = Object.keys(typedInstance);
				for (let k = 0; k < keys.length; k++) {
					const val = typedInstance[keys[k]!];
					if (val instanceof WireBroadcast) {
						const roomId = val.getRoomId();
						if (roomId && roomIds.has(roomId)) {
							val.serverHydrate(instance);
						}
					}
				}

				const payload = await this.renderComponentPayload(id, instance);
				await this.wire.emit("component:update", {
					userId,
					sessionId,
					pageId,
					id,
					...payload,
				});
			}
		}
	}

	private getBroadcastRoomIds(instance: any): string[] {
		const out: string[] = [];
		const keys = Object.keys(instance);
		for (let i = 0; i < keys.length; i++) {
			const value = instance[keys[i]];
			if (value instanceof WireBroadcast) {
				const roomId = value.getRoomId();
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
			if (value instanceof WireBroadcast) {
				const roomId = value.getRoomId();
				if (roomId && roomIds.has(roomId)) out.push(roomId);
			}
		}
		return out;
	}

	private buildComponentRef(
		userId: string,
		sessionId: string,
		pageId: string,
		id: string,
	) {
		return `${userId}::${sessionId}::${pageId}::${id}`;
	}

	private pushToClient(
		userId: string,
		event: string,
		data: any,
		sessionId?: string,
	) {
		// Implementation provided by the user's socket server (e.g. io.to(userId).emit(...))
		this.wire.emitSync("socket:push", { userId, sessionId, event, data });
	}

	private disconnectSpecialProperties(instance: Record<string, any>) {
		const keys = Object.keys(instance);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			const value = instance[key];
			if (!value || typeof value !== "object") continue;

			if (value instanceof WireBroadcast) {
				try {
					value.disconnect(instance);
				} catch {
					// Ignore disconnection errors to avoid breaking unmount.
				}
			}
		}
	}

	public destroy() {
		this.fallbackHttp.destroy();

		const activePages = this.wire.sessions.getActivePages();
		for (let i = 0; i < activePages.length; i++) {
			const page = activePages[i]!.page;
			const components = Array.from(page.components.values()) as Array<
				Record<string, any>
			>;
			for (let j = 0; j < components.length; j++) {
				this.disconnectSpecialProperties(components[j]!);
			}
		}
	}
}
