import { Adapter } from "../adapter";
import { randomUUID } from "node:crypto";
import { FileStore } from "../features/file-store";

export class HttpAdapter extends Adapter {
    private route: string;
    private fileStore: FileStore;

    constructor(options: { route?: string, fileStore?: FileStore, tempDir?: string } = {}) {
        super();
        this.route = options.route || '/_wire';
        this.fileStore = options.fileStore || new FileStore(options.tempDir || "node_modules/.kirewire_uploads");
    }

    setup() {
        console.log(`[Kirewire] HttpAdapter active on ${this.route}`);
    }

    /**
     * Entry point for requests. Handles single, batch actions or SSE.
     */
    public async handleRequest(req: { method: string, url: string, body?: any, signal?: AbortSignal }, userId: string, sessionId: string) {
        const url = new URL(req.url, 'http://localhost');
        
        // SSE implementation remains the same...
        if (req.method === 'GET' && url.pathname.endsWith('/sse')) {
            // ... (rest of SSE logic)
            return this.handleSse(req, userId);
        }

        // Handle multipart uploads used by wire:model.live on file inputs.
        if (req.method === "POST" && url.pathname === `${this.route}/upload`) {
            return await this.handleUpload(req.body);
        }

        const reqBody = req.body;
        if (!reqBody) return { status: 400, result: { error: 'Empty request body' } };

        const actions = reqBody.batch && Array.isArray(reqBody.batch) ? reqBody.batch : [reqBody];
        const pageId = String(reqBody.pageId || actions[0]?.pageId || "default-page");
        const results = [];
        const modifiedComponents = new Set<string>();
        const preparedComponents = new Set<string>();
        const touchedBroadcastRooms = new Set<string>();
        const modifiedRefs = new Set<string>();

        // 1. Execute all actions in order
        for (const action of actions) {
            try {
                const { id, method, params } = action;
                const page = this.wire.sessions.getPage(userId, pageId);
                const instance = page.components.get(id) as any;

                if (!instance) throw new Error(`Component ${id} not found.`);
                if (typeof instance[method] !== "function") throw new Error(`Method "${method}" not found on component ${id}.`);
                const callParams = Array.isArray(params) ? params : [];

                // Reset side effects only once per component in each batch.
                if (!preparedComponents.has(id)) {
                    preparedComponents.add(id);
                    if (instance.$clearEffects) instance.$clearEffects();
                }

                // Execute logic
                const methodResult = await instance[method](...callParams);
                modifiedComponents.add(id);

                results.push({ id, success: true, result: methodResult });
            } catch (e: any) {
                results.push({ id: action.id, error: e.message });
            }
        }

        // 2. Final render and SSE emit for each modified component
        for (const id of modifiedComponents) {
            const page = this.wire.sessions.getPage(userId, pageId);
            const instance = page.components.get(id) as any;
            if (!instance) continue;

            const payload = await this.renderComponentPayload(id, instance, sessionId);
            for (const roomId of this.getBroadcastRoomIds(instance)) {
                touchedBroadcastRooms.add(roomId);
            }

            // Emit single update per component
            await this.wire.$emit('component:update', {
                userId, pageId, id,
                ...payload
            });
            modifiedRefs.add(this.buildComponentRef(userId, pageId, id));

            // Attach only side-effects to the final action result.
            // DOM/state updates are delivered via SSE to keep action responses lightweight.
            for (let i = results.length - 1; i >= 0; i--) {
                if (results[i].id === id && !results[i].error) {
                    Object.assign(results[i], {
                        effects: instance.__effects
                    });
                    break;
                }
            }
        }

        // 3. Refresh components bound to changed broadcast rooms (cross-session via same SSE route).
        if (touchedBroadcastRooms.size > 0) {
            await this.emitBroadcastUpdatesForAllPages({
                roomIds: touchedBroadcastRooms,
                skipRefs: modifiedRefs,
            });
        }

        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            result: reqBody.batch ? results : results[0]
        };
    }

    private async handleUpload(body: any) {
        const files = this.extractFilesFromBody(body);
        if (!files.length) {
            return {
                status: 400,
                headers: { "Content-Type": "application/json" },
                result: { error: "No files uploaded" },
            };
        }

        const file = files[0]!;
        const name = String((file as any).name || "upload.bin");
        const size = Number((file as any).size || 0);
        const mime = String((file as any).type || "application/octet-stream");
        let id = randomUUID();

        try {
            if (typeof (file as any).arrayBuffer === "function") {
                const buffer = Buffer.from(await (file as any).arrayBuffer());
                id = this.fileStore.store(name, buffer);
            }
        } catch (e) {
            // Fallback to in-memory metadata only if storage fails.
        }

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            result: { id, name, size, mime },
        };
    }

    private extractFilesFromBody(body: any): any[] {
        if (!body) return [];

        // Browser/FormData request.
        if (typeof FormData !== "undefined" && body instanceof FormData) {
            const fromFilesArray = body.getAll("files[]");
            const fromFiles = body.getAll("files");
            return [...fromFilesArray, ...fromFiles].filter(Boolean);
        }

        // Server frameworks may parse multipart into plain objects.
        if (body && typeof body === "object") {
            const candidates = [
                (body as any)["files[]"],
                (body as any).files,
                (body as any).file,
            ];
            const out: any[] = [];
            for (const candidate of candidates) {
                if (!candidate) continue;
                if (Array.isArray(candidate)) out.push(...candidate);
                else out.push(candidate);
            }
            return out.filter(Boolean);
        }

        return [];
    }

    private handleSse(req: any, userId: string) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start: (controller) => {
                const send = (data: any) => {
                    try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch (e) {}
                };
                controller.enqueue(encoder.encode(': connected\n\n'));
                const cleanup = this.wire.$on('component:update', (data) => {
                    if (data.userId === userId) send({ type: 'update', ...data });
                });
                const keepAlive = setInterval(() => {
                    try { controller.enqueue(encoder.encode(': keep-alive\n\n')); } catch (e) { clearInterval(keepAlive); cleanup(); }
                }, 15000);
                req.signal?.addEventListener('abort', () => { clearInterval(keepAlive); cleanup(); try { controller.close(); } catch(e) {} });
            }
        });
        return { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }, result: stream };
    }

    private async emitBroadcastUpdatesForAllPages(params: {
        roomIds: Set<string>;
        skipRefs: Set<string>;
    }) {
        const { roomIds, skipRefs } = params;
        const activePages = this.wire.sessions.getActivePages();

        for (const activePage of activePages) {
            const { userId, pageId, page } = activePage;

            for (const [id, instance] of page.components.entries()) {
                const ref = this.buildComponentRef(userId, pageId, id);
                if (skipRefs.has(ref)) continue;
                if (!this.hasMatchingBroadcastRoom(instance, roomIds)) continue;

                // Avoid replaying stale effects from previous requests.
                if (typeof instance.$clearEffects === "function") {
                    instance.$clearEffects();
                }

                this.hydrateBroadcastRooms(instance, roomIds);
                const targetSessionId = String((instance as any).$wire_session_id || "default-session");
                const payload = await this.renderComponentPayload(id, instance, targetSessionId);
                await this.wire.$emit("component:update", {
                    userId,
                    pageId,
                    id,
                    ...payload,
                });
            }
        }
    }

    private async renderComponentPayload(id: string, instance: any, sessionId: string) {
        const state = this.getPublicState(instance);
        const checksum = this.wire.generateChecksum(state, sessionId);
        const rendered = await instance.render();
        const stateStr = JSON.stringify(state).replace(/'/g, "&#39;");
        const html = `<div wire:id="${id}" wire:state='${stateStr}' wire:checksum="${checksum}">${rendered.toString()}</div>`;
        return {
            html,
            state,
            checksum,
            effects: instance.__effects,
        };
    }

    private getBroadcastRoomIds(instance: any): string[] {
        const out: string[] = [];
        for (const value of Object.values(instance || {})) {
            if (!this.isBroadcastLike(value)) continue;
            const roomId = typeof value.getRoomId === "function"
                ? String(value.getRoomId() || "")
                : String(value.getChannel?.() || "");
            if (!roomId) continue;
            out.push(roomId);
        }
        return out;
    }

    private hasMatchingBroadcastRoom(instance: any, roomIds: Set<string>): boolean {
        for (const value of Object.values(instance || {})) {
            if (!this.isBroadcastLike(value)) continue;
            const roomId = typeof value.getRoomId === "function"
                ? String(value.getRoomId() || "")
                : String(value.getChannel?.() || "");
            if (roomIds.has(roomId)) return true;
        }
        return false;
    }

    private hydrateBroadcastRooms(instance: any, roomIds: Set<string>) {
        for (const value of Object.values(instance || {})) {
            if (!this.isBroadcastLike(value)) continue;
            const roomId = typeof value.getRoomId === "function"
                ? String(value.getRoomId() || "")
                : String(value.getChannel?.() || "");
            if (!roomIds.has(roomId)) continue;
            value.hydrate(instance, value.getChannel?.());
        }
    }

    private isBroadcastLike(value: any): boolean {
        return !!value
            && typeof value === "object"
            && typeof value.hydrate === "function"
            && typeof value.update === "function"
            && typeof value.getChannel === "function";
    }

    private buildComponentRef(userId: string, pageId: string, id: string) {
        return `${userId}::${pageId}::${id}`;
    }

    public getPublicState(instance: any): any {
        if (typeof instance.getPublicState === "function") {
            return instance.getPublicState();
        }

        const state: any = {};
        for (const key of Object.keys(instance)) {
            const value = instance[key];
            const broadcastLike = value
                && typeof value === "object"
                && typeof value.hydrate === "function"
                && typeof value.update === "function"
                && typeof value.getChannel === "function";
            if (!key.startsWith('$') && !key.startsWith('_') && typeof value !== 'function' && !broadcastLike) {
                state[key] = instance[key];
            }
        }
        return state;
    }
}
