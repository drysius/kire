import morph from "@alpinejs/morph";
import { EventController, type Listener } from "../src/event-controller";
import { bus } from "./utils/message-bus";
import { morphDom } from "./utils/morph";

export interface WireClientContext {
	el: HTMLElement;
	value: string;
	expression: string;
	modifiers: string[];
	cleanup: (fn: () => void) => void;
	wire: KirewireClient;
	adapter: WireAdapter;
	componentId: string;
}

export type WireClientDirective = (ctx: WireClientContext) => void;

export interface WireAdapter {
	call(componentId: string, method: string, params: any[]): Promise<any>;
	defer(componentId: string, property: string, value: any): void;
	upload(
		files: FileList | File[],
		onProgress?: (progress: any) => void,
	): Promise<any>;
	liveInit?(
		name: string,
		locals?: Record<string, any>,
		options?: { pageId?: string },
	): Promise<any>;
	liveSave?(
		componentId: string,
		state: Record<string, any>,
		options?: { pageId?: string },
	): Promise<any>;
	reconfigure?(config: Partial<WireClientConfig>): void;
	abortAllRequests?(): void;
	setup?(): void;
	destroy?(): void;
}

export interface WireLiveHandle {
	loading: boolean;
	ready: boolean;
	error: any;
	save(): Promise<any>;
}

export interface WireClientConfig {
	pageId?: string;
	sessionId?: string;
	url?: string;
	uploadUrl?: string;
	previewUrl?: string;
	busDelay?: number;
	transport?: string;
}

declare global {
	interface KirewireNavigateRuntime {
		navigateTo: (
			url: string,
			options?: { replace?: boolean; force?: boolean; reason?: string },
		) => Promise<void>;
		refreshCurrentPage: (options?: {
			replace?: boolean;
			force?: boolean;
			reason?: string;
		}) => Promise<void>;
	}

	interface Window {
		__WIRE_INITIAL_CONFIG__?: WireClientConfig;
		Kirewire?: KirewireClient;
		KirewireNavigate?: KirewireNavigateRuntime;
	}
}

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, "");
}

function resolveDefaultUploadUrl(url: string): string {
	return `${trimTrailingSlash(url)}/upload`;
}

function resolveDefaultPreviewUrl(url: string): string {
	return `${trimTrailingSlash(url)}/preview`;
}

function pathParts(path: string): string[] {
	return String(path || "")
		.split(".")
		.map((part) => part.trim())
		.filter(Boolean);
}

function readPathValue(source: any, path: string): any {
	if (!source) return undefined;
	const parts = pathParts(path);
	if (parts.length === 0) return source;

	let current = source;
	for (let i = 0; i < parts.length; i++) {
		if (current == null || typeof current !== "object") return undefined;
		current = current[parts[i]!];
	}
	return current;
}

function setPathValue(target: Record<string, any>, path: string, value: any) {
	const parts = pathParts(path);
	if (parts.length === 0) return;

	let current: Record<string, any> = target;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]!;
		const next = current[part];
		if (!next || typeof next !== "object") {
			current[part] = {};
		}
		current = current[part];
	}

	current[parts[parts.length - 1]!] = value;
}

function cloneWireValue<T>(value: T): T {
	if (value === null || value === undefined) return value;

	try {
		if (typeof structuredClone === "function") {
			return structuredClone(value);
		}
	} catch {}

	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return value;
	}
}

function isObjectLike(value: any): value is Record<string, any> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

function collectionKeyOf(value: any, key: string): string | number | undefined {
	if (value == null || typeof value !== "object") return undefined;
	const resolved = value[key];
	if (resolved === undefined || resolved === null) return undefined;
	return resolved;
}

function collectionSelectorValue(value: string) {
	return String(value || "")
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"');
}

function safeQuerySelector(
	scope: ParentNode,
	selector: string,
): Element | null {
	try {
		return scope.querySelector(selector);
	} catch {
		return null;
	}
}

export class KirewireClient extends EventController {
	private directives: Array<{
		pattern: RegExp | string;
		handler: WireClientDirective;
	}> = [];
	public components = new Map<string, any>();
	public pageId = "default";
	public adapter!: WireAdapter;
	public readonly bus = bus;

	private started = false;
	private observer: MutationObserver | null = null;
	private deferredUpdates = new Map<string, Record<string, any>>();
	private cleanupByElement = new WeakMap<HTMLElement, Array<() => void>>();
	private navigationInFlight = false;
	private config: Required<
		Pick<
			WireClientConfig,
			"url" | "uploadUrl" | "previewUrl" | "transport" | "sessionId"
		>
	> = {
		url: "/_wire",
		uploadUrl: "/_wire/upload",
		previewUrl: "/_wire/preview",
		transport: "sse",
		sessionId: "guest",
	};
	private readonly liveReservedProps = new Set([
		"loading",
		"ready",
		"error",
		"save",
		"$id",
		"$name",
		"__target",
		"__live",
	]);

	public directive(pattern: RegExp | string, handler: WireClientDirective) {
		this.directives.push({ pattern, handler });
	}

