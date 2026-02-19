import type { Kire } from "kire";
import type { WireComponent } from "../component";
import { WireFile } from "./file";
import type {
	WireContext,
	WirePayload,
	WireResponse,
	WireSnapshot,
} from "../types";
import { getIdentifier } from "./context";
import { WireErrors } from "./errors";

/**
 * Optimized Component Request Processor.
 * Handles lifecycle, hydration, property updates, method execution and rendering.
 */
export async function processRequest(
	kire: Kire,
	body: any,
	contextOverrides: Partial<WireContext> = {},
): Promise<{ code: number; data: WireResponse | { error: string } }> {
    const wire = kire.$kire["~wire"];
	const payloadList = body.components || [body];
	const identifier = contextOverrides.wireToken || (kire as any).$globals["$wireToken"] || "";

	try {
        const responses: any[] = [];

        for (const payload of payloadList) {
            const compName = payload.component || (payload.snapshot ? JSON.parse(payload.snapshot).memo?.name : undefined);
            const ComponentClass = wire.registry.get(compName);
            
            if (!ComponentClass) {
                responses.push({ error: "Component not found: " + compName });
                continue;
            }

            // 1. Lifecycle: Construction
            const instance = new ComponentClass(kire);
            instance.__name = compName!;
            if (payload.id) instance.__id = payload.id;
            instance.context = { kire, ...contextOverrides };
            
            let state: Record<string, any> = {};
            let memo: WireSnapshot["memo"] = {
                id: instance.__id, 
                name: compName, 
                path: "/", 
                method: "POST", 
                children: [], 
                scripts: [], 
                assets: [], 
                errors: {}, 
                locale: "en", 
                listeners: instance.listeners || {},
            };

            // 2. Lifecycle: Hydration (from snapshot)
            if (payload.snapshot) {
                try {
                    const snap: WireSnapshot = JSON.parse(payload.snapshot);
                    // Security check
                    if (!wire.checksum.verify(snap.checksum, snap.data, snap.memo, identifier)) {
                        return { code: 403, data: { error: "Invalid snapshot checksum" } };
                    }
                    state = snap.data;
                    memo = snap.memo;
                    instance.__id = memo.id;
                    instance.listeners = { ...instance.listeners, ...memo.listeners };
                } catch (e) {
                    return { code: 400, data: { error: "Invalid snapshot format" } };
                }
            }

            // 3. Lifecycle: Mount (Initial only)
            if (!payload.snapshot) {
                if (instance.mount) await instance.mount(payload.updates || {});
                // Fill initial properties if provided in updates
                if (payload.updates) instance.fill(payload.updates);
            }

            // Sync state into instance
            instance.fill(state);
            await instance.hydrated();

            // 4. Lifecycle: Property Updates (Dynamic sync)
            if (payload.snapshot && payload.updates) {
                for (const [prop, value] of Object.entries(payload.updates)) {
                    if (prop.startsWith("_") || !(prop in instance)) continue;
                    
                    const current = (instance as any)[prop];
                    await instance.updating(prop, value);
                    
                    if (current instanceof WireFile) {
                        const files = (value as any)?._wire_type === 'WireFile' ? (value as any).files : (Array.isArray(value) ? value : [value]);
                        instance.clearErrors(prop);
                        await current.populate(files.filter(Boolean), instance, prop);
                    } else {
                        (instance as any)[prop] = value;
                        instance.clearErrors(prop);
                    }
                    await instance.updated(prop, value);
                }
            }

            // 5. Lifecycle: Action Execution
            if (payload.method) {
                const method = payload.method;
                const params = payload.params || [];
                const FORBIDDEN = ["mount", "render", "hydrated", "updated", "updating", "rendered", "view", "emit", "redirect", "addError", "clearErrors", "fill", "getPublicProperties", "constructor", "validate", "stream"];
                
                if (FORBIDDEN.includes(method) || method.startsWith("_")) {
                     return { code: WireErrors.method_not_allowed.code, data: { error: "Method not allowed" } };
                }

                if (method === "$set" && params.length === 2) {
                    const [p, v] = params;
                    if (typeof p === "string" && !p.startsWith("_")) {
                        await instance.updating(p, v);
                        (instance as any)[p] = v;
                        instance.clearErrors(p);
                        await instance.updated(p, v);
                    }
                } else if (method === "$refresh") {
                    await instance.updated("$refresh", null);
                } else if (typeof (instance as any)[method] === "function") {
                    await (instance as any)[method](...params);
                }
            }

            // 6. Lifecycle: Rendering
            // We await the result. If it's a string, we assume it's already rendered HTML.
            // Component.render() usually calls this.view() or this.html() which returns a string.
            const result = (instance as any).render();
            let html = await result;
            await instance.rendered();

            // 7. Lifecycle: Dehydration (Create new snapshot)
            const newData = instance.getPublicProperties();
            memo.errors = Object.keys(instance.__errors).length > 0 ? instance.__errors : {};
            memo.listeners = instance.listeners;

            const newChecksum = wire.checksum.generate(newData, memo, identifier);
            const finalSnapshot = { data: newData, memo, checksum: newChecksum };
            const escapedSnapshot = JSON.stringify(finalSnapshot).replace(/"/g, "&quot;");
            
            // Envelope the HTML in the root element
            const responseHtml = `<div wire:id="${instance.__id}" wire:snapshot="${escapedSnapshot}" wire:component="${compName}"${!html || !html.toString().trim() ? ' style="display: none;"' : ""}>${html}</div>`;

            // Prepare Effects
            const effects: any = {
                html: responseHtml,
                dirty: payload.updates ? Object.keys(payload.updates) : [],
                emits: instance.__events.length > 0 ? instance.__events : undefined,
                streams: instance.__streams.length > 0 ? instance.__streams : undefined,
                redirect: instance.__redirect || undefined,
                errors: Object.keys(instance.__errors).length > 0 ? instance.__errors : undefined
            };

            responses.push({
                snapshot: JSON.stringify(finalSnapshot),
                effects
            });

            // Queue events for polling if any
            if (instance.__events.length > 0) {
                let queue = wire.events.get(instance.__id);
                if (!queue) { queue = []; wire.events.set(instance.__id, queue); }
                queue.push(...instance.__events);
                // Cleanup after 30s
                setTimeout(() => {
                    const q = wire.events.get(instance.__id);
                    if (q) wire.events.set(instance.__id, q.filter(e => !instance.__events.includes(e)));
                }, 30000);
            }
        }

		return { code: 200, data: { components: responses } };
	} catch (e: any) {
		if (!kire.$production) console.error("[Wire] Error processing request:", e);
		return { code: 500, data: { error: e.message } };
	}
}
