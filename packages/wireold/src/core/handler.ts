import type { Kire } from "kire";
import type { WireRequestOptions, WireRequestResponse } from "../types";
import { getAssetContent } from "./assets";
import { processRequest } from "./process";

/**
 * Handles incoming Wire requests (POST actions, Polling or SSE connections).
 * Standardized to work with Elysia, Express, Fastify via WireRequestOptions.
 */
export async function handleWireRequest(kire: Kire, options: WireRequestOptions): Promise<WireRequestResponse> {
    const { path, method, body, headers, locals, query } = options;
    const wire = kire.$kire["~wire"];
    const route = wire.options.route;

    if (!path.startsWith(route)) return { code: "not_wired" };

    const subPath = path.slice(route.length);

    // 1. Static Assets (kirewire.js, kirewire.css)
    if (method === "GET" && subPath.match(/\.(js|css)$/)) {
        const filename = subPath.split('/').pop()!;
        const contentType = filename.endsWith('.js') ? "application/javascript" : "text/css";
        
        const content = await getAssetContent(filename);
        if (content) {
            return {
                status: 200,
                headers: { 
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=604800, immutable"
                },
                body: content
            };
        }
    }

    // 2. Real-time Polling: GET /sync?id=xxx or POST /sync {id: xxx}
    // Returns pending events/emits for the component.
    if (subPath === "/sync") {
        const id = query?.id || body?.id;
        if (!id) return { status: 400, body: { error: "ID required" } };

        const pendingEvents = wire.events.get(id) || [];
        wire.events.set(id, []); // Atomically clear after consumption
        
        return {
            status: 200,
            body: { emits: pendingEvents }
        };
    }

    // 3. File Preview: GET /preview?id=xxx
    if (method === "GET" && subPath === "/preview") {
        const id = query?.id;
        const file = wire.tempFiles.get(id);
        if (!file) return { status: 404, body: "File expired or not found" };

        return {
            status: 200,
            headers: { "Content-Type": file.mime },
            body: file.buffer
        };
    }

    // 4. SSE Connection: GET /stream?id=xxx
    if (method === "GET" && headers?.["accept"] === "text/event-stream") {
        const id = query?.id;
        const instance = wire.components.get(id);
        if (!instance) return { status: 404, body: "Component not found" };

        const session = {
            emit: (event: string, data: any) => { /* SSE Implementation provided by server adapter */ },
            close: () => {
                instance.unmount();
                wire.components.delete(id);
                wire.sessions.delete(id);
            }
        };
        wire.sessions.set(id, session);
        return { status: 200, headers: { "Content-Type": "text/event-stream" }, body: session };
    }

    // 5. Component Actions: POST /
    if (method === "POST") {
        let payload = body;

        // Auto-detect Multipart/FormData (restore payload from _wired_payload field)
        if (body?._wired_payload) {
            try {
                let data = body._wired_payload;
                // Handle frameworks that wrap form fields in objects (like Elysia/Bun)
                if (Array.isArray(data)) data = data[data.length - 1];
                if (typeof data === 'object' && data !== null && 'value' in data) data = data.value;
                payload = JSON.parse(data);
            } catch (e) {
                return { status: 400, body: "Invalid multipart payload" };
            }
        }

        const result = await processRequest(kire, payload, locals);
        return {
            status: result.code,
            headers: { "Content-Type": "application/json" },
            body: result.data
        };
    }

    return { status: 404, body: "Not Found" };
}
