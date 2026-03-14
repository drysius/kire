import { Adapter } from "../adapter";
import { HttpAdapter } from "./http";
import { WireProperty } from "../wire-property";
import type { FileStore } from "../features/file-store";

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

type FiveMIdentity = {
    userId: string;
    sessionId: string;
};

type FiveMPushPacket = {
    userId: string;
    sourceId?: string;
    channel: string;
    event: string;
    data: any;
};

type FiveMAdapterOptions = {
    route?: string;
    fileStore?: FileStore;
    tempDir?: string;
    maxUploadBytes?: number;
    inboundEvent?: string;
    outboundEvent?: string;
    resolveIdentity?: (sourceId: string) => FiveMIdentity | null | undefined;
    emit?: (packet: FiveMPushPacket) => void;
};

const BLOCKED_SET_PATH_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

function normalizeRoute(route: string): string {
    const value = String(route || "/_wire").trim();
    if (!value) return "/_wire";
    const withSlash = value.startsWith("/") ? value : `/${value}`;
    return withSlash.replace(/\/+$/, "");
}

export class FiveMAdapter extends Adapter {
    private route: string;
    private fallbackHttp: HttpAdapter;
    private inboundEvent: string;
    private outboundEvent: string;
    private resolveIdentity?: (sourceId: string) => FiveMIdentity | null | undefined;
    private emitToClient?: (packet: FiveMPushPacket) => void;
    private lastSourceByUser = new Map<string, string>();

    constructor(options: FiveMAdapterOptions = {}) {
        super();
        this.route = normalizeRoute(options.route || "/_wire");
        this.fallbackHttp = new HttpAdapter({
            route: this.route,
            fileStore: options.fileStore,
            tempDir: options.tempDir,
            maxUploadBytes: options.maxUploadBytes,
        });
        this.inboundEvent = String(options.inboundEvent || "kirewire:call");
        this.outboundEvent = String(options.outboundEvent || "kirewire:push");
        this.resolveIdentity = options.resolveIdentity;
        this.emitToClient = options.emit;
    }

    setup() {
        // Keep HTTP endpoints available (/kirewire.js, /upload, /session) while
        // FiveM transport handles action calls and pushes over game events.
        this.fallbackHttp.install(this.wire, this.kire);

        console.log(`[Kirewire] FiveMAdapter initialized on ${this.route}.`);
        this.wire.reference("wire:fivem:inbound-event", () => this.inboundEvent);
        this.wire.reference("wire:fivem:outbound-event", () => this.outboundEvent);
        this.wire.reference("wire:fivem:route", () => this.route);

        this.wire.on("component:update", (data) => {
            this.pushToClient(data.userId, "update", data);
        });
    }

    public getClientUrl() {
        return this.route;
    }

    public getUploadUrl() {
        return `${this.route}/upload`;
    }

    public getInboundEventName() {
        return this.inboundEvent;
    }

    public getOutboundEventName() {
        return this.outboundEvent;
    }

    public async handleRequest(req: HandleRequestInput, userId: string, sessionId: string) {
        return this.fallbackHttp.handleRequest(req, userId, sessionId);
    }

    public async onNetMessage(sourceId: string | number, message: any) {
        const source = String(sourceId ?? "").trim();
        const identity = this.resolveIdentity?.(source) || {
            userId: source || "guest",
            sessionId: source || "guest",
        };

        return this.onMessage(source, identity.userId, identity.sessionId, message);
    }

    /**
     * Called when a FiveM message arrives from a client script.
     */
    public async onMessage(sourceId: string, userId: string, _sessionId: string, message: any) {
        const source = String(sourceId || "").trim();
        const wireUserId = String(userId || "guest");
        if (source) {
            this.lastSourceByUser.set(wireUserId, source);
        }

        const event = String(message?.event || "").trim();
        const payload = message?.payload || {};

        if (event === "ping") {
            this.pushToClient(wireUserId, "pong", { at: Date.now() }, source);
            return;
        }

        if (event !== "call") return;

        const actions = Array.isArray(payload?.batch) ? payload.batch : [payload];
        const pageId = String(payload?.pageId || actions[0]?.pageId || "default-page");
        const results: Array<Record<string, any>> = [];

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i] as ActionPayload;
            const actionRequestId = String(action?.requestId || payload?.requestId || "");

