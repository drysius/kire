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
            for (const action of reqBody.batch) {
                try {
                    const res = await this.processAction(action, userId, sessionId, reqBody.pageId || action.pageId);
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

    private async processAction(payload: any, userId: string, sessionId: string, pageId: string) {
        const { id, method, params, state, checksum } = payload;

        // 1. Verify Checksum
        const expected = this.wire.generateChecksum(state, sessionId);
        if (checksum !== expected) {
            throw new Error("Invalid state checksum.");
        }

        // 2. Get Component Instance
        const page = this.wire.sessions.getPage(userId, pageId);
        const instance = page.components.get(id);

        if (!instance) {
            throw new Error(`Component ${id} not found.`);
        }

        // 3. Hydrate state
        Object.assign(instance, state);

        // 4. Execute method
        const result = await (instance as any)[method](...params);

        // 5. Render
        const html = await instance.render().toString();
        const finalState = this.getPublicState(instance);
        const newChecksum = this.wire.generateChecksum(finalState, sessionId);

        return {
            id,
            success: true,
            result,
            html,
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
