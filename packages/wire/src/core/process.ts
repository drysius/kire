
import type { Kire } from "kire";
import type { WireComponent } from "../component";
import { WireFile } from "./file";
import type {
	WireContext,
	WirePayload,
	WireResponse,
	WireSnapshot,
} from "../types";
import type { ChecksumManager } from "./checksum";
import { getIdentifier } from "./context";
import { WireErrors } from "./errors";
import type { ComponentRegistry } from "./registry";

export async function processRequest(
	req: any,
	kire: Kire,
	registry: ComponentRegistry,
	checksum: ChecksumManager,
	contextOverrides: Partial<WireContext> = {},
): Promise<{ code: number; data: WireResponse | { error: string } }> {
	const body = req.body;
    const payloadList = body.components || [body];
	const identifier = getIdentifier(req);

	try {
        const responses: any[] = [];

        for (const payload of payloadList) {
            const compName = resolveComponentName(payload);
            const ComponentClass = resolveComponentClass(compName, registry);
            if (!ComponentClass) {
                responses.push({ error: "Component not found: " + compName });
                continue;
            }

            const instance = new ComponentClass(kire);
            instance.__name = compName!;
            if (payload.id) instance.__id = payload.id;
            
            let memo = createInitialMemo(instance, compName!);
            let state: Record<string, any> = {};

            if (payload.snapshot) {
                const validation = validateSnapshot(payload.snapshot, checksum, identifier, kire.production);
                if (validation.error) return validation.error;
                state = validation.snapshot!.data;
                memo = validation.snapshot!.memo;
            }

            initializeComponent(instance, kire, contextOverrides, memo);

            if (!payload.snapshot) {
                if (instance.mount) await instance.mount(payload.updates || {});
            }

            instance.fill(state);
            await instance.hydrated();

            if (payload.snapshot && payload.updates) {
                await applyUpdates(instance, payload.updates);
            }

            if (payload.method) {
                const methodResult = await executeMethod(instance, payload.method, payload.params || []);
                if (methodResult?.error) return methodResult.error;
            }

            const html = await renderComponent(instance);
            const response = createResponse(instance, memo, html, payload.updates, checksum, identifier, compName!);
            responses.push(response.data.components[0]);
        }

		return { code: 200, data: { components: responses } };
	} catch (e: any) {
		if (!kire.production) console.error("Error processing request:", e);
		return { code: 500, data: { error: e.message } };
	}
}

export function resolveComponentName(payload: WirePayload): string | undefined {
	if (payload.component) return payload.component;
	if (payload.snapshot) {
		try { return JSON.parse(payload.snapshot).memo?.name; } catch {}
	}
	return undefined;
}

export function resolveComponentClass(name: string | undefined, registry: ComponentRegistry) {
	return name ? registry.get(name) : undefined;
}

export function createInitialMemo(instance: WireComponent, name: string): WireSnapshot["memo"] {
	return {
		id: instance.__id, name, path: "/", method: "GET", children: [], scripts: [], assets: [], errors: [], locale: "en", listeners: instance.listeners || {},
	};
}

export function validateSnapshot(snapshotStr: string, checksum: ChecksumManager, identifier: string, silent = false): { snapshot?: WireSnapshot; error?: { code: number; data: { error: string } }; } {
	let snapshot: WireSnapshot;
	try { snapshot = JSON.parse(snapshotStr); } catch (e) {
		return { error: { code: WireErrors.invalid_request.code, data: { error: "Invalid snapshot format" } } };
	}
	if (!snapshot || !snapshot.checksum || !snapshot.data || !snapshot.memo) {
		return { error: { code: WireErrors.incomplete_snapshot.code, data: WireErrors.incomplete_snapshot } };
	}
	if (!checksum.verify(snapshot.checksum, snapshot.data, snapshot.memo, identifier)) {
		return { error: { code: WireErrors.invalid_checksum.code, data: WireErrors.invalid_checksum } };
	}
	return { snapshot };
}

export function initializeComponent(instance: WireComponent, kire: Kire, overrides: Partial<WireContext>, memo: WireSnapshot["memo"]) {
	instance.context = { kire, ...overrides };
	if (memo.id) instance.__id = memo.id;
    instance.listeners = { ...(instance.listeners || {}), ...(memo.listeners || {}) };
}

export async function applyUpdates(instance: WireComponent, updates: Record<string, unknown>) {
	for (const [prop, value] of Object.entries(updates)) {
		if (prop === "constructor" || prop === "prototype" || prop.startsWith("_")) continue;

		if (prop in instance) {
            const currentVal = (instance as any)[prop];
            
            if (currentVal instanceof WireFile) {
                await instance.updating(prop, value);
                
                let filesData = value;
                if (value && typeof value === 'object' && (value as any)._wire_type === 'WireFile') {
                    filesData = (value as any).files;
                }
                
                const filesArray = Array.isArray(filesData) ? filesData : (filesData ? [filesData] : []);
                
                instance.clearErrors(prop);
                await currentVal.populate(filesArray, instance, prop);
                await instance.updated(prop, value);
            } else {
			    await instance.updating(prop, value);
			    (instance as any)[prop] = value;
			    instance.clearErrors(prop);
			    await instance.updated(prop, value);
            }
		}
	}
}

