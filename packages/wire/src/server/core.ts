import { randomUUID } from "node:crypto";
import type { Kire } from "kire";
import type { WireComponent } from "./component";
import type {
	WireContext,
	WireOptions,
	WirePayload,
	WireResponse,
    WireSnapshot,
} from "./types";
import { WireChecksum } from "./utils/checksum";

export class WireCore {
	private static instance: WireCore;
	private options: WireOptions;
	private checksum: WireChecksum;
	private components: Map<string, new () => WireComponent> = new Map();
	private kireInstance?: Kire;

	private constructor() {
		this.options = {
			method: "http",
			route: "/_kirewire",
			cookiename: ".kirewire",
			cookieexpire: "15m",
			cookiehttp: true,
			secret: randomUUID(),
		};
		this.checksum = new WireChecksum(this.options.secret!);
	}

	public static get(): WireCore {
		if (!WireCore.instance) {
			WireCore.instance = new WireCore();
		}
		return WireCore.instance;
	}

	public init(kire: Kire, options: WireOptions) {
		this.kireInstance = kire;
		this.options = { ...this.options, ...options };
		this.checksum = new WireChecksum(this.options.secret || randomUUID());
	}

	public getKire(): Kire {
		if (!this.kireInstance) throw new Error("WireCore not initialized");
		return this.kireInstance;
	}

	public registerComponent(
		name: string,
		componentClass: new () => WireComponent,
	) {
		this.components.set(name, componentClass);
	}

	public getComponentClass(name: string) {
		return this.components.get(name);
	}

	public getChecksum() {
		return this.checksum;
	}

	public getOptions() {
		return this.options;
	}

	public async handleRequest(
		payload: WirePayload,
		contextOverrides: Partial<WireContext> = {},
	): Promise<WireResponse | { error: string }> {
		const { component, snapshot: snapshotStr, method, params, updates, _token } = payload;

        // Optional: Token validation logic here if _token is strictly required
        // if (!_token) return { error: "Missing validation token" };

        let snapshot: WireSnapshot;
		let state: Record<string, any> = {};
        let memo: WireSnapshot['memo'] = {
            id: randomUUID(),
            name: component,
            path: "/",
            method: "GET",
            children: [],
            scripts: [],
            assets: [],
            errors: [],
            locale: "en",
        };

		if (snapshotStr) {
			try {
                snapshot = JSON.parse(snapshotStr);
                
                if (!this.checksum.verify(snapshot.checksum, snapshot.data, snapshot.memo)) {
                     return { error: "Invalid snapshot checksum" };
                }

				state = snapshot.data;
                memo = snapshot.memo;

			} catch (_e) {
				return { error: "Invalid snapshot format" };
			}
		}

		const ComponentClass = this.components.get(component || memo.name);
		if (!ComponentClass) {
			return { error: "Component not found" };
		}

		const instance = new ComponentClass();
		instance.kire = this.getKire();
		instance.context = { kire: this.getKire(), ...contextOverrides };

        // Restore ID if available
        if(memo.id) instance.__id = memo.id;

		try {
			instance.fill(state);
			await instance.hydrated();

			// Process deferred updates or multi-updates first
			if (updates && typeof updates === "object") {
				for (const [prop, value] of Object.entries(updates)) {
					if (prop && typeof prop === "string" && !prop.startsWith("_")) {
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
					console.warn(
						`Attempt to call forbidden method ${method} on component ${component}`,
					);
					return { error: "Method not allowed" };
				}

				const args = Array.isArray(params) ? params : [];

				if (method === "$set" && args.length === 2) {
					const [prop, value] = args;
					if (prop && typeof prop === "string" && !prop.startsWith("_")) {
						(instance as any)[prop] = value;
						instance.clearErrors(prop); // Clear error on update
						await instance.updated(prop, value);
					}
				} else if (method === "$refresh") {
					await instance.updated("$refresh", null);
				} else if (typeof (instance as any)[method] === "function") {
					await (instance as any)[method](...args);
					await instance.updated(method, args[0]);
				} else {
					console.warn(`Method ${method} not found on component ${component}`);
				}
			}

			let html = await instance.render();
			await instance.rendered();

            if (!html || !html.trim()) {
                html = `<div wire:id="${instance.__id}" style="display: none;"></div>`;
            }

			const newData = instance.getPublicProperties();
            const events = instance.__events;
			const redirect = instance.__redirect;
			const errors = instance.__errors;

            // Update Memo
            memo.errors = Object.keys(errors).length > 0 ? errors : [];
            memo.listeners = instance.listeners;

            // Generate new checksum
            const newChecksum = this.checksum.generate(newData, memo);
            
            const finalSnapshot = {
                data: newData,
                memo: memo,
                checksum: newChecksum
            };

            const effects: WireResponse['components'][0]['effects'] = {
                html,
                dirty: updates ? Object.keys(updates) : [],
            };

            if (events.length > 0) effects.emits = events.map(e => ({ event: e.name, params: e.params }));
            if (redirect) effects.redirect = redirect;
            if (Object.keys(errors).length > 0) effects.errors = errors as any;
            
            if (Object.keys(instance.listeners).length > 0) {
                effects.listeners = instance.listeners;
            }

			return {
                components: [
                    {
                        snapshot: JSON.stringify(finalSnapshot),
                        effects
                    }
                ]
			};
		} catch (e: any) {
			console.error(`Error processing component ${component}:`, e);
			return { error: e.message || "Internal Server Error" };
		}
	}
}