            try {
                const result = await this.executeAction(wireUserId, pageId, action);
                results.push({
                    requestId: actionRequestId,
                    ...result,
                });
            } catch (error: any) {
                results.push({
                    requestId: actionRequestId,
                    id: String(action?.id || ""),
                    error: String(error?.message || "Unknown FiveM call error"),
                });
            }
        }

        if (Array.isArray(payload?.batch)) {
            this.pushToClient(wireUserId, "response", {
                requestId: String(payload?.requestId || ""),
                results,
            }, source);
            return;
        }

        const single = results[0] || {
            requestId: String(payload?.requestId || ""),
            id: String(actions[0]?.id || ""),
            error: "Unknown FiveM call error",
        };

        if (single.error) {
            this.pushToClient(wireUserId, "response", {
                requestId: single.requestId,
                id: single.id,
                error: single.error,
            }, source);
            return;
        }

        this.pushToClient(wireUserId, "response", {
            requestId: single.requestId,
            result: single,
        }, source);
    }

    private async executeAction(userId: string, pageId: string, action: ActionPayload) {
        const id = String(action?.id || "").trim();
        if (!id) throw new Error("Component id is required.");

        const method = String(action?.method || "").trim();
        const params = Array.isArray(action?.params) ? action.params : [];
        const page = this.wire.sessions.getPage(userId, pageId);
        const instance = page.components.get(id) as any;
        if (!instance) {
            throw new Error(`Component ${id} not found.`);
        }

        if (typeof instance.$clearEffects === "function") {
            instance.$clearEffects();
        }

        await this.invokeComponentAction(instance, method, params);
        const payload = await this.renderComponentPayload(id, instance);

        await this.wire.emit("component:update", {
            userId,
            pageId,
            id,
            ...payload,
        });

        return {
            id,
            success: true,
            html: payload.html,
            state: payload.state,
            effects: payload.effects,
            revision: payload.revision,
        };
    }

    private async invokeComponentAction(instance: any, method: string, params: any) {
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
            throw new Error(`Method "${name}" not found on component ${instance.$id}.`);
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
            return Object.prototype.hasOwnProperty.call(state, root);
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
        const skipRender = Boolean(instance.__skipRender);
        instance.__skipRender = false;
        let html = "";

        if (!skipRender) {
            const rendered = await instance.render();
            html = `<div wire:id="${id}" wire:state='${stateStr}'>${rendered.toString()}</div>`;
        }

        return { html, state, effects: instance.__effects, revision: nextRevision };
    }

    private pushToClient(userId: string, event: string, data: any, sourceId?: string) {
        const resolvedUserId = String(userId || "guest");
        const targetSource = String(sourceId || this.lastSourceByUser.get(resolvedUserId) || "").trim();
        const packet: FiveMPushPacket = {
            userId: resolvedUserId,
            sourceId: targetSource || undefined,
            channel: this.outboundEvent,
            event: String(event || ""),
            data,
        };

        if (typeof this.emitToClient === "function") {
            try {
                this.emitToClient(packet);
            } catch {
                // Avoid breaking the transport because of host emit callback issues.
            }
        }

        this.wire.emitSync("fivem:push", packet);
    }

    private disconnectSpecialProperties(instance: Record<string, any>) {
        const keys = Object.keys(instance);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]!;
            const value = instance[key];
            if (!value || typeof value !== "object") continue;

            if (value instanceof WireProperty && value.__wire_type === "broadcast" && typeof value.disconnect === "function") {
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
            const components = Array.from(page.components.values()) as Array<Record<string, any>>;
            for (let j = 0; j < components.length; j++) {
                this.disconnectSpecialProperties(components[j]!);
            }
        }
    }
}
