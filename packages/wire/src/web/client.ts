import { parseParams, getCsrfToken } from "./utils";

export class KireWireClient {
    constructor(
        private endpoint: string,
        private method: 'http' | 'socket' = 'http'
    ) {
        this.init();
    }

    private init() {
        document.addEventListener('click', this.handleClick.bind(this));
    }

    private async handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const el = target.closest('[wire\:click]');
        if (!el) return;

        const action = el.getAttribute('wire:click');
        if (!action) return;

        const root = el.closest('[wire\:id]');
        if (!root) return;

        const componentId = root.getAttribute('wire:id');
        const snapshot = root.getAttribute('wire:snapshot');
        const componentName = root.getAttribute('wire:component');

        if (!componentId || !componentName) return;

        const { method, params } = parseParams(action);

        await this.call(componentId, snapshot || '', componentName, method, params);
    }

    public async call(componentId: string, snapshot: string, componentName: string, method: string, params: any[]) {
        const payload = {
            component: componentName,
            snapshot,
            method,
            params
        };

        if (this.method === 'http') {
            await this.sendHttp(componentId, payload);
        } else {
            // Socket impl would go here
            console.warn('Socket not implemented in client');
        }
    }

    private async sendHttp(componentId: string, payload: any) {
        try {
            const res = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken() || ''
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Network error');

            const data = await res.json();
            this.handleResponse(componentId, data);
        } catch (e) {
            console.error('Wire error:', e);
        }
    }

    private handleResponse(componentId: string, data: any) {
        if (data.error) {
            console.error(data.error);
            return;
        }

        if (data.html) {
            const el = document.querySelector(`[wire\:id="${componentId}"]`);
            if (el) {
                // Naive replacement. 
                // In a real build, we'd bundle morphdom
                el.innerHTML = data.html;
                if (data.snapshot) {
                    el.setAttribute('wire:snapshot', data.snapshot);
                }
            }
        }
        
        // Handle events
        if (data.events) {
            data.events.forEach((event: any) => {
                window.dispatchEvent(new CustomEvent(event.name, { detail: event.params }));
            });
        }
    }
}
