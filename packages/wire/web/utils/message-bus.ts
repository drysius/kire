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

    constructor(private delay: number = 10) {}

    public setDelay(ms: number) {
        this.delay = ms;
    }

    public enqueue(payload: WirePayload): Promise<any> {
        console.log(`[Kirewire] MessageBus enqueuing action "${payload.method}" for component "${payload.id}"`);
        return new Promise((resolve, reject) => {
            this.queue.push({ payload, resolve, reject });
            
            if (!this.timer && !this.inFlight) {
                // Wait for the current synchronous execution to finish before starting the timer
                queueMicrotask(() => {
                    if (!this.timer && this.queue.length > 0) {
                        console.log(`[Kirewire] MessageBus starting flush timer (${this.delay}ms)`);
                        this.timer = setTimeout(() => this.flush(), this.delay);
                    }
                });
            }
        });
    }

    private async flush() {
        if (this.inFlight || this.queue.length === 0) return;
        this.inFlight = true;
        this.timer = null;

        const batch = [...this.queue];
        this.queue = [];

        console.log(`[Kirewire] MessageBus flushing batch of ${batch.length} actions.`);

        try {
            // The transport logic will be injected by the adapter
            const event = new CustomEvent('wire:bus:flush', { 
                detail: { 
                    batch: batch.map(b => b.payload),
                    finish: (results: any[]) => {
                        console.log(`[Kirewire] MessageBus batch finished with ${results.length} results.`);
                        batch.forEach((item, i) => {
                            if (results[i]?.error) item.reject(results[i].error);
                            else item.resolve(results[i]);
                        });
                    },
                    error: (err: any) => {
                        console.error(`[Kirewire] MessageBus batch failed:`, err);
                        batch.forEach(item => item.reject(err));
                    }
                } 
            });
            window.dispatchEvent(event);
        } catch (e) {
            console.error(`[Kirewire] MessageBus critical error during dispatch:`, e);
            batch.forEach(item => item.reject(e));
        } finally {
            this.inFlight = false;
        }
    }
}

export const bus = new MessageBus();
