import { Kirewire } from "../kirewire";

export class HttpClientAdapter {
    constructor(private options: { url: string, pageId: string }) {
        this.setup();
    }

    setup() {
        // Handle batched requests from the MessageBus
        window.addEventListener('wire:bus:flush' as any, async (e: CustomEvent) => {
            const { batch, finish, error } = e.detail;

            try {
                const response = await fetch(this.options.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        batch,
                        pageId: this.options.pageId
                    })
                });

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

                const results = await response.json();
                
                // results should be an array matching the batch indices
                if (Array.isArray(results)) {
                    results.forEach(res => {
                        if (res.html) {
                            const el = document.querySelector(`[wire-id="${res.id}"]`);
                            if (el) Kirewire.patch(el as HTMLElement, res.html);
                        }
                    });
                    finish(results);
                } else {
                    finish([results]); // Fallback for single result
                }
            } catch (err) {
                console.error("[Kirewire] Batch request failed:", err);
                error(err);
            }
        });

        // Setup SSE for push updates
        const sse = new EventSource(`${this.options.url}/sse`);
        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'update') {
                const el = document.querySelector(`[wire-id="${data.id}"]`);
                if (el) Kirewire.patch(el as HTMLElement, data.html);
            }
        };
    }
}
