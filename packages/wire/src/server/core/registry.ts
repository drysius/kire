import type { Kire } from "kire";
import type { WireComponent } from "../component";

export class ComponentRegistry {
	private components = new Map<string, new () => WireComponent>();
	private kire: Kire | undefined;

	constructor() {}

	public setKire(kire: Kire) {
		this.kire = kire;
		// Sync with cache if needed
		const cache = this.kire.cached("@kirejs/wire");
		cache.set("components", this.components);
	}

	public register(name: string, component: new () => WireComponent) {
		this.components.set(name, component);
		if (this.kire) {
			const cache = this.kire.cached("@kirejs/wire");
			cache.set("components", this.components);
		}
	}

	public get(name: string): (new () => WireComponent) | undefined {
		// First check local map
		if (this.components.has(name)) {
			return this.components.get(name);
		}

		// Fallback to cache if kire is available (e.g. for cross-plugin access)
		if (this.kire) {
			const cache = this.kire.cached("@kirejs/wire");
			const cachedComps = cache.get("components");
			if (cachedComps && cachedComps.has(name)) {
				return cachedComps.get(name);
			}
		}

		return undefined;
	}
}

export const registry = new ComponentRegistry();
