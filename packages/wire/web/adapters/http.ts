import { wire } from "../kirewire";

export class HttpClientAdapter {
    constructor(private options: { url: string, pageId: string }) {
        this.setup();
    }

    setup() {
        // Listen for calls from directives
        wire.$on('component:call', async (payload) => {
            const el = document.querySelector(`[wire-id="${payload.id}"]`);
            if (!el) return;

            const state = JSON.parse(el.getAttribute('wire:state') || '{}');
            const checksum = el.getAttribute('wire:checksum');

            const response = await fetch(this.options.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    state,
                    checksum,
                    pageId: this.options.pageId
                })
            });

            const result = await response.json();
            if (result.html) {
                wire.patch(el as HTMLElement, result.html);
            }
        });

        // Setup SSE for push updates
        const sse = new EventSource(`${this.options.url}/sse`);
        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'update') {
                const el = document.querySelector(`[wire-id="${data.id}"]`);
                if (el) wire.patch(el as HTMLElement, data.html);
            }
        };
    }
}
