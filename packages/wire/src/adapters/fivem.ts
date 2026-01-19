import type { ClientAdapter } from "./http";

export class FivemAdapter implements ClientAdapter {
    private resourceName: string;
    private pending: Map<string, (val: any) => void> = new Map();

    constructor(resourceName?: string) {
        this.resourceName = resourceName || (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'kire';
        
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (data.type === `${this.resourceName}:kirewire:response` && data.requestId) {
                if (this.pending.has(data.requestId)) {
                    this.pending.get(data.requestId)!(data.response);
                    this.pending.delete(data.requestId);
                }
            }
        });
    }

    async request(payload: any) {
        const requestId = Math.random().toString(36).substr(2, 9);
        
        // Register promise first
        const promise = new Promise((resolve) => {
            this.pending.set(requestId, resolve);
        });

        // Send to Client Script
        await fetch(`https://${this.resourceName}/kirewire-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, payload })
        });

        return promise;
    }
}
