import { WirePayload } from "../../src/types";
import { sendFivemAction } from "../adapters/fivem";
import { requestSocketAction } from "../adapters/socket";

export class MessageBus {
    private queue: { id: string, payload: WirePayload, resolve: Function, reject: Function }[] = [];
    private timer: any = null;
    private inFlight = false;

    enqueue(id: string, payload: WirePayload): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ id, payload, resolve, reject });
            const delay = (window as any).__WIRE_CONFIG__?.bus_delay || 100;
            if ((window as any).__WIRE_CONFIG__?.debug) {
                console.debug("[Wire] queue enqueue", { id, payload, queue: this.queue.length });
            }
            // Do not reset the timer on every enqueue; otherwise high-frequency polls can starve flushing.
            if (!this.timer && !this.inFlight) {
                this.timer = setTimeout(() => this.flush(), delay);
            }
        });
    }

    private async flush() {
        if (this.inFlight) return;
        const batch = [...this.queue];
        this.queue = [];
        this.timer = null;

        if (batch.length === 0) return;
        this.inFlight = true;

        const config = (window as any).__WIRE_CONFIG__ || { endpoint: "/_wire", adapter: "http" };
        const adapter = String(config.adapter || "http").toLowerCase();
        const body = batch.length === 1
            ? batch[0]!.payload
            : { components: batch.map((b) => b.payload) };
        if ((window as any).__WIRE_CONFIG__?.debug) {
            console.debug("[Wire] queue flush", { size: batch.length, body });
        }

        try {
            let results: any[] = [];
            if (adapter === "socket") {
                results = await Promise.all(batch.map((item) => requestSocketAction(item.payload)));
            } else if (adapter === "fivem") {
                results = await Promise.all(batch.map(async (item) => {
                    const res = await sendFivemAction(item.payload);
                    if (!res) throw new Error("[Wire:FiveM] Empty response");
                    return res;
                }));
            } else {
                const response = await fetch(config.endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                if (!response.ok) {
                    const error = new Error(`Request failed with status ${response.status}`);
                    batch.forEach(item => item.reject(error));
                    return;
                }
                const data = await response.json();
                results = data.results || (Array.isArray(data) ? data : [data]);
            }
            if ((window as any).__WIRE_CONFIG__?.debug) {
                console.debug("[Wire] queue response", { results, adapter });
            }

            const groupedResults = new Map<string, any[]>();
            for (const result of results) {
                const key = String(result?.id ?? "");
                if (!groupedResults.has(key)) groupedResults.set(key, []);
                groupedResults.get(key)!.push(result);
            }

            batch.forEach((item, index) => {
                const queueForId = groupedResults.get(String(item.id));
                const res = (queueForId && queueForId.length > 0)
                    ? queueForId.shift()
                    : results[index];
                if (res && !res.error) item.resolve(res);
                else item.reject(new Error(res?.error || "Unknown error"));
            });

        } catch (e) {
            batch.forEach(item => item.reject(e));
        } finally {
            this.inFlight = false;
            if (this.queue.length > 0 && !this.timer) {
                const delay = (window as any).__WIRE_CONFIG__?.bus_delay || 100;
                this.timer = setTimeout(() => this.flush(), delay);
            }
        }
    }
}

export const messageBus = new MessageBus();
