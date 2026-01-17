import type { Kire } from "kire";
import type {
	WireContext,
	WirePayload,
	WireResponse,
	WireSnapshot,
} from "../../types";
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

	const {
		component,
		snapshot: snapshotStr,
		method,
		params,
		updates,
	} = payload;

	let snapshot: WireSnapshot | undefined;
	let state: Record<string, any> = {};

	// 1. Identify Component Name
	let compName = component;
	if (!compName && snapshotStr) {
		try {
			const tempSnap = JSON.parse(snapshotStr);
			compName = tempSnap.memo?.name;
		} catch (e) {
			// ignore
		}
	}

	// 2. Check if component exists
	const ComponentClass = compName ? registry.get(compName) : undefined;
	if (!ComponentClass) {
		return {
			code: WireErrors.invalid_request.code,
			data: { error: "Component not found" },
		};
	}

	const instance = new ComponentClass();
	let memo: WireSnapshot["memo"] = {
		id: instance.__id,
		name: compName!,
		path: "/",
		method: "GET",
		children: [],
		scripts: [],
		assets: [],
		errors: [],
		locale: "en",
		listeners: instance.listeners || {},
	};

	// 3. Parse and Validate Snapshot (if provided)
	if (snapshotStr) {
		try {
			snapshot = JSON.parse(snapshotStr);
		} catch (e) {
			return {
				code: WireErrors.invalid_request.code,
				data: { error: "Invalid snapshot format" },
			};
		}

		if (!snapshot || !snapshot.checksum || !snapshot.data || !snapshot.memo) {
			return {
				code: WireErrors.incomplete_snapshot.code,
				data: WireErrors.incomplete_snapshot,
			};
		}

		// 4. Verify Checksum
		if (
			!checksum.verify(
				snapshot.checksum,
				snapshot.data,
				snapshot.memo,
				identifier,
			)
		) {
			return {
				code: WireErrors.invalid_checksum.code,
				data: WireErrors.invalid_checksum,
			};
		}

		state = snapshot.data;
		memo = snapshot.memo;
	}

	instance.kire = kire;
	instance.context = { kire: kire, ...contextOverrides };
	if (memo.id) instance.__id = memo.id;
	instance.listeners = memo.listeners || {};

	try {
		instance.fill(state);
		await instance.hydrated();

		if (updates && typeof updates === "object") {
			for (const [prop, value] of Object.entries(updates)) {
				if (
					prop === "__proto__" ||
					prop === "constructor" ||
					prop === "prototype" ||
					prop === "kire" ||
					prop === "context" ||
					prop.startsWith("_")
				) {
					continue;
				}

				if (prop in instance) {
					(instance as any)[prop] = value;
					instance.clearErrors(prop);
				}
			}
		}

		if (method) {
			const FORBIDDEN_METHODS = [
				"mount",
				"render",
				"hydrated",
				"updated",
				"rendered",
				"view",
				"emit",
				"redirect",
				"addError",
				"clearErrors",
				"fill",
				"getPublicProperties",
				"constructor",
			];

			if (FORBIDDEN_METHODS.includes(method) || method.startsWith("_")) {
				return {
					code: WireErrors.method_not_allowed.code,
					data: WireErrors.method_not_allowed,
				};
			}

			const args = Array.isArray(params) ? params : [];

			if (method === "$set" && args.length === 2) {
				const [prop, value] = args;
				if (
					typeof prop === "string" &&
					prop !== "__proto__" &&
					prop !== "constructor" &&
					prop !== "prototype" &&
					prop !== "kire" &&
					prop !== "context" &&
					!prop.startsWith("_")
				) {
					(instance as any)[prop] = value;
					instance.clearErrors(prop);
					await instance.updated(prop, value);
				}
			} else if (method === "$refresh") {
				await instance.updated("$refresh", null);
			} else if (typeof (instance as any)[method] === "function") {
				await (instance as any)[method](...args);
				await instance.updated(method, args[0]);
			}
		}

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

		if (!html || !html.trim()) {
			html = `<div wire:id="${instance.__id}" style="display: none;"></div>`;
		}

		const newData = instance.getPublicProperties();
		const events = instance.__events;
		const redirect = instance.__redirect;
		const errors = instance.__errors;

		memo.errors = Object.keys(errors).length > 0 ? errors : [];
		memo.listeners = instance.listeners;

		const newChecksum = checksum.generate(newData, memo, identifier);

		const finalSnapshot = {
			data: newData,
			memo: memo,
			checksum: newChecksum,
		};

        const escapedSnapshot = JSON.stringify(finalSnapshot).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const style = (!html || !html.trim()) ? ' style="display: none;"' : '';
        
        // Wrap the HTML to ensure the root element carries the Wire attributes, preserving the structure
        // created by the directive.
        const wrappedHtml = `<div wire:id="${instance.__id}" wire:snapshot="${escapedSnapshot}" wire:component="${compName}" x-data="kirewire"${style}>${html || ''}</div>`;

		const effects: WireResponse["components"][0]["effects"] = {
			html: wrappedHtml,
			dirty: updates ? Object.keys(updates) : [],
		};

		if (events.length > 0)
			effects.emits = events.map((e) => ({
				event: e.name,
				params: e.params,
			}));
		if (redirect) effects.redirect = redirect;
		if (Object.keys(errors).length > 0) effects.errors = errors as any;
		if (Object.keys(instance.listeners).length > 0)
			effects.listeners = instance.listeners;

		return {
			code: 200,
			data: {
				components: [
					{
						snapshot: JSON.stringify(finalSnapshot),
						effects,
					},
				],
			},
		};
	} catch (e: any) {
		console.error("Error processing component", compName, ":", e);
		return {
			code: WireErrors.server_error.code,
			data: { error: e.message || "Internal Server Error" },
		};
	}
}
