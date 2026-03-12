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

type SocketAdapterOptions = {
    route?: string;
    fileStore?: FileStore;
    tempDir?: string;
    maxUploadBytes?: number;
};

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
            this.pushToClient(data.userId, "update", data);
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

    public async handleRequest(req: HandleRequestInput, userId: string, sessionId: string) {
        return this.fallbackHttp.handleRequest(req, userId, sessionId);
    }

    /**
     * Called when a socket message arrives from a client.
     */
    public async onMessage(_socketId: string, userId: string, _sessionId: string, message: any) {
        const event = String(message?.event || "").trim();
        const payload = message?.payload || {};

        if (event === "ping") {
            this.pushToClient(userId, "pong", { at: Date.now() });
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
                const result = await this.executeAction(userId, pageId, action);
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
            });
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
            });
            return;
        }

        this.pushToClient(userId, "response", {
            requestId: single.requestId,
            result: single,
        });
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

    private pushToClient(userId: string, event: string, data: any) {
        // Implementation provided by the user's socket server (e.g. io.to(userId).emit(...))
        this.wire.emitSync("socket:push", { userId, event, data });
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

