import { Adapter } from "../adapter";
import { randomUUID } from "node:crypto";
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

function normalizeRoute(route: string): string {
    const value = String(route || "/_wire").trim();
    if (!value) return "/_wire";
    const withSlash = value.startsWith("/") ? value : `/${value}`;
    return withSlash.replace(/\/+$/, "");
}

export class HttpAdapter extends Adapter {
    private route: string;
    private fileStore: FileStore;

    constructor(options: { route?: string, fileStore?: FileStore, tempDir?: string } = {}) {
        super();
        this.route = normalizeRoute(options.route || "/_wire");
        this.fileStore = options.fileStore || new FileStore(options.tempDir || "node_modules/.kirewire_uploads");
    }

    setup() {
        console.log(`[Kirewire] HttpAdapter active on ${this.route}`);
    }

    public getClientUrl() {
        return this.route;
    }

    public getUploadUrl() {
        return `${this.route}/upload`;
    }

    /**
     * Entry point for requests. Handles single, batch actions or SSE.
     */
    public async handleRequest(req: HandleRequestInput, userId: string, _sessionId: string) {
        const url = new URL(req.url, "http://localhost");
        
        if (req.method === "GET" && url.pathname === `${this.route}/sse`) {
            const pageId = String(url.searchParams.get("pageId") || "");
            return this.handleSse(req, userId, pageId);
        }

        if (req.method === "GET" && url.pathname === `${this.route}/session`) {
            const pageId = String(url.searchParams.get("pageId") || "");
            return this.handleSessionStatus(userId, pageId);
        }

        if (req.method === "POST" && url.pathname === `${this.route}/upload`) {
            return await this.handleUpload(req.body);
        }

        if (req.method !== "POST") {
            return { status: 405, result: { error: "Method not allowed" } };
        }

        const reqBody = req.body;
        if (!reqBody) return { status: 400, result: { error: "Empty request body" } };

        const actions = reqBody.batch && Array.isArray(reqBody.batch) ? reqBody.batch : [reqBody];
        const pageId = String(reqBody.pageId || actions[0]?.pageId || "default-page");
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
                    console.error(`[HttpAdapter] Component ${id} not found for userId=${userId} pageId=${pageId}. Available components in this page:`, Array.from(page.components.keys()));
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
            for (let j = 0; j < roomIds.length; j++) touchedBroadcastRooms.add(roomIds[j]);

            // Emit single update per component
            await this.wire.emit("component:update", {
                userId, pageId, id,
                ...payload
            });
            modifiedRefs.add(this.buildComponentRef(userId, pageId, id));

            for (let i = results.length - 1; i >= 0; i--) {
                if (results[i].id === id && !results[i].error) {
                    Object.assign(results[i], {
                        effects: instance.__effects,
                        state: payload.state,
                        html: payload.html
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
            result: reqBody.batch ? results : results[0]
        };
    }

    private async handleUpload(body: any) {
        const files = this.extractFilesFromBody(body);
        if (!files.length) {
            return { status: 400, result: { error: "No files uploaded" } };
        }

        const uploaded: Array<{ id: string; name: string; size: number; mime: string; type: string }> = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i]!;
            const name = String((file as any).name || "upload.bin");
            const size = Number((file as any).size || 0);
            const mime = String((file as any).type || "application/octet-stream");
            let id = randomUUID();

            try {
                if (typeof (file as any).arrayBuffer === "function") {
                    const buffer = Buffer.from(await (file as any).arrayBuffer());
                    id = this.fileStore.store(name, buffer);
                }
            } catch {}

            uploaded.push({ id, name, size, mime, type: mime });
        }

        return { status: 200, result: { files: uploaded } };
    }

    private extractFilesFromBody(body: any): any[] {
        if (!body) return [];
        if (typeof FormData !== "undefined" && body instanceof FormData) {
            return [...body.getAll("files[]"), ...body.getAll("files")].filter(Boolean);
        }
        if (body && typeof body === "object") {
            const candidates = [body["files[]"], body.files, body.file];
            const out: any[] = [];
            for (let i = 0; i < candidates.length; i++) {
                const c = candidates[i];
                if (!c) continue;
                if (Array.isArray(c)) out.push(...c);
                else out.push(c);
            }
            return out.filter(Boolean);
        }
        return [];
    }

    private async invokeComponentAction(instance: any, method: string, params: any) {
        const name = String(method || "").trim();
        const callParams = Array.isArray(params) ? params : [];

        if (name === "$set") {
            instance.$set(callParams[0], callParams[1]);
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

    private handleSse(req: HandleRequestInput, userId: string, pageId?: string) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start: (controller) => {
                const send = (data: any) => {
                    try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch (e) {}
                };
                controller.enqueue(encoder.encode(": connected\n\n"));
                const cleanup = this.wire.on("component:update", (data: any) => {
                    if (data.userId !== userId) return;
                    if (pageId && data.pageId !== pageId) return;
                    send({ type: "update", ...data });
                });
                const keepAlive = setInterval(() => {
                    try { controller.enqueue(encoder.encode(": keep-alive\n\n")); } catch (e) { clearInterval(keepAlive); cleanup(); }
                }, 15000);
                req.signal?.addEventListener('abort', () => { clearInterval(keepAlive); cleanup(); try { controller.close(); } catch(e) {} });
            }
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
        const pageActive = pageId ? this.wire.sessions.hasActivePage(userId, pageId) : active;
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

                if (typeof instance.$clearEffects === "function") instance.$clearEffects();

                // Call serverHydrate on each broadcast property
                const keys = Object.keys(instance);
                for (let k = 0; k < keys.length; k++) {
                    const val = instance[keys[k]];
                    if (val instanceof WireProperty && val.__wire_type === 'broadcast') {
                        const roomId = (val as any).getRoomId?.();
                        if (roomIds.has(roomId)) {
                            (val as any).serverHydrate?.(instance);
                        }
                    }
                }

                const payload = await this.renderComponentPayload(id, instance);
                await this.wire.emit("component:update", { userId, pageId, id, ...payload });
            }
        }
    }

    private async renderComponentPayload(id: string, instance: any) {
        const state = instance.getPublicState();
        const rendered = await instance.render();
        const stateStr = JSON.stringify(state).replace(/'/g, "&#39;");
        const html = `<div wire:id="${id}" wire:state='${stateStr}'>${rendered.toString()}</div>`;
        return { html, state, effects: instance.__effects };
    }

    private getBroadcastRoomIds(instance: any): string[] {
        const out: string[] = [];
        const keys = Object.keys(instance);
        for (let i = 0; i < keys.length; i++) {
            const value = instance[keys[i]];
            if (value instanceof WireProperty && value.__wire_type === 'broadcast') {
                const roomId = value.getRoomId();
                if (roomId) out.push(roomId);
            }
        }
        return out;
    }

    private getMatchingBroadcastRooms(instance: any, roomIds: Set<string>): string[] {
        const out: string[] = [];
        const keys = Object.keys(instance);
        for (let i = 0; i < keys.length; i++) {
            const value = instance[keys[i]];
            if (value instanceof WireProperty && value.__wire_type === 'broadcast') {
                const roomId = value.getRoomId();
                if (roomId && roomIds.has(roomId)) out.push(roomId);
            }
        }
        return out;
    }

    private buildComponentRef(userId: string, pageId: string, id: string) {
        return `${userId}::${pageId}::${id}`;
    }
}
