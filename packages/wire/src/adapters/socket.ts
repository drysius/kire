import { Adapter } from "../adapter";

export class SocketAdapter extends Adapter {
    setup() {
        console.log(`[Kirewire] SocketAdapter initialized.`);
        
        // Listen for internal updates to push to clients
        this.wire.on('component:update', (data) => {
            this.pushToClient(data.userId, 'update', data);
        });
    }

    /**
     * Called when a socket message arrives from a client.
     */
    public async onMessage(_socketId: string, userId: string, _sessionId: string, message: any) {
        const { event, payload } = message;

        if (event === 'call') {
            const { id, method, params, pageId } = payload;

            const page = this.wire.sessions.getPage(userId, pageId);
            const instance = page.components.get(id);
            if (!instance) return;
            if (typeof (instance as any)[method] !== "function") return;
            const callParams = Array.isArray(params) ? params : [];

            await (instance as any)[method](...callParams);

            // The update event will be caught by setup() listener and pushed back
        }
    }

    private pushToClient(userId: string, event: string, data: any) {
        // Implementation provided by the user's socket server (e.g. io.to(userId).emit(...))
        this.wire.emit('socket:push', { userId, event, data });
    }
}

