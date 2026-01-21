import type { Kire } from "kire";
import type { WireComponent } from "../component";
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
	const payload = req.body as WirePayload;
	const identifier = getIdentifier(req);

	try {
		// 1. Resolve Component Name
		const compName = resolveComponentName(payload);
		
		// 2. Instantiate Component
		const ComponentClass = resolveComponentClass(compName, registry);
		if (!ComponentClass) {
			return { code: WireErrors.invalid_request.code, data: { error: "Component not found" } };
		}
		
		const instance = new ComponentClass();
		let memo = createInitialMemo(instance, compName!);
		let state: Record<string, any> = {};

		// 3. Process Snapshot & Security (if exists)
		if (payload.snapshot) {
			const validation = validateSnapshot(payload.snapshot, checksum, identifier);
			if (validation.error) return validation.error;
			
			state = validation.snapshot!.data;
			memo = validation.snapshot!.memo;
		}

		// 4. Initialize Component
		initializeComponent(instance, kire, contextOverrides, memo);

		// 5. Hydrate & Update
		instance.fill(state);
		await instance.hydrated();
		
		if (payload.updates) {
			await applyUpdates(instance, payload.updates);
		}

		// 6. Execute Method
		if (payload.method) {
			const methodResult = await executeMethod(instance, payload.method, payload.params || []);
			if (methodResult?.error) return methodResult.error;
		}

		// 7. Render
		const html = await renderComponent(instance);

		// 8. Generate Response
		return createResponse(instance, memo, html, payload.updates, checksum, identifier, compName!);

	} catch (e: any) {
		console.error("Error processing request:", e);
		return {
			code: WireErrors.server_error.code,
			data: { error: e.message || "Internal Server Error" },
		};
	}
}

// --- Helper Functions (Exported for Testing) ---

export function resolveComponentName(payload: WirePayload): string | undefined {
	if (payload.component) return payload.component;
	if (payload.snapshot) {
		try {
			return JSON.parse(payload.snapshot).memo?.name;
		} catch {}
	}
	return undefined;
}

export function resolveComponentClass(name: string | undefined, registry: ComponentRegistry) {
	return name ? registry.get(name) : undefined;
}

export function createInitialMemo(instance: WireComponent, name: string): WireSnapshot["memo"] {
	return {
		id: instance.__id,
		name: name,
		path: "/",
		method: "GET",
		children: [],
		scripts: [],
		assets: [],
		errors: [],
		locale: "en",
		listeners: instance.listeners || {},
	};
}

export function validateSnapshot(
	snapshotStr: string, 
	checksum: ChecksumManager, 
	identifier: string
): { snapshot?: WireSnapshot; error?: { code: number; data: { error: string } } } {
	let snapshot: WireSnapshot;
	try {
		snapshot = JSON.parse(snapshotStr);
	} catch (e) {
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

export function initializeComponent(
	instance: WireComponent, 
	kire: Kire, 
	overrides: Partial<WireContext>,
	memo: WireSnapshot["memo"]
) {
	instance.kire = kire;
	instance.context = { kire: kire, ...overrides };
	if (memo.id) instance.__id = memo.id;
	instance.listeners = memo.listeners || {};
}

export async function applyUpdates(instance: WireComponent, updates: Record<string, unknown>) {
	for (const [prop, value] of Object.entries(updates)) {
		if (isReservedProperty(prop)) continue;

		if (prop in instance) {
			(instance as any)[prop] = value;
			instance.clearErrors(prop);
		}
	}
}

export async function executeMethod(
	instance: WireComponent, 
	method: string, 
	params: unknown[]
): Promise<{ error?: { code: number; data: { error: string } } } | void> {
	const FORBIDDEN_METHODS = [
		"mount", "render", "hydrated", "updated", "rendered", "view",
		"emit", "redirect", "addError", "clearErrors", "fill",
		"getPublicProperties", "constructor", "getDataForRender"
	];

	if (FORBIDDEN_METHODS.includes(method) || method.startsWith("_")) {
		return { error: { code: WireErrors.method_not_allowed.code, data: WireErrors.method_not_allowed } };
	}

	if (method === "$set" && params.length === 2) {
		const [prop, value] = params;
		if (typeof prop === "string" && !isReservedProperty(prop)) {
			(instance as any)[prop] = value;
			instance.clearErrors(prop);
			await instance.updated(prop, value);
		}
	} else if (method === "$refresh") {
		await instance.updated("$refresh", null);
	} else if (typeof (instance as any)[method] === "function") {
		await (instance as any)[method](...params);
		await instance.updated(method, params[0]);
	}
}

export async function renderComponent(instance: WireComponent): Promise<string> {
	let html = (instance as any).render();
	if (typeof html === "string") {
		html = await instance.kire.render(html, {
			...instance.getDataForRender(),
			errors: instance.__errors,
		});
	} else {
		html = await html;
	}
	await instance.rendered();
	return html || `<div wire:id="${instance.__id}" style="display: none;"></div>`;
}

export function createResponse(
	instance: WireComponent,
	memo: WireSnapshot["memo"],
	html: string,
	updates: Record<string, unknown> | undefined,
	checksum: ChecksumManager,
	identifier: string,
	compName: string
) {
	const newData = instance.getPublicProperties();
	
	// Update Memo
	memo.errors = Object.keys(instance.__errors).length > 0 ? instance.__errors : [];
	memo.listeners = instance.listeners;

	const newChecksum = checksum.generate(newData, memo, identifier);
	const finalSnapshot = { data: newData, memo: memo, checksum: newChecksum };

	const escapedSnapshot = JSON.stringify(finalSnapshot).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
	const style = (!html || !html.trim()) ? ' style="display: none;"' : '';
	
	const wrappedHtml = `<div wire:id="${instance.__id}" wire:snapshot="${escapedSnapshot}" wire:component="${compName}"${style}>${html || ''}</div>`;

	const effects: WireResponse["components"][0]["effects"] = {
		html: wrappedHtml,
		dirty: updates ? Object.keys(updates) : [],
	};

	if (instance.__events.length > 0)
		effects.emits = instance.__events.map((e) => ({ event: e.name, params: e.params }));
	if (instance.__redirect) effects.redirect = instance.__redirect;
	if (Object.keys(instance.__errors).length > 0) effects.errors = instance.__errors as any;
	if (Object.keys(instance.listeners).length > 0) effects.listeners = instance.listeners;

	return {
		code: 200,
		data: {
			components: [{ snapshot: JSON.stringify(finalSnapshot), effects }],
		},
	};
}

function isReservedProperty(prop: string): boolean {
	return (
		prop === "__proto__" ||
		prop === "constructor" ||
		prop === "prototype" ||
		prop === "kire" ||
		prop === "context" ||
		prop.startsWith("_")
	);
}