export async function executeMethod(instance: WireComponent, method: string, params: unknown[]): Promise<{ error?: { code: number; data: { error: string } } } | void> {
	const FORBIDDEN = ["mount", "render", "hydrated", "updated", "updating", "rendered", "view", "emit", "redirect", "addError", "clearErrors", "fill", "getPublicProperties", "constructor", "getDataForRender", "validate", "stream"];
	if (FORBIDDEN.includes(method) || method.startsWith("_")) return { error: { code: WireErrors.method_not_allowed.code, data: WireErrors.method_not_allowed } };

	if (method === "$set" && params.length === 2) {
		const [prop, value] = params;
		if (typeof prop === "string" && !prop.startsWith("_")) {
			await instance.updating(prop, value);
			(instance as any)[prop] = value;
			instance.clearErrors(prop);
			await instance.updated(prop, value);
		}
	} else if (method === "$refresh") {
		await instance.updated("$refresh", null);
	} else if (method === "$unmount") {
		await instance.unmount();
	} else if (typeof (instance as any)[method] === "function") {
		await (instance as any)[method](...params);
	}
}

export async function renderComponent(instance: WireComponent): Promise<string> {
	let result = (instance as any).render();
    let html = "";
	if (typeof result === "string") {
		const data = { ...instance.getDataForRender(), errors: instance.__errors };
		const keys = Object.keys(data).filter((k) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k));
		const injection = keys.length ? `<?js let { ${keys.join(", ")} } = $ctx.$props; ?>` : "";
		html = await instance.kire.render(injection + result, data) as string;
	} else {
		html = await result;
	}
	await instance.rendered();

    // Hydration Markers
    const id = instance.__id;
    const name = instance.__name;
    const token = Math.random().toString(36).substring(2, 9);
    const marker = `id=${id}|name=${name}|token=${token}`;

	return `<!--[if FRAGMENT:${marker}]><![endif]-->${html || `<div wire:id="${id}" style="display: none;"></div>`}<!--[if ENDFRAGMENT:${marker}]><![endif]-->`;
}

export function createResponse(instance: WireComponent, memo: WireSnapshot["memo"], html: string, updates: Record<string, unknown> | undefined, checksum: ChecksumManager, identifier: string, compName: string) {
	const newData = instance.getPublicProperties();
	memo.errors = Object.keys(instance.__errors).length > 0 ? instance.__errors : [];
	memo.listeners = instance.listeners;

	const newChecksum = checksum.generate(newData, memo, identifier);
	const finalSnapshot = { data: newData, memo, checksum: newChecksum };
	const escapedSnapshot = JSON.stringify(finalSnapshot).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
	const style = !html || !html.trim() ? ' style="display: none;"' : "";
    
    // Extract inner HTML from fragment-wrapped HTML for the response effects
    const innerHtmlMatch = html.match(/<!--\[if FRAGMENT:.*?\]><!\[endif\]-->([\s\S]*)<!--\[if ENDFRAGMENT:.*?\]><!\[endif\]-->/);
    const innerHtml = innerHtmlMatch ? innerHtmlMatch[1] : html;

	const wrappedHtml = `<div wire:id="${instance.__id}" wire:snapshot="${escapedSnapshot}" wire:component="${compName}"${style}>${innerHtml || ""}</div>`;

	const effects: WireResponse["components"][0]["effects"] = {
		html: wrappedHtml,
		dirty: updates ? Object.keys(updates) : [],
	};

	if (instance.__events.length > 0) effects.emits = instance.__events.map((e) => ({ event: e.name, params: e.params }));
	if (instance.__streams.length > 0) (effects as any).streams = instance.__streams;
	if (instance.__redirect) effects.redirect = instance.__redirect;
	if (Object.keys(instance.__errors).length > 0) effects.errors = instance.__errors as any;
	if (Object.keys(instance.listeners).length > 0) effects.listeners = instance.listeners;

	if (instance.queryString && instance.queryString.length > 0) {
		const queryParams = new URLSearchParams();
		for (const key of instance.queryString) {
			const val = (instance as any)[key];
			if (val !== undefined && val !== null && val !== "") queryParams.set(key, String(val));
		}
		effects.url = queryParams.toString();
	}

	return { code: 200, data: { components: [{ snapshot: JSON.stringify(finalSnapshot), effects }] } };
}
