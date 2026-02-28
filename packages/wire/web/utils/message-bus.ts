export interface WirePayload {
    id: string;
    method: string;
    params: any[];
    state: any;
    checksum: string | null;
    pageId: string;
}

export class MessageBus {
    private queue: Array<{ payload: WirePayload, resolve: Function, reject: Function }> = [];
    private timer: any = null;
    private inFlight = false;

    constructor(private delay: number = 100) {}

    public enqueue(payload: WirePayload): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ payload, resolve, reject });
            if (!this.timer && !this.inFlight) {
                this.timer = setTimeout(() => this.flush(), this.delay);
            }
        });
    }

    private async flush() {
        if (this.inFlight || this.queue.length === 0) return;
        this.inFlight = true;
        this.timer = null;

        const batch = [...this.queue];
        this.queue = [];

        try {
            // The transport logic will be injected by the adapter
            const event = new CustomEvent('wire:bus:flush', { 
                detail: { 
                    batch: batch.map(b => b.payload),
                    finish: (results: any[]) => {
                        batch.forEach((item, i) => {
                            if (results[i]?.error) item.reject(results[i].error);
                            else item.resolve(results[i]);
                        });
                    },
                    error: (err: any) => {
                        batch.forEach(item => item.reject(err));
                    }
                } 
            });
            window.dispatchEvent(event);
        } catch (e) {
            batch.forEach(item => item.reject(e));
        } finally {
            this.inFlight = false;
        }
    }
}

export const bus = new MessageBus();
