import { Adapter } from "../adapter";

export class HttpAdapter extends Adapter {
    private route: string;

    constructor(options: { route?: string } = {}) {
        super();
        this.route = options.route || '/_wire';
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

        const reqBody = req.body;
        if (!reqBody) return { status: 400, result: { error: 'Empty request body' } };

        const actions = reqBody.batch && Array.isArray(reqBody.batch) ? reqBody.batch : [reqBody];
        const pageId = reqBody.pageId || actions[0]?.pageId;
        const results = [];
        const modifiedComponents = new Set<string>();
        const preparedComponents = new Set<string>();

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

            const finalState = this.getPublicState(instance);
            const newChecksum = this.wire.generateChecksum(finalState, sessionId);
            const rendered = await instance.render();
            const fullHtml = `<div wire:id="${id}" wire:state='${JSON.stringify(finalState).replace(/'/g, "&#39;")}' wire:checksum="${newChecksum}">${rendered.toString()}</div>`;

            // Emit single update per component
            await this.wire.$emit('component:update', {
                userId, pageId, id,
                html: fullHtml,
                state: finalState,
                checksum: newChecksum,
                effects: instance.__effects
            });

            // Attach final state to the last action of this component in the results array
            for (let i = results.length - 1; i >= 0; i--) {
                if (results[i].id === id && !results[i].error) {
                    Object.assign(results[i], {
                        html: fullHtml,
                        state: finalState,
                        checksum: newChecksum,
                        effects: instance.__effects
                    });
                    break;
                }
            }
        }

        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            result: reqBody.batch ? results : results[0]
        };
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
