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
     * Entry point for requests. Handles single or batch actions.
     */
    public async handleRequest(reqBody: any, userId: string, sessionId: string) {
        if (reqBody.batch && Array.isArray(reqBody.batch)) {
            const results = [];
            for (const action of reqBody.batch) {
                try {
                    const res = await this.processAction(action, userId, sessionId, reqBody.pageId);
                    results.push(res);
                } catch (e: any) {
                    results.push({ id: action.id, error: e.message });
                }
            }
            return results;
        }

        return await this.processAction(reqBody, userId, sessionId, reqBody.pageId);
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
