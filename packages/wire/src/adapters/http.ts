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
     * Handle an incoming action request (POST)
     */
    public async handleAction(payload: any, userId: string, sessionId: string) {
        const { id, method, params, state, checksum, pageId } = payload;

        // 1. Verify Checksum
        const expected = this.wire.generateChecksum(state, sessionId);
        if (checksum !== expected) {
            throw new Error("Invalid state checksum. Potential tampering detected.");
        }

        // 2. Get Component Instance from Session
        const page = this.wire.sessions.getPage(userId, pageId);
        const instance = page.components.get(id);

        if (!instance) {
            throw new Error(`Component ${id} not found in session.`);
        }

        // 3. Hydrate state into instance
        Object.assign(instance, state);

        // 4. Execute method
        const result = await (instance as any)[method](...params);

        // 5. Emit update event for SSE or response
        await this.wire.$emit('component:update', {
            userId,
            pageId,
            id,
            html: await instance.render().toString(),
            state: this.getPublicState(instance)
        });

        return { success: true, result };
    }

    private getPublicState(instance: any): any {
        const state: any = {};
        for (const key of Object.keys(instance)) {
            if (!key.startsWith('$') && typeof instance[key] !== 'function') {
                state[key] = instance[key];
            }
        }
        return state;
    }
}