	public getDirective(name: string): WireClientDirective | undefined {
		for (let i = this.directives.length - 1; i >= 0; i--) {
			const item = this.directives[i]!;
			if (typeof item.pattern === "string" && item.pattern === name) {
				return item.handler;
			}
		}
		return undefined;
	}

	public configure(config: WireClientConfig = {}) {
		if (config.pageId) {
			this.pageId = String(config.pageId);
		}

		if (config.busDelay !== undefined) {
			const delay = Number(config.busDelay);
			if (Number.isFinite(delay) && delay >= 0) {
				this.bus.setDelay(delay);
			}
		}

		const nextUrl = config.url ? String(config.url) : this.config.url;
		const nextSessionId = config.sessionId
			? String(config.sessionId)
			: this.config.sessionId;
		const nextUpload = config.uploadUrl
			? String(config.uploadUrl)
			: config.url
				? resolveDefaultUploadUrl(String(config.url))
				: this.config.uploadUrl;
		const nextPreview = config.previewUrl
			? String(config.previewUrl)
			: config.url
				? resolveDefaultPreviewUrl(String(config.url))
				: this.config.previewUrl;
		const nextTransport = config.transport
			? String(config.transport)
			: this.config.transport;

		this.config = {
			url: nextUrl,
			uploadUrl: nextUpload,
			previewUrl: nextPreview,
			transport: nextTransport,
			sessionId: nextSessionId,
		};

		if (this.adapter && typeof this.adapter.reconfigure === "function") {
			this.adapter.reconfigure({
				pageId: this.pageId,
				sessionId: this.config.sessionId,
				url: this.config.url,
				uploadUrl: this.config.uploadUrl,
				previewUrl: this.config.previewUrl,
				transport: this.config.transport,
			});
		}
	}

	public getUploadUrl() {
		return this.config.uploadUrl;
	}

	public getPreviewUrl(
		value:
			| string
			| { id?: string; upload_id?: string; mime?: string }
			| null
			| undefined,
		mime?: string,
	) {
		const rawId =
			typeof value === "string"
				? value
				: typeof value === "object" && value
					? String(value.id || value.upload_id || "")
					: "";
		const id = String(rawId || "").trim();
		if (!id) return "";

		const resolvedMime =
			typeof mime === "string" && mime.trim()
				? mime.trim()
				: typeof value === "object" && value
					? String(value.mime || "").trim()
					: "";

		const url = new URL(this.config.previewUrl, window.location.origin);
		url.searchParams.set("id", id);
		if (resolvedMime) {
			url.searchParams.set("mime", resolvedMime);
		}

		return url.origin === window.location.origin
			? `${url.pathname}${url.search}${url.hash}`
			: url.toString();
	}

	public setAdapter(adapter: WireAdapter) {
		if (
			this.adapter &&
			this.adapter !== adapter &&
			typeof this.adapter.destroy === "function"
		) {
			this.adapter.destroy();
		}
		this.adapter = adapter;
	}

	public start(Alpine: any) {
		const globalConfig =
			typeof window !== "undefined"
				? window.__WIRE_INITIAL_CONFIG__
				: undefined;
		if (globalConfig) this.configure(globalConfig);

		if (this.started) return;

		if (!Alpine) {
			console.error("[Kirewire] Alpine instance is required to start.");
			return;
		}

		this.ensureAdapter();
		this.setupRemovalObserver();

		(window as any).Alpine = Alpine;
		Alpine.plugin(morph);

		Alpine.magic("wire", (el: HTMLElement) => this.getComponentProxy(el));
		Alpine.addRootSelector(() => "[wire\\:id], [wire-id]");

		Alpine.interceptInit(
			Alpine.skipDuringClone((el: HTMLElement) => {
				const componentId = this.getComponentId(el);
				if (!componentId) return;

				if (!this.components.has(componentId)) {
					this.components.set(componentId, this.createProxy(componentId, el));
				}

				this.attachWireToDataScopes(el, componentId);
				this.processWireAttributes(el, componentId);
			}),
		);

		this.on("component:update", (data) => {
			const id = String(data?.id || "");
			if (!id) return;
			this.syncProxyState(id, data?.state || {}, true);
		});

		if (!Alpine.started) {
			Alpine.start();
		}

		this.hydrateWireSubtree(document.body);

		this.started = true;
		this.emitSync("wire:ready", {});
	}

