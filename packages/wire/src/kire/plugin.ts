import type { Kire } from "kire";
import type { Kirewire } from "../kirewire";

export interface KirewirePluginOptions {
	/** URL of the client runtime bundle injected by `@kirewireScripts`. */
	scriptUrl?: string;
	/** Update endpoint the client posts to (default `/_wire`). */
	path?: string;
	/**
	 * WebSocket endpoint path. When set, `@kirewireScripts` tells the client to
	 * use the duplex WebSocket transport (instead of HTTP POST) by emitting
	 * `data-kirewire-ws`. The value is a path (e.g. `/_wire/ws`); the client
	 * resolves it against the page origin as `ws(s)://…`.
	 */
	wsPath?: string;
	/**
	 * Server-push channel the client subscribes to on connect (SSE/WebSocket).
	 * Emitted as `data-kirewire-channel`.
	 */
	channel?: string;
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
export function kirewirePlugin(
	kirewire: Kirewire,
	options: KirewirePluginOptions = {},
) {
	return {
		name: "kirewire",
		load(kire: Kire<boolean>) {
			kire.$global("__kirewire", kirewire);

			// @wire("name", { ...params })
			kire.directive({
				name: "wire",
				signature: ["name:string", "params:object"],
				description: "Mount a Kirewire reactive component.",
				example: `@wire("counter", { start: 0 })`,
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
					example: `<${prefix}:counter :start="0" />`,
					onCall: (api: any) => {
						const name = api.wildcard ?? "";
						emitMount(api, JSON.stringify(name), paramsFromAttributes(api));
					},
				});
			}

			// @kirewireScripts — inject the client runtime once. `data-kirewire-url`
			// tells the auto-boot bundle which endpoint to post updates to.
			const scriptUrl = options.scriptUrl ?? "/kirewire.js";
			const updatePath = options.path ?? "/_wire";
			const wsAttr = options.wsPath
				? ` data-kirewire-ws="${options.wsPath}"`
				: "";
			const channelAttr = options.channel
				? ` data-kirewire-channel="${options.channel}"`
				: "";
			kire.directive({
				name: "kirewireScripts",
				description: "Inject the Kirewire client runtime script tag.",
				example: "@kirewireScripts",
				onCall: (api: any) => {
					api.append(
						`<script src="${scriptUrl}" data-kirewire-url="${updatePath}"${wsAttr}${channelAttr} defer></script>`,
					);
				},
			});
		},
	};
}
