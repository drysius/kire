import { Kirewire } from "../kirewire";

export class HttpClientAdapter {
    constructor(private options: { url: string, pageId: string }) {
        Kirewire.pageId = options.pageId;
        this.setup();
    }

    setup() {
        console.log(`[Kirewire] HttpClientAdapter setting up listeners...`);
        // Handle batched requests from the MessageBus
        window.addEventListener('wire:bus:flush' as any, async (e: CustomEvent) => {
            const { batch, finish, error } = e.detail;

            console.log(`[Kirewire] HttpClientAdapter sending batch of ${batch.length} actions to ${this.options.url}`);

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
                console.log(`[Kirewire] HttpClientAdapter action batch confirmed:`, results);

                // All DOM updates are expected via SSE channel
                finish(results);
                } catch (err) {                console.error("[Kirewire] HttpClientAdapter fetch error:", err);
                error(err);
            }
        });

        // Setup SSE for push updates
        console.log(`[Kirewire] HttpClientAdapter connecting to SSE at ${this.options.url}/sse`);
        const sse = new EventSource(`${this.options.url}/sse`);
        sse.onopen = () => console.log(`[Kirewire] SSE connection established.`);
        sse.onerror = (err) => console.error(`[Kirewire] SSE connection error:`, err);

        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'ping') return;

            console.log(`[Kirewire] SSE message received:`, data);

            if (data.type === 'update') {
                const el = document.querySelector(`[wire\\:id="${data.id}"]`);
                if (el) {
                    console.log(`[Kirewire] SSE patching component "${data.id}"`);
                    el.setAttribute('wire:state', JSON.stringify(data.state));
                    el.setAttribute('wire:checksum', data.checksum);
                    Kirewire.patch(el as HTMLElement, data.html);
                }
            }
        };
    }                }