	private ensureAdapter(): boolean {
		if (this.adapter) return true;

		const transport = String(this.config.transport || "sse").toLowerCase();
		if (transport === "fivem") {
			const FiveMCtor = (this as any).FiveMClientAdapter;
			if (typeof FiveMCtor === "function") {
				this.adapter = new FiveMCtor({
					url: this.config.url,
					uploadUrl: this.config.uploadUrl,
					pageId: this.pageId,
					sessionId: this.config.sessionId,
					transport: transport,
				});
			} else {
				console.warn(
					"[Kirewire] FiveM transport requested but FiveMClientAdapter is unavailable. Falling back to HTTP.",
				);
			}
		} else if (transport === "socket") {
			const SocketCtor = (this as any).SocketClientAdapter;
			if (typeof SocketCtor === "function") {
				this.adapter = new SocketCtor({
					url: this.config.url,
					uploadUrl: this.config.uploadUrl,
					pageId: this.pageId,
					sessionId: this.config.sessionId,
					transport: transport,
				});
			} else {
				console.warn(
					"[Kirewire] Socket transport requested but SocketClientAdapter is unavailable. Falling back to HTTP.",
				);
			}
		}

		if (!this.adapter) {
			const HttpCtor = (this as any).HttpClientAdapter;
			if (typeof HttpCtor === "function") {
				this.adapter = new HttpCtor({
					url: this.config.url,
					uploadUrl: this.config.uploadUrl,
					pageId: this.pageId,
					sessionId: this.config.sessionId,
					transport: this.config.transport,
				});
			}
		}

		if (!this.adapter) {
			console.error(
				"[Kirewire] No adapter configured. Provide one before calling wire actions.",
			);
			return false;
		}

		return true;
	}

	private processWireAttributes(el: HTMLElement, componentId: string) {
		if ((el as any)._kirewire_init) return;
		(el as any)._kirewire_init = true;

		const cleanups: Array<() => void> = [];
		this.cleanupByElement.set(el, cleanups);
		const registerCleanup = (fn: () => void) => {
			cleanups.push(fn);
		};

		const attrs = el.getAttributeNames();
		for (let i = 0; i < attrs.length; i++) {
			const attrName = attrs[i]!;
			if (attrName.charCodeAt(0) !== 119 || !attrName.startsWith("wire:"))
				continue;

			const fullValue = attrName.slice(5);
			const parts = fullValue.split(".");
			const value = parts[0]!;
			const modifiers = parts.slice(1);
			const expression = el.getAttribute(attrName) || "";

			for (let j = 0; j < this.directives.length; j++) {
				const dir = this.directives[j]!;
				let matched = false;
				if (typeof dir.pattern === "string") {
					if (dir.pattern === value) matched = true;
				} else if (dir.pattern.test(fullValue)) {
					matched = true;
				}

				if (matched) {
					dir.handler({
						el,
						value,
						expression,
						modifiers,
						cleanup: registerCleanup,
						wire: this,
						adapter: this.adapter,
						componentId,
					});
				}
			}
		}
	}

	private hasWireAttributes(el: HTMLElement): boolean {
		const attrs = el.getAttributeNames();
		for (let i = 0; i < attrs.length; i++) {
			if (attrs[i]!.startsWith("wire:")) return true;
		}
		return false;
	}

	private hydrateWireSubtree(
		scope: ParentNode | HTMLElement | null | undefined,
	) {
		if (!scope) return;

		const elements: HTMLElement[] = [];
		if (scope instanceof HTMLElement) elements.push(scope);

		const descendants =
			scope instanceof HTMLElement
				? scope.querySelectorAll("*")
				: document.querySelectorAll("*");
		for (let i = 0; i < descendants.length; i++) {
			elements.push(descendants[i] as HTMLElement);
		}

		for (let i = 0; i < elements.length; i++) {
			const el = elements[i]!;
			const componentId = this.getComponentId(el);
			if (!componentId) continue;

			if (!this.components.has(componentId)) {
				this.components.set(componentId, this.createProxy(componentId, el));
			}

			this.attachWireToDataScopes(el, componentId);
			if (this.hasWireAttributes(el)) {
				this.processWireAttributes(el, componentId);
			}
		}
	}

	private attachWireToDataScopes(el: HTMLElement, componentId: string) {
		const bind = () => {
			const scopes = (el as any)._x_dataStack;
			if (!Array.isArray(scopes)) return;
			const proxy = this.components.get(componentId);

			for (let i = 0; i < scopes.length; i++) {
				const scope = scopes[i];
				if (!scope || typeof scope !== "object") continue;
				if (Object.hasOwn(scope, "$wire")) continue;

				Object.defineProperty(scope, "$wire", {
					get: () => proxy,
					enumerable: false,
					configurable: true,
				});
			}
		};

		if ((el as any)._x_dataStack) bind();
		else queueMicrotask(bind);
	}

	public defer(componentId: string, property: string, value: any) {
		const id = String(componentId || "").trim();
		const prop = String(property || "").trim();
		if (!id || !prop) return;

		let updates = this.deferredUpdates.get(id);
		if (!updates) {
			updates = Object.create(null);
			this.deferredUpdates.set(id, updates);
		}
		updates[prop] = value;

		this.emitSync("component:dirty", { id, isDirty: true, property: prop });
	}

