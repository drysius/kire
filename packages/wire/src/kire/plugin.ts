import type { Kire } from "kire";
import type { Kirewire } from "../kirewire";

export interface KirewirePluginOptions {
	/** URL of the client runtime bundle injected by `@kirewireScripts`. */
	scriptUrl?: string;
}

/** Build a `{ key: expr }` params object literal from element attributes. */
function paramsFromAttributes(api: any): string {
	const attrs: Record<string, string> = api.node?.attributes ?? {};
	const parts: string[] = [];
	for (const [key, value] of Object.entries(attrs)) {
		if (key.startsWith("@") || key.startsWith("wire:")) continue;
		if (key.startsWith(":")) {
			parts.push(`${JSON.stringify(key.slice(1))}: (${api.transform(value)})`);
		} else {
			parts.push(`${JSON.stringify(key)}: ${JSON.stringify(value)}`);
		}
	}
	return `{ ${parts.join(", ")} }`;
}

/** Emit the render-time mount call. `this` in the compiled template is the engine. */
function emitMount(api: any, nameExpr: string, paramsExpr: string): void {
	api.markAsync();
	api.write(
		`$kire_response += await this.$globals.__kirewire.renderMount(this, ${nameExpr}, ${paramsExpr});`,
	);
}

/**
 * Register Kirewire's SSR integration with a Kire engine: the `@wire` directive,
 * the `<wire:*>` / `<kirewire:*>` / `<livewire:*>` elements, and the
 * `@kirewireScripts` client-runtime injector. The live `Kirewire` instance is
 * exposed to templates as the `__kirewire` global.
 */
export function kirewirePlugin(kirewire: Kirewire, options: KirewirePluginOptions = {}) {
	return {
		name: "kirewire",
		load(kire: Kire<boolean>) {
			kire.$global("__kirewire", kirewire);

			// @wire("name", { ...params })
			kire.directive({
				name: "wire",
				signature: ["name:string", "params:object"],
				description: "Mount a Kirewire reactive component.",
				onCall: (api: any) => {
					const nameExpr = api.getArgument(0);
					const paramsExpr = api.getArgument(1) || "{}";
					emitMount(api, nameExpr, paramsExpr);
				},
			});

			// <wire:counter :step="2" />, <kirewire:*>, <livewire:*>
			for (const prefix of ["wire", "kirewire", "livewire"]) {
				kire.element({
					name: `${prefix}:*`,
					void: true,
					description: `Mount a Kirewire component (<${prefix}:name />).`,
					onCall: (api: any) => {
						const name = api.wildcard ?? "";
						emitMount(api, JSON.stringify(name), paramsFromAttributes(api));
					},
				});
			}

			// @kirewireScripts — inject the client runtime once.
			const scriptUrl = options.scriptUrl ?? "/kirewire.js";
			kire.directive({
				name: "kirewireScripts",
				description: "Inject the Kirewire client runtime script tag.",
				onCall: (api: any) => {
					api.append(`<script src="${scriptUrl}" defer></script>`);
				},
			});
		},
	};
}
