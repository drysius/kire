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
            if (!this.pending.has(endpoint)) this.pending.set(endpoint, []);
            const queue = this.pending.get(endpoint)!;

            if (payload.method === "$set") {
                const existing = queue.find(item => item.component.id === component.id && item.payload.method === "$set");
                if (existing) {
                    existing.payload.updates = { ...(existing.payload.updates || {}), ...payload.updates };
                    if (!existing.subscribers) existing.subscribers = [];
                    existing.subscribers.push({ resolve, reject });
                    return;
                }
            } else if (payload.method && payload.method !== "$refresh") {
                const existing = queue.find(item => item.component.id === component.id && item.payload.method === payload.method && JSON.stringify(item.payload.params) === JSON.stringify(payload.params));
                if (existing) {
                    existing.payload.updates = { ...(existing.payload.updates || {}), ...payload.updates };
                    if (!existing.subscribers) existing.subscribers = [];
                    existing.subscribers.push({ resolve, reject });
                    return;
                }
            }

            queue.push({ component, payload, resolve, reject });
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.flush(), component.config.bus_delay || 10);
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
                const body: any = { _token: firstItem.component.getCsrfToken(), components };
                
                // Scan for files
                const files = new Map<string, File>();
                const processFiles = (obj: any): any => {
                    if (obj?._is_upload_wrapper && obj.rawFile) {
                        const id = `file_${Math.random().toString(36).substr(2, 9)}`;
                        files.set(id, obj.rawFile);
                        return { _wire_file: id };
                    }
                    if (Array.isArray(obj)) return obj.map(processFiles);
                    if (obj && typeof obj === "object") {
                        const res: any = {};
                        for (const k in obj) res[k] = processFiles(obj[k]);
                        return res;
                    }
                    return obj;
                };

                const processedBody = processFiles(body);
                let res: Response;

                if (files.size > 0) {
                    const fd = new FormData();
                    fd.append("_wired_payload", JSON.stringify(processedBody));
                    files.forEach((f, id) => fd.append(id, f));
                    res = await fetch(endpoint, { method: "POST", body: fd });
                } else {
                    res = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(processedBody)
                    });
                }

                const response: WireResponse = await res.json();
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