	private consumeDeferred(
		componentId: string,
	): Array<{ method: string; params: any[] }> {
		const updates = this.deferredUpdates.get(componentId);
		if (!updates) return [];

		this.deferredUpdates.delete(componentId);
		const keys = Object.keys(updates);
		if (keys.length === 0) return [];

		this.emitSync("component:dirty", { id: componentId, isDirty: false });

		const actions: Array<{ method: string; params: any[] }> = [];
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			actions.push({ method: "$set", params: [key, updates[key]] });
		}
		return actions;
	}

	private restoreDeferred(
		componentId: string,
		actions: Array<{ method: string; params: any[] }>,
	) {
		if (!Array.isArray(actions) || actions.length === 0) return;

		let updates = this.deferredUpdates.get(componentId);
		if (!updates) {
			updates = Object.create(null);
			this.deferredUpdates.set(componentId, updates);
		}

		let restored = false;
		for (let i = 0; i < actions.length; i++) {
			const action = actions[i]!;
			if (action.method !== "$set") continue;

			const prop = String(action.params?.[0] || "").trim();
			if (!prop) continue;
			if (Object.hasOwn(updates, prop)) continue;

			updates[prop] = action.params?.[1];
			restored = true;
		}

		if (restored) {
			this.emitSync("component:dirty", { id: componentId, isDirty: true });
		}
	}

	public async call(el: HTMLElement, method: string, params: any[] = []) {
		if (this.navigationInFlight) return;

		const componentId = this.getComponentId(el);
		if (!componentId) return;
		if (!this.ensureAdapter()) return;

		const normalized = this.normalizeAction(method, params);
		const deferredActions = this.consumeDeferred(componentId);
		const actions = [...deferredActions, normalized];
		const callMeta = {
			id: componentId,
			method: normalized.method,
			params: normalized.params,
		};

		this.emitSync("component:call", callMeta);

		try {
			const responses = await Promise.all(
				actions.map((action) =>
					this.adapter.call(componentId, action.method, action.params),
				),
			);
			const result = responses[responses.length - 1];
			this.emitSync("component:finished", callMeta);
			return responses.length > 1 ? responses : result;
		} catch (error) {
			this.restoreDeferred(componentId, deferredActions);

			const message = String((error as any)?.message || "");
			const name = String((error as any)?.name || "");
			if (
				this.navigationInFlight &&
				(name === "AbortError" ||
					message.includes("Cancelled due to navigation") ||
					message.includes("MessageBus batch cancelled"))
			) {
				this.emitSync("component:finished", callMeta);
				return;
			}
			this.emitSync("component:error", { ...callMeta, error });
			throw error;
		}
	}

	public live(
		name: string,
		locals: Record<string, any> = {},
	): WireLiveHandle & Record<string, any> {
		const componentName = String(name || "").trim();
		if (!componentName) {
			throw new Error("Live component name is required.");
		}
		if (!isObjectLike(locals)) {
			throw new Error("Live component locals must be an object.");
		}

		const target: Record<string, any> = this.createReactiveTarget();
		target.loading = true;
		target.ready = false;
		target.error = null;
		target.$id = "";
		target.$name = componentName;
		target.__live = true;

		let liveId = "";
		const syncState = (state: any) => {
			if (!isObjectLike(state)) return;
			const keys = Object.keys(state);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i]!;
				if (this.liveReservedProps.has(key)) continue;
				target[key] = cloneWireValue(state[key]);
			}
		};

		const initPromise = this.requestLiveInit(componentName, locals)
			.then((payload) => {
				liveId = String(payload?.id || "").trim();
				if (!liveId) {
					throw new Error(
						`Live init for "${componentName}" returned an invalid component id.`,
					);
				}

				target.$id = liveId;
				syncState(payload?.state || {});
				target.ready = true;
				target.loading = false;
				target.error = null;

				if (!this.components.has(liveId)) {
					const proxy = this.liveProxyFromTarget(
						target,
						syncState,
						() => initPromise,
					);
					this.components.set(liveId, proxy);
				}
			})
			.catch((error) => {
				target.loading = false;
				target.ready = false;
				target.error = error;
				throw error;
			});

		return this.liveProxyFromTarget(target, syncState, () => initPromise);
	}

	private liveProxyFromTarget(
		target: Record<string, any>,
		syncState: (state: any) => void,
		getInitPromise: () => Promise<any>,
	): WireLiveHandle & Record<string, any> {
		const runAction = async (method: string, args: any[]) => {
			await getInitPromise();
			const id = String(target.$id || "").trim();
			if (!id) throw new Error("Live component is not ready.");
			const result = await this.liveCall(id, method, args);

			if (isObjectLike(result?.state)) {
				syncState(result.state);
			}
			if (Array.isArray(result?.effects)) {
				this.processEffects(result.effects, id);
			}
			return result;
		};

		const saveState = async () => {
			await getInitPromise();
			const id = String(target.$id || "").trim();
			if (!id) throw new Error("Live component is not ready.");
			const payload = this.extractLiveClientState(target);
			const result = await this.requestLiveSave(id, payload);
			if (isObjectLike(result?.state)) {
				syncState(result.state);
			}
			if (Array.isArray(result?.effects)) {
				this.processEffects(result.effects, id);
			}
			return result;
		};

		return new Proxy(target, {
			get: (_inner, prop: string) => {
				if (prop === "__target") return target;
				if (prop === "save") return saveState;
				if (prop in target) return target[prop];

				return (...args: any[]) => runAction(String(prop), args);
			},
			set: (_inner, prop: string, value: any) => {
				target[String(prop)] = value;
				return true;
			},
		}) as WireLiveHandle & Record<string, any>;
	}

	private async liveCall(componentId: string, method: string, params: any[]) {
		if (!this.ensureAdapter()) {
			throw new Error(
				"[Kirewire] No adapter configured. Provide one before calling live actions.",
			);
		}
		return this.adapter.call(componentId, method, params);
	}

	private extractLiveClientState(target: Record<string, any>) {
		const state: Record<string, any> = Object.create(null);
		const keys = Object.keys(target);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			if (this.liveReservedProps.has(key)) continue;
			if (key.startsWith("$") || key.startsWith("_")) continue;
			const value = target[key];
			if (typeof value === "function") continue;
			state[key] = cloneWireValue(value);
		}
		return state;
	}

	private async requestLiveInit(
		name: string,
		locals: Record<string, any>,
	): Promise<any> {
		const pageId = this.pageId || "default-page";

		if (this.adapter && typeof this.adapter.liveInit === "function") {
			return this.adapter.liveInit(name, locals, { pageId });
		}

		const response = await fetch(
			`${trimTrailingSlash(this.config.url)}/live/init`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				body: JSON.stringify({ name, locals, pageId }),
			},
		);

		const payload = await this.parseLiveResponse(response, "init");
		return payload;
	}

	private async requestLiveSave(
		componentId: string,
		state: Record<string, any>,
	): Promise<any> {
		const pageId = this.pageId || "default-page";

		if (this.adapter && typeof this.adapter.liveSave === "function") {
			return this.adapter.liveSave(componentId, state, { pageId });
		}

		const response = await fetch(
			`${trimTrailingSlash(this.config.url)}/live/save`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				body: JSON.stringify({ id: componentId, state, pageId }),
			},
		);

		const payload = await this.parseLiveResponse(response, "save");
		return payload;
	}

	private async parseLiveResponse(response: Response, phase: "init" | "save") {
		let parsed: any = null;
		try {
			parsed = await response.json();
		} catch {}

		if (!response.ok) {
			const serverError =
				String(parsed?.error || parsed?.result?.error || "").trim() ||
				`Live ${phase} request failed (${response.status}).`;
			throw new Error(serverError);
		}

		if (parsed && typeof parsed === "object" && "result" in parsed) {
			return parsed.result;
		}

		return parsed;
	}

	private normalizeAction(method: string, params: any[]) {
		const cleanMethod = String(method || "").trim();
		if (params.length > 0) {
			return { method: cleanMethod, params };
		}

		const parsed = this.parseActionExpression(cleanMethod);
		if (parsed) return parsed;
		return { method: cleanMethod, params };
	}

	private parseActionExpression(
		expression: string,
	): { method: string; params: any[] } | null {
		const match = expression.match(
			/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([\s\S]*)\)$/,
		);
		if (!match) return null;

		const method = match[1]!;
		const rawArgs = match[2]!.trim();
		if (!rawArgs) return { method, params: [] };

		const params = this.parseArgs(rawArgs);
		return { method, params };
	}

	private parseArgs(argsSource: string): any[] {
		const tokens: string[] = [];
		let current = "";
		let dPar = 0;
		let dBra = 0;
		let dCur = 0;
		let inQ: string | null = null;

		for (let i = 0; i < argsSource.length; i++) {
			const c = argsSource[i]!;
			if (inQ) {
				if (c === inQ && argsSource[i - 1] !== "\\") inQ = null;
			} else {
				if (c === '"' || c === "'") inQ = c;
				else if (c === "(") dPar++;
				else if (c === ")") dPar--;
				else if (c === "[") dBra++;
				else if (c === "]") dBra--;
				else if (c === "{") dCur++;
				else if (c === "}") dCur--;
				else if (c === "," && dPar === 0 && dBra === 0 && dCur === 0) {
					tokens.push(current.trim());
					current = "";
					continue;
				}
			}
			current += c;
		}
		if (current.trim()) tokens.push(current.trim());

		return tokens.map((token) => this.parseToken(token));
	}

	private parseToken(token: string): any {
		if (token === "true") return true;
		if (token === "false") return false;
		if (token === "null") return null;
		if (token === "undefined") return undefined;
		if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
		if (
			(token.startsWith("'") && token.endsWith("'")) ||
			(token.startsWith('"') && token.endsWith('"'))
		) {
			return token.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
		}
		return token;
	}

	private createReactiveTarget() {
		const Alpine = (window as any).Alpine;
		if (Alpine && typeof Alpine.reactive === "function") {
			return Alpine.reactive({});
		}
		return {};
	}

	private getProxyTarget(componentId: string) {
		const proxy = this.components.get(componentId) as any;
		if (!proxy?.__target) return null;
		return proxy.__target as Record<string, any>;
	}

	private syncProxyState(
		componentId: string,
		nextState: any,
		replaceAll = true,
	) {
		const target = this.getProxyTarget(componentId);
		if (!target || !nextState || typeof nextState !== "object") return;

		if (replaceAll) {
			const existingKeys = Object.keys(target);
			for (let i = 0; i < existingKeys.length; i++) {
				const key = existingKeys[i]!;
				if (!Object.hasOwn(nextState, key)) {
					delete target[key];
				}
			}
		}

		const keys = Object.keys(nextState);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			target[key] = cloneWireValue(nextState[key]);
		}
	}

	private getComponentRoot(componentId: string) {
		const selectorValue = collectionSelectorValue(componentId);
		const selector = `[wire\\:id="${selectorValue}"], [wire-id="${selectorValue}"]`;
		const direct = document.querySelector(selector) as HTMLElement | null;
		if (direct) return direct;

		const candidates = document.querySelectorAll("[wire\\:id], [wire-id], *");
		for (let i = 0; i < candidates.length; i++) {
			const element = candidates[i] as HTMLElement;
			if (!element || typeof element.getAttribute !== "function") continue;
			const wireId =
				element.getAttribute("wire:id") || element.getAttribute("wire-id");
			if (wireId === componentId) return element;
		}
		return null;
	}

	private findCollectionTarget(
		scope: ParentNode,
		name: string,
	): HTMLElement | null {
		const selector = `[wire\\:collection="${collectionSelectorValue(name)}"]`;

		if (scope instanceof HTMLElement && scope.matches(selector)) {
			return scope;
		}

		const direct = scope.querySelector(selector) as HTMLElement | null;
		if (direct) return direct;

		const nodes =
			scope instanceof HTMLElement
				? scope.querySelectorAll("*")
				: document.querySelectorAll("*");
		for (let i = 0; i < nodes.length; i++) {
			const element = nodes[i] as HTMLElement;
			if (!element || typeof element.getAttribute !== "function") continue;
			if (element.getAttribute("wire:collection") === name) return element;
		}
		return null;
	}

	private emitCollectionEffect(detail: Record<string, any>) {
		this.emitSync("collection:update", detail);
		if (typeof window === "undefined") return;

		window.dispatchEvent(new CustomEvent("wire:collection", { detail }));
		if (detail?.name) {
			window.dispatchEvent(
				new CustomEvent(`wire:collection:${String(detail.name)}`, { detail }),
			);
		}
	}

	private applyStateCollection(componentId: string, payload: any) {
		const path = String(payload?.path || payload?.name || "").trim();
		if (!path) return;

		const root = this.getComponentRoot(componentId);
		const currentState = root ? this.getComponentState(root) : {};
		const target = this.getProxyTarget(componentId);
		if (!target) return;

		const action = String(payload?.action || "replace");
		const key = String(payload?.key || "id");
		const sourceList =
			readPathValue(target, path) ?? readPathValue(currentState, path);
		const current = Array.isArray(sourceList) ? cloneWireValue(sourceList) : [];
		const items = Array.isArray(payload?.items)
			? cloneWireValue(payload.items)
			: [];
		const keys = new Set(
			(Array.isArray(payload?.keys) ? payload.keys : [])
				.filter((entry: any) => entry !== undefined && entry !== null)
				.map((entry: any) => String(entry)),
		);
		let next = Array.isArray(current) ? current : [];

		const appendUnique = (list: any[], values: any[]) => {
			const output = [...list];
			for (let i = 0; i < values.length; i++) {
				const item = values[i];
				const itemKey = collectionKeyOf(item, key);
				if (itemKey === undefined) {
					output.push(item);
					continue;
				}
				if (output.some((entry) => collectionKeyOf(entry, key) === itemKey))
					continue;
				output.push(item);
			}
			return output;
		};

		const prependUnique = (list: any[], values: any[]) => {
			let output = [...list];
			for (let i = values.length - 1; i >= 0; i--) {
				const item = values[i];
				const itemKey = collectionKeyOf(item, key);
				if (itemKey === undefined) {
					output = [item, ...output];
					continue;
				}
				if (output.some((entry) => collectionKeyOf(entry, key) === itemKey))
					continue;
				output = [item, ...output];
			}
			return output;
		};

		const upsert = (
			list: any[],
			values: any[],
			position: "append" | "prepend",
		) => {
			let output = [...list];
			for (let i = 0; i < values.length; i++) {
				const item = values[i];
				const itemKey = collectionKeyOf(item, key);
				if (itemKey === undefined) {
					output =
						position === "prepend" ? [item, ...output] : [...output, item];
					continue;
				}

				output = output.filter(
					(entry) => collectionKeyOf(entry, key) !== itemKey,
				);
				output = position === "prepend" ? [item, ...output] : [...output, item];
			}
			return output;
		};

		switch (action) {
			case "append":
				next = appendUnique(current, items);
				break;
			case "prepend":
				next = prependUnique(current, items);
				break;
			case "upsert":
				next = upsert(
					current,
					items,
					payload?.position === "prepend" ? "prepend" : "append",
				);
				break;
			case "remove":
				next = current.filter((entry: any) => {
					const itemKey = collectionKeyOf(entry, key);
					if (itemKey === undefined) return true;
					return !keys.has(String(itemKey));
				});
				break;
			default:
				next = items;
				break;
		}

		const limit = Number(payload?.limit);
		if (Number.isFinite(limit) && limit > 0 && next.length > limit) {
			if (
				action === "prepend" ||
				(action === "upsert" && payload?.position === "prepend")
			) {
				next = next.slice(0, limit);
			} else {
				next = next.slice(Math.max(0, next.length - limit));
			}
		}

		setPathValue(target, path, next);
	}

	private findCollectionItem(target: HTMLElement, key: string) {
		return target.querySelector(
			`[data-wire-collection-key="${collectionSelectorValue(key)}"]`,
		) as HTMLElement | null;
	}

	private applyDomCollection(scope: ParentNode, payload: any) {
		const name = String(payload?.name || "").trim();
		if (!name) return;

		const target = this.findCollectionTarget(scope, name);
		if (!target) return;
		if (
			typeof HTMLTemplateElement !== "undefined" &&
			target instanceof HTMLTemplateElement
		)
			return;

		const action = String(payload?.action || "replace");
		const content = String(payload?.content || "");
		const itemKey =
			payload?.key === undefined || payload?.key === null
				? ""
				: String(payload.key);
		const keys = Array.isArray(payload?.keys)
			? payload.keys.map((entry: any) => String(entry))
			: [];

		if (action === "replace") {
			target.innerHTML = content;
			return;
		}

		if (action === "remove") {
			for (let i = 0; i < keys.length; i++) {
				const match = this.findCollectionItem(target, keys[i]!);
				if (match) match.remove();
			}
			return;
		}

		if (!content) return;

		if (action === "append" || action === "prepend") {
			if (itemKey && this.findCollectionItem(target, itemKey)) return;
			target.insertAdjacentHTML(
				action === "prepend" ? "afterbegin" : "beforeend",
				content,
			);
			return;
		}

		if (action === "upsert") {
			const existing = itemKey
				? this.findCollectionItem(target, itemKey)
				: null;
			if (existing) {
				existing.outerHTML = content;
				return;
			}
			target.insertAdjacentHTML(
				payload?.position === "prepend" ? "afterbegin" : "beforeend",
				content,
			);
		}
	}

	private applyCollectionEffect(payload: any, componentId?: string) {
		const id = String(componentId || "").trim();
		if (!id || !payload) return;

		const scope = this.getComponentRoot(id);
		if (!scope) return;

		const mode = String(payload?.mode || (payload?.content ? "dom" : "state"));
		if (mode === "dom") {
			this.applyDomCollection(scope, payload);
		} else {
			this.applyStateCollection(id, payload);
		}

		this.emitCollectionEffect({
			componentId: id,
			...payload,
		});
	}

	public processEffects(effects: any[], componentId?: string) {
		if (!Array.isArray(effects)) return;

		const scopeRoot = componentId
			? (document.querySelector(
					`[wire\\:id="${componentId}"], [wire-id="${componentId}"]`,
				) as HTMLElement | null)
			: null;
		const queryScope: ParentNode = scopeRoot || document;

		for (let i = 0; i < effects.length; i++) {
			const effect = effects[i];
			if (!effect?.type) continue;

			switch (effect.type) {
				case "redirect":
					window.location.href = effect.payload;
					return;
				case "event": {
					const { name, params } = effect.payload || {};
					const payload = Array.isArray(params)
						? params.length <= 1
							? params[0]
							: params
						: params;
					this.emitSync(name, payload);
					if (typeof window !== "undefined" && name) {
						window.dispatchEvent(
							new CustomEvent(String(name), { detail: payload }),
						);
						window.dispatchEvent(
							new CustomEvent(`wire:${String(name)}`, { detail: payload }),
						);
					}
					break;
				}
				case "stream": {
					const { target, content, method } = effect.payload || {};
					if (!target || typeof target !== "string") break;

					let el = safeQuerySelector(queryScope, target);
					if (!el) {
						const value = target.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
						el = safeQuerySelector(queryScope, `[wire\\:stream="${value}"]`);
					}
					if (!el) break;

					if (method === "append")
						el.insertAdjacentHTML("beforeend", content || "");
					else if (method === "prepend")
						el.insertAdjacentHTML("afterbegin", content || "");
					else el.innerHTML = content || "";
					break;
				}
				case "collection":
					this.applyCollectionEffect(effect.payload || {}, componentId);
					break;
			}
		}
	}

	public getMetadata(el: HTMLElement) {
		let root: HTMLElement | null =
			el.hasAttribute("wire:id") || el.hasAttribute("wire-id") ? el : null;
		if (!root) {
			root = el.closest(
				"[wire\\:id], [wire-id], [wire\\:state]",
			) as HTMLElement | null;
		}
		if (!root) return null;

		const id = root.getAttribute("wire:id") || root.getAttribute("wire-id");
		if (!id) return null;

		const stateStr = root.getAttribute("wire:state");
		let state: any = {};
		if (stateStr) {
			try {
				state = JSON.parse(stateStr);
			} catch {
				state = {};
			}
		}

		return { el: root, id, state };
	}

	public getComponentId(el: HTMLElement): string | null {
		if (el.hasAttribute("wire:id")) return el.getAttribute("wire:id");
		if (el.hasAttribute("wire-id")) return el.getAttribute("wire-id");

		let current: HTMLElement | null = el.parentElement;
		while (current) {
			const wireId =
				current.getAttribute("wire:id") || current.getAttribute("wire-id");
			if (wireId) return wireId;
			current = current.parentElement;
		}

		return null;
	}

	public getComponentState(el: HTMLElement): any {
		const meta = this.getMetadata(el);
		return meta ? meta.state : {};
	}

	private getComponentProxy(el: HTMLElement) {
		const id = this.getComponentId(el);
		return id ? this.components.get(id) : null;
	}

	private createProxy(id: string, el: HTMLElement) {
		const wire = this;
		const internalTarget: any = this.createReactiveTarget();

		return new Proxy(internalTarget, {
			get(target: any, prop: string) {
				if (prop === "$id") return id;
				if (prop === "$el") return el;
				if (prop === "__target") return target;

				if (prop in target) return target[prop];
				const state = wire.getComponentState(el);
				if (prop in state) return state[prop];

				return (...args: any[]) => {
					const root = document.querySelector(
						`[wire\\:id="${id}"], [wire-id="${id}"]`,
					);
					if (root) return wire.call(root as HTMLElement, prop, args);
					return wire.call(el, prop, args);
				};
			},
			set(target: any, prop: string, value: any) {
				target[prop] = value;
				wire.defer(id, String(prop), value);
				return true;
			},
		});
	}

	public patch(el: HTMLElement, newHtml: string) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(newHtml, "text/html");
		const newEl = doc.body.firstElementChild as HTMLElement;
		if (newEl) {
			this.cleanupTree(el);
			morphDom(el, newEl);
			queueMicrotask(() => this.hydrateWireSubtree(el));
		}
	}

	public $on(event: string, callback: Listener): () => void {
		return this.on(event, callback);
	}

	public $emit(event: string, data?: any) {
		this.emitSync(event, data);
	}

	public beginNavigation() {
		this.navigationInFlight = true;
		this.bus.cancelPending(new Error("Cancelled due to navigation"));
		if (this.adapter && typeof this.adapter.abortAllRequests === "function") {
			this.adapter.abortAllRequests();
		}
	}

	public endNavigation() {
		this.navigationInFlight = false;
	}

	public isNavigating() {
		return this.navigationInFlight;
	}

	public resetClientState() {
		this.components.clear();
		this.deferredUpdates.clear();
	}

	public cleanupTree(scope: ParentNode | HTMLElement | null | undefined) {
		if (!scope) return;

		if (scope instanceof HTMLElement) {
			this.runElementCleanup(scope);
		}

		const nodes =
			scope instanceof HTMLElement
				? scope.querySelectorAll("*")
				: document.querySelectorAll("*");
		for (let i = 0; i < nodes.length; i++) {
			this.runElementCleanup(nodes[i] as HTMLElement);
		}
	}

	public hydrateTree(scope: ParentNode | HTMLElement | null | undefined) {
		this.hydrateWireSubtree(scope);
	}

	private setupRemovalObserver() {
		if (
			this.observer ||
			typeof MutationObserver === "undefined" ||
			!document.body
		)
			return;

		this.observer = new MutationObserver((records) => {
			for (let i = 0; i < records.length; i++) {
				const added = records[i]!.addedNodes;
				for (let j = 0; j < added.length; j++) {
					this.hydrateWireSubtree(added[j] as any);
				}

				const removed = records[i]!.removedNodes;
				for (let j = 0; j < removed.length; j++) {
					this.runNodeCleanup(removed[j]!);
				}
			}
		});
		this.observer.observe(document.body, { childList: true, subtree: true });
	}

	private runNodeCleanup(node: Node) {
		if (!(node instanceof HTMLElement)) return;
		this.runElementCleanup(node);

		const children = node.querySelectorAll("*");
		for (let i = 0; i < children.length; i++) {
			this.runElementCleanup(children[i] as HTMLElement);
		}
	}

	private runElementCleanup(el: HTMLElement) {
		delete (el as any)._kirewire_init;

		const cleanups = this.cleanupByElement.get(el);
		if (!cleanups) return;

		this.cleanupByElement.delete(el);

		for (let i = 0; i < cleanups.length; i++) {
			try {
				cleanups[i]!();
			} catch {
				// Ignore cleanup errors to avoid breaking DOM teardown.
			}
		}
	}
}

export const Kirewire = new KirewireClient();
(typeof global !== "undefined" ? global : (window as any)).Kirewire = Kirewire;
