import type { Component } from "./component";
import type { WirePayload, WireResponse } from "../../types";

interface PendingItem {
    component: Component;
    payload: Partial<WirePayload>;
    resolve: Function;
    reject: Function;
    subscribers?: { resolve: Function, reject: Function }[];
}

export class MessageBus {
    private pending: Map<string, PendingItem[]> = new Map();
    private timeout: any = null;

    constructor() {}

    public enqueue(component: Component, payload: Partial<WirePayload>): Promise<WireResponse> {
        return new Promise((resolve, reject) => {
            const endpoint = component.config.endpoint;
            if (!this.pending.has(endpoint)) {
                this.pending.set(endpoint, []);
            }

            const queue = this.pending.get(endpoint)!;

            // Request Squashing: Merge sequential $set updates for the same component in the same batch
            if (payload.method === "$set") {
                const existing = queue.find(item => 
                    item.component.id === component.id && 
                    item.payload.method === "$set"
                );

                if (existing) {
                    existing.payload.updates = { 
                        ...(existing.payload.updates || {}), 
                        ...payload.updates 
                    };
                    if (!existing.subscribers) existing.subscribers = [];
                    existing.subscribers.push({ resolve, reject });
                    return;
                }
            } else if (payload.method && payload.method !== "$refresh") {
                // Deduplicate identical method calls in the same batch
                const existing = queue.find(item => 
                    item.component.id === component.id && 
                    item.payload.method === payload.method &&
                    JSON.stringify(item.payload.params) === JSON.stringify(payload.params)
                );
                
                if (existing) {
                    // Merge updates and attach subscriber
                    existing.payload.updates = { 
                        ...(existing.payload.updates || {}), 
                        ...payload.updates 
                    };
                    if (!existing.subscribers) existing.subscribers = [];
                    existing.subscribers.push({ resolve, reject });
                    return;
                }
            }

            queue.push({ component, payload, resolve, reject });

            const delay = component.config.bus_delay || 10;

            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.flush(), delay);
        });
    }

    private async flush() {
        const batches = Array.from(this.pending.entries());
        this.pending.clear();
        this.timeout = null;

        for (const [endpoint, items] of batches) {
            try {
                const components = items.map(item => ({
                    ...item.payload,
                    component: item.component.name,
                    id: item.component.id,
                    snapshot: JSON.stringify(item.component.snapshot)
                }));

                const firstItem = items[0]!;
                const body = {
                    _token: firstItem.component.getCsrfToken(),
                    components
                };

                const response: WireResponse = await firstItem.component.adapter.request(body);

                // Distribute responses to primary items and their squashed subscribers
                items.forEach(item => {
                    item.resolve(response);
                    item.subscribers?.forEach(s => s.resolve(response));
                });
            } catch (e) {
                items.forEach(item => {
                    item.reject(e);
                    item.subscribers?.forEach(s => s.reject(e));
                });
            }
        }
    }
}

export const messageBus = new MessageBus();