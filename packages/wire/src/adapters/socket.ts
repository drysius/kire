import type { ClientAdapter } from "./http";

export class SocketAdapter implements ClientAdapter {
    private socket: WebSocket;
    private pending: Map<string, (val: any) => void> = new Map();

    constructor(url: string) {
        this.socket = new WebSocket(url);
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id && this.pending.has(data.id)) {
                this.pending.get(data.id)!(data.response);
                this.pending.delete(data.id);
            }
        };
    }

    async request(payload: any) {
        if (this.socket.readyState !== WebSocket.OPEN) {
            await new Promise(resolve => this.socket.addEventListener('open', resolve));
        }

        const id = Math.random().toString(36).substr(2, 9);
        const req = { id, ...payload };
        
        return new Promise((resolve) => {
            this.pending.set(id, resolve);
            this.socket.send(JSON.stringify(req));
        });
    }
}
