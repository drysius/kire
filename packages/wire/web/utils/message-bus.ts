export interface WirePayload {
    id: string;
    method: string;
    params: any[];
    pageId: string;
}

export class MessageBus {
    private queue: Array<{ payload: WirePayload, resolve: Function, reject: Function }> = [];
    private timer: any = null;
    private inFlight = false;
    private readonly flushTimeoutMs = 15000;

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

        let settled = false;
        const finalize = () => {
            if (settled) return;
            settled = true;
            this.inFlight = false;
            if (!this.timer && this.queue.length > 0) {
                this.timer = setTimeout(() => this.flush(), this.delay);
            }
        };

        const failBatch = (err: any) => {
            console.error(`[Kirewire] MessageBus batch failed:`, err);
            batch.forEach(item => item.reject(err));
            finalize();
        };

        const timeout = setTimeout(() => {
            failBatch(new Error(`MessageBus timed out after ${this.flushTimeoutMs}ms`));
        }, this.flushTimeoutMs);

        try {
            // The transport logic will be injected by the adapter
            const event = new CustomEvent('wire:bus:flush', { 
                detail: { 
                    batch: batch.map(b => b.payload),
                    finish: (rawResults: any) => {
                        clearTimeout(timeout);
                        const results = Array.isArray(rawResults) ? rawResults : [rawResults];
                        console.log(`[Kirewire] MessageBus batch finished with ${results.length} results.`);
                        batch.forEach((item, i) => {
                            const result = results[i] ?? results[results.length - 1];
                            if (result?.error) item.reject(result.error);
                            else item.resolve(result);
                        });
                        finalize();
                    },
                    error: (err: any) => {
                        clearTimeout(timeout);
                        failBatch(err);
                    }
                } 
            });
            window.dispatchEvent(event);
        } catch (e) {
            clearTimeout(timeout);
            failBatch(e);
        }
    }
}

export const bus = new MessageBus();
