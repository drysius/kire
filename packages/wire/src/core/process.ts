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
	const payload = req.body as WirePayload;
	const identifier = getIdentifier(req);

	try {
		// 1. Resolve Component Name
		const compName = resolveComponentName(payload);

		// 2. Instantiate Component
		const ComponentClass = resolveComponentClass(compName, registry);
		if (!ComponentClass) {
            if (!kire.$silent) {
                console.error(`[Wired] Component class not found for: ${compName}`);
            }
			return {
				code: WireErrors.invalid_request.code,
				data: { error: "Component not found" },
			};
		}

		const instance = new ComponentClass(kire);
		if (payload.id) {
			instance.__id = payload.id;
		}
		let memo = createInitialMemo(instance, compName!);
		let state: Record<string, any> = {};

		// 3. Process Snapshot & Security (if exists)
		if (payload.snapshot) {
			const validation = validateSnapshot(
				payload.snapshot,
				checksum,
				identifier,
				kire.production,
			);
			if (validation.error) return validation.error;

			state = validation.snapshot!.data;
			memo = validation.snapshot!.memo;
		}

		// 4. Initialize Component
		initializeComponent(instance, kire, contextOverrides, memo);

		// 4.1 Initial Mount (Lazy)
		if (!payload.snapshot) {
			if (instance.mount) {
				// If it's lazy, updates contains the init-params
				await instance.mount(payload.updates || {});
			}
		}

		// 5. Hydrate & Update
		instance.fill(state);
		await instance.hydrated();

		if (payload.snapshot && payload.updates) {
			await applyUpdates(instance, payload.updates);
		}

		// 6. Execute Method
		if (payload.method) {
			const methodResult = await executeMethod(
				instance,
				payload.method,
				payload.params || [],
			);
			if (methodResult?.error) return methodResult.error;
		}

		// 7. Render
		const html = await renderComponent(instance);

		// 8. Generate Response
		return createResponse(
			instance,
			memo,
			html,
			payload.updates,
			checksum,
			identifier,
			compName!,
		);
	} catch (e: any) {
		if (!kire.production) {
			console.error("Error processing request:", e);
		} else {
			console.warn(`[Wired] Error processing request: ${e.message}`);
		}
		return {
			code: 500,
			data: { error: e.message },
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

export function resolveComponentClass(
	name: string | undefined,
	registry: ComponentRegistry,
) {
	return name ? registry.get(name) : undefined;
}

export function createInitialMemo(
	instance: WireComponent,
	name: string,
): WireSnapshot["memo"] {
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
	identifier: string,
	silent = false,
): {
	snapshot?: WireSnapshot;
	error?: { code: number; data: { error: string } };
} {
	let snapshot: WireSnapshot;
	try {
		snapshot = JSON.parse(snapshotStr);
	} catch (e) {
		return {
			error: {
				code: WireErrors.invalid_request.code,
				data: { error: "Invalid snapshot format" },
			},
		};
	}

	if (!snapshot || !snapshot.checksum || !snapshot.data || !snapshot.memo) {
		return {
			error: {
				code: WireErrors.incomplete_snapshot.code,
				data: WireErrors.incomplete_snapshot,
			},
		};
	}

	if (
		!checksum.verify(
			snapshot.checksum,
			snapshot.data,
			snapshot.memo,
			identifier,
		)
	) {
		if (!silent) {
			console.error("[Wired] Checksum mismatch!");
			console.error("Identifier (Server):", identifier);
			console.error("Snapshot Checksum (Client):", snapshot.checksum);
			console.error(
				"Calculated Checksum (Server):",
				checksum.generate(snapshot.data, snapshot.memo, identifier),
			);
		} else {
			console.warn("[Wired] Checksum mismatch!");
		}
		return {
			error: {
				code: WireErrors.invalid_checksum.code,
				data: WireErrors.invalid_checksum,
			},
		};
	}

	return { snapshot };
}

export function initializeComponent(
	instance: WireComponent,
	kire: Kire,
	overrides: Partial<WireContext>,
	memo: WireSnapshot["memo"],
) {
	instance.context = { kire: kire, ...overrides };
	if (memo.id) instance.__id = memo.id;
    
    // Merge: start with class listeners, overwrite with snapshot if any
    const classListeners = instance.listeners || {};
    const memoListeners = memo.listeners || {};
	instance.listeners = { ...classListeners, ...memoListeners };
}

export async function applyUpdates(
	instance: WireComponent,
	updates: Record<string, unknown>,
) {
	for (const [prop, value] of Object.entries(updates)) {
		if (isReservedProperty(prop)) continue;

		if (prop in instance) {
            const currentVal = (instance as any)[prop];
            
            if (currentVal instanceof WireFile) {
                await instance.updating(prop, value);
                currentVal.populate(Array.isArray(value) ? value : [value], instance, prop);
                
                // Only clear errors if NO new errors were added during populate
                // But populate adds errors. 
                // instance.clearErrors(prop) clears ALL errors for prop.
                // We should clear BEFORE populate?
                // Livewire clears before validation usually.
                
                // instance.clearErrors(prop); // Let's clear before populate? 
                // But populate is synchronous here (in my impl).
                // If I clear after, I wipe the errors I just added.
                // So clear FIRST.
                
                // Wait, if I clear first, I clear previous errors.
                // Re-populating implies new input, so clearing old errors is correct.
                
                // Let's modify the order:
                instance.clearErrors(prop);
                currentVal.populate(Array.isArray(value) ? value : [value], instance, prop);
                
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

export async function executeMethod(
	instance: WireComponent,
	method: string,
	params: unknown[],
): Promise<{ error?: { code: number; data: { error: string } } } | void> {
	const FORBIDDEN_METHODS = [
		"mount",
		"render",
		"hydrated",
		"updated",
		"updating",
		"rendered",
		"view",
		"emit",
		"redirect",
		"addError",
		"clearErrors",
		"fill",
		"getPublicProperties",
		"constructor",
		"getDataForRender",
		"validate",
		"stream",
	];

	if (FORBIDDEN_METHODS.includes(method) || method.startsWith("_")) {
		return {
			error: {
				code: WireErrors.method_not_allowed.code,
				data: WireErrors.method_not_allowed,
			},
		};
	}

	if (method === "$set") {
		if (params.length === 2) {
			const [prop, value] = params;
			if (typeof prop === "string" && !isReservedProperty(prop)) {
				await instance.updating(prop, value);
				(instance as any)[prop] = value;
				instance.clearErrors(prop);
				await instance.updated(prop, value);
			}
		}
	} else if (method === "$refresh") {
		await instance.updated("$refresh", null);
	} else if (method === "$unmount") {
		await instance.unmount();
	} else if (typeof (instance as any)[method] === "function") {
		await (instance as any)[method](...params);
	} else {
        if (!instance.kire.$silent) {
            console.error(`[Wired] Method not found: ${method} on ${instance.constructor.name}`);
        }
        return {
            error: {
                code: WireErrors.method_not_found.code,
                data: { error: `Method '${method}' not found on component '${instance.constructor.name}'` },
            }
        }
    }
}

export async function renderComponent(
	instance: WireComponent,
): Promise<string> {
	let html = (instance as any).render();
	if (typeof html === "string") {
		const data = {
			...instance.getDataForRender(),
			errors: instance.__errors,
		};

		const keys = Object.keys(data).filter((k) =>
			/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k),
		);
        
		const injection = keys.length
			? `<?js let { ${keys.join(", ")} } = $ctx.$props; ?>`
			: "";
        
		html = await instance.kire.render(injection + html, data);
	} else {
		html = await html;
	}
	await instance.rendered();
	return (
		html || `<div wire:id="${instance.__id}" style="display: none;"></div>`
	);
}

export function createResponse(
	instance: WireComponent,
	memo: WireSnapshot["memo"],
	html: string,
	updates: Record<string, unknown> | undefined,
	checksum: ChecksumManager,
	identifier: string,
	compName: string,
) {
	const newData = instance.getPublicProperties();

	// Update Memo
	memo.errors =
		Object.keys(instance.__errors).length > 0 ? instance.__errors : [];
	memo.listeners = instance.listeners;

	const newChecksum = checksum.generate(newData, memo, identifier);
	const finalSnapshot = { data: newData, memo: memo, checksum: newChecksum };

	const escapedSnapshot = JSON.stringify(finalSnapshot)
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;");
	const style = !html || !html.trim() ? ' style="display: none;"' : "";

	const wrappedHtml = `<div wire:id="${instance.__id}" wire:snapshot="${escapedSnapshot}" wire:component="${compName}"${style}>${html || ""}</div>`;

	const effects: WireResponse["components"][0]["effects"] = {
		html: wrappedHtml,
		dirty: updates ? Object.keys(updates) : [],
	};

	if (instance.__events.length > 0) {
		effects.emits = instance.__events.map((e) => ({
			event: e.name,
			params: e.params,
		}));
    }

	if (instance.__streams.length > 0)
		(effects as any).streams = instance.__streams;

	if (instance.__redirect) effects.redirect = instance.__redirect;
	if (Object.keys(instance.__errors).length > 0)
		effects.errors = instance.__errors as any;
	if (Object.keys(instance.listeners).length > 0)
		effects.listeners = instance.listeners;

	// Handle Query String Sync
	if (instance.queryString && instance.queryString.length > 0) {
		const queryParams = new URLSearchParams();
		for (const key of instance.queryString) {
			const val = (instance as any)[key];
			if (val !== undefined && val !== null && val !== "") {
				queryParams.set(key, String(val));
			}
		}
		effects.url = queryParams.toString();
	}

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
