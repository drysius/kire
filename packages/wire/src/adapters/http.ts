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
        
        // Handle SSE
        if (req.method === 'GET' && url.pathname.endsWith('/sse')) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start: (controller) => {
                    const send = (data: any) => {
                        try {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                        } catch (e) {}
                    };
                    
                    // Initial message to confirm connection
                    controller.enqueue(encoder.encode(': connected\n\n'));

                    const cleanup = this.wire.$on('component:update', (data) => {
                        if (data.userId === userId) send({ type: 'update', ...data });
                    });

                    // Keep-alive heartbeat every 15s
                    const keepAlive = setInterval(() => {
                        try {
                            controller.enqueue(encoder.encode(': keep-alive\n\n'));
                        } catch (e) {
                            clearInterval(keepAlive);
                            cleanup();
                        }
                    }, 15000);

                    const pingInterval = setInterval(() => {
                        try {
                            controller.enqueue(encoder.encode(`data: {"type":"ping"}\n\n`));
                        } catch (e) {
                            clearInterval(pingInterval);
                        }
                    }, 10000);

                    req.signal?.addEventListener('abort', () => {
                        clearInterval(keepAlive);
                        clearInterval(pingInterval);
                        cleanup();
                        try { controller.close(); } catch(e) {}
                    });
                }
            });

            return {
                status: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no', // Disable buffering for proxies like Nginx
                },
                result: stream
            };
        }

        const reqBody = req.body;
        if (!reqBody) return { status: 400, result: { error: 'Empty request body' } };

        let result;
        if (reqBody.batch && Array.isArray(reqBody.batch)) {
            const results = [];
            const hydrated = new Set<string>(); // Keep track of hydrated components in this batch
            for (const action of reqBody.batch) {
                try {
                    const res = await this.processAction(action, userId, sessionId, reqBody.pageId || action.pageId, hydrated);
                    results.push(res);
                } catch (e: any) {
                    results.push({ id: action.id, error: e.message });
                }
            }
            result = results;
        } else {
            result = await this.processAction(reqBody, userId, sessionId, reqBody.pageId);
        }

        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            result
        };
    }

    private async processAction(payload: any, userId: string, sessionId: string, pageId: string, hydratedSet?: Set<string>) {
        const { id, method, params, state, checksum } = payload;

        // 2. Get Component Instance
        console.log(`[Kirewire] Looking up component ${id} for User: ${userId}, Page: ${pageId}`);
        const page = this.wire.sessions.getPage(userId, pageId);
        const instance = page.components.get(id) as any;

        if (!instance) {
            console.warn(`[Kirewire] Component ${id} not found in session for page ${pageId}. Available:`, Array.from(page.components.keys()));
            throw new Error(`Component ${id} not found.`);
        }

        // 1. Verify and Hydrate ONLY ONCE per batch for the same component
        // This prevents overwriting the updated server state with stale client state in multiple rapid actions
        if (!hydratedSet || !hydratedSet.has(id)) {
            const expected = this.wire.generateChecksum(state, sessionId);
            if (checksum !== expected) {
                console.error(`[Kirewire] Checksum mismatch for component ${id}. Expected: ${expected}, Got: ${checksum}`);
                throw new Error("Invalid state checksum.");
            }

            // Hydrate state
            Object.assign(instance, state);
            if (hydratedSet) hydratedSet.add(id);
            
            // Clear effects for a fresh start of this request/batch
            if (instance.$clearEffects) instance.$clearEffects();
        }

        // 4. Execute method
        const result = await (instance as any)[method](...params);

        // 5. Render
        const rendered = await instance.render();
        const htmlContent = rendered.toString();
        const finalState = this.getPublicState(instance);
        const newChecksum = this.wire.generateChecksum(finalState, sessionId);
        const stateStr = JSON.stringify(finalState).replace(/'/g, "&#39;");

        // Wrap the content in the same root element structure as the initial render
        const fullHtml = `<div wire:id="${id}" wire:state='${stateStr}' wire:checksum="${newChecksum}">${htmlContent}</div>`;

        return {
            id,
            success: true,
            result,
            html: fullHtml,
            state: finalState,
            checksum: newChecksum,
            effects: (instance as any).__effects
        };
    }

    public getPublicState(instance: any): any {
        const state: any = {};
        for (const key of Object.keys(instance)) {
            if (!key.startsWith('$') && !key.startsWith('_') && typeof instance[key] !== 'function') {
                state[key] = instance[key];
            }
        }
        return state;
    }
}
