export class MessageBus {
    private queue: any[] = [];
    private timer: any = null;

    enqueue(id: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ id, payload, resolve, reject });
            if (!this.timer) {
                this.timer = setTimeout(() => this.flush(), 10);
            }
        });
    }

    private async flush() {
        const batch = [...this.queue];
        this.queue = [];
        this.timer = null;

        const config = (window as any).__WIRE_CONFIG__ || { endpoint: "/_wire" };

        for (const item of batch) {
            try {
                const response = await fetch(config.endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.payload)
                });

                if (response.ok) {
                    item.resolve(await response.json());
                } else {
                    item.reject(new Error(response.statusText));
                }
            } catch (e) {
                item.reject(e);
            }
        }
    }
}

export const messageBus = new MessageBus();
