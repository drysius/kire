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

            console.log(`[Kirewire] HttpClientAdapter sending batch of ${batch.length} actions:`, batch);

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
                console.log(`[Kirewire] HttpClientAdapter action batch confirmed by server:`, results);

                // Patch DOM for each unique component update in the batch
                const resultsArray = Array.isArray(results) ? results : [results];
                const processedIds = new Set<string>();
                
                // We process in reverse to get the LATEST state of each component in the batch
                for (let i = resultsArray.length - 1; i >= 0; i--) {
                    const res = resultsArray[i];
                    if (res && res.success && res.html && !processedIds.has(res.id)) {
                        const el = document.querySelector(`[wire\\:id="${res.id}"]`);
                        if (el) {
                            console.log(`[Kirewire] Patching component "${res.id}" from HTTP response`);
                            el.setAttribute('wire:state', JSON.stringify(res.state));
                            el.setAttribute('wire:checksum', res.checksum);
                            Kirewire.patch(el as HTMLElement, res.html);
                            
                            if (res.effects) {
                                Kirewire.processEffects(res.effects, res.id);
                            }

                            // Notify model/dirty/etc directives so inputs reflect authoritative server state.
                            Kirewire.$emit('component:update', {
                                id: res.id,
                                state: res.state,
                                checksum: res.checksum,
                                html: res.html,
                                effects: res.effects
                            });
                        }
                        processedIds.add(res.id);
                    }
                }

                finish(results);
                } catch (err) {
                console.error("[Kirewire] HttpClientAdapter fetch error:", err);
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

            console.log(`[Kirewire] SSE message received (Type: ${data.type}):`, data);

            if (data.type === 'update') {
                const el = document.querySelector(`[wire\\:id="${data.id}"]`);
                if (el) {
                    console.log(`[Kirewire] SSE patching component "${data.id}" with new HTML`);
                    el.setAttribute('wire:state', JSON.stringify(data.state));
                    el.setAttribute('wire:checksum', data.checksum);
                    Kirewire.patch(el as HTMLElement, data.html);
                    
                    // NEW: Process effects from SSE
                    if (data.effects) {
                        Kirewire.processEffects(data.effects, data.id);
                    }

                    // Keep client-side bindings in sync with server-pushed state.
                    Kirewire.$emit('component:update', {
                        id: data.id,
                        state: data.state,
                        checksum: data.checksum,
                        html: data.html,
                        effects: data.effects
                    });
                } else {
                    console.warn(`[Kirewire] SSE: Could not find component element with wire:id="${data.id}" to patch.`);
                }
            }
        };
    }                }
