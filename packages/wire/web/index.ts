import Alpine from "alpinejs";
import morph from "@alpinejs/morph";
import WireAlpinePlugin from "./lifecycle";
import { setupEntangle } from "./features/entangle";
import { connectSSE, sendHttpAction } from "./adapters/http-sse";

// Handlers
import "./attributes/model";
import "./attributes/click";
import "./attributes/ignore";
import "./attributes/navigate";
import "./attributes/poll";
import "./attributes/loading";
import "./attributes/dirty";
import "./attributes/init";
import "./attributes/offline";

// Register Plugins
Alpine.plugin(morph);
Alpine.plugin(WireAlpinePlugin);
setupEntangle(Alpine);

const Wire = {
    start: (config: { endpoint?: string, production?: boolean, bus_delay?: number, transport?: "sse" | "socket" } = {}) => {
        (window as any).__WIRE_CONFIG__ = { 
            endpoint: config.endpoint || "/_wire",
            production: config.production || false,
            bus_delay: config.bus_delay || 100,
            transport: config.transport || "sse"
        };
        Alpine.start();
    },
    emit: (name: string, ...params: any[]) => window.dispatchEvent(new CustomEvent(name, { detail: params })),
    http: {
        sendAction: sendHttpAction,
        connectSSE,
    },
    events: {
        connect: (
            target: string | { component: string; id: string; channel?: string },
            onUpdate: (data: any) => void
        ) => {
            const config = (window as any).__WIRE_CONFIG__ || {};
            const transport = (config.transport || "sse").toLowerCase();
            if (transport === "socket" || transport === "ws") {
                console.warn("[Wire] Socket transport not yet implemented in web client, falling back to SSE.");
            }
            const url = typeof target === "string"
                ? target
                : (() => {
                    const endpoint = String(config.endpoint || "/_wire").replace(/\/+$/, "");
                    return `${window.location.origin}${endpoint}/broadcast?component=${encodeURIComponent(target.component)}&id=${encodeURIComponent(target.id)}&channel=${encodeURIComponent(target.channel || "global")}`;
                })();
            return connectSSE(url, onUpdate);
        }
    }
};

(window as any).Wire = Wire;
(window as any).Alpine = Alpine;

if (!(window as any).__WIRE_MANUAL_START__) {
    document.addEventListener("DOMContentLoaded", () => {
        // Read initial config from a global if present, or use defaults
        const config = (window as any).__WIRE_INITIAL_CONFIG__ || {};
        Wire.start(config);
    });
}

export default Wire;
