import type { Kire } from "kire";
import { wireAttributeDocs, wireElementDocs } from "../schema.docs.js";
import {
	ElysiaAdapter,
	ElysiaPlugin,
	ExpressPlugin,
	KoaAdapter,
	KoaPlugin,
	VanillaAdapter,
} from "./adapters";
import {
	Component,
	type WireCollectionAction,
	type WireCollectionMode,
	type WireCollectionPayload,
} from "./component";
import type {
	ActionRequest,
	AdapterTransport,
	ComponentState,
	EffectPacket,
} from "./contracts";
import { Variable, Wire } from "./decorators";
import { FileStore } from "./features/file-store";
import { Rule, WireFile, WireUpload } from "./features/file-upload";
import {
	WireBroadcast,
	type WireBroadcastOptions,
} from "./features/wire-broadcast";
import {
	Kirewire,
	type KirewireOptions,
	type WireCacheStore,
} from "./kirewire";
import { FiveMAdapter } from "./methods/fivem";
import { HttpAdapter } from "./methods/http";
import { HttpSocketAdapter } from "./methods/http-socket";
import { HttpSseAdapter } from "./methods/http-sse";
import { SocketAdapter } from "./methods/socket";
import {
	type ValidationResult,
	validateRuleString as validateRule,
} from "./validation/rule";

const INTERPOLATION_GLOBAL_REGEX = /\{\{\s*([\s\S]+?)\s*\}\}/g;
const INTERPOLATION_PURE_REGEX = /^\s*\{\{\s*([\s\S]+?)\s*\}\}\s*$/;
const INTERPOLATION_START_REGEX = /\{\{/;

function toTemplateLiteral(value: string) {
	const escaped = value
		.replace(/\\/g, "\\\\")
		.replace(/`/g, "\\`")
		.replace(/\$/g, "\\$");

	return (
		"`" +
		escaped.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr) => `\${${expr}}`) +
		"`"
	);
}

function normalizeWirePropName(attrName: string) {
	const cleaned = String(attrName || "")
		.trim()
		.replace(/^[:@]/, "");
	if (!cleaned) return "";

	const camel = cleaned.replace(/[-:.]+([a-zA-Z0-9])/g, (_, next: string) =>
		next.toUpperCase(),
	);
	return camel.slice(0, 1).toLowerCase() + camel.slice(1);
}

function toWireLocalEntry(
	api: any,
	attrName: string,
	value: string,
	quoted: boolean,
) {
	const normalizedName = normalizeWirePropName(attrName);
	if (!normalizedName) return undefined;

	if (value === "" && !quoted && !attrName.startsWith(":")) {
		return {
			name: normalizedName,
			expression: "true",
		};
	}

	if (attrName.startsWith(":")) {
		return {
			name: normalizedName,
			expression: api.transform(value),
		};
	}

	if (!quoted) {
		return {
			name: normalizedName,
			expression: api.getAttribute(attrName),
		};
	}

	const trimmed = value.trim();
	if (
		trimmed.startsWith("{") &&
		trimmed.endsWith("}") &&
		trimmed.length > 2 &&
		!trimmed.startsWith("{{") &&
		!trimmed.endsWith("}}")
	) {
		return {
			name: normalizedName,
			expression: trimmed.slice(1, -1),
		};
	}

	const pureInterpolation = value.match(INTERPOLATION_PURE_REGEX);
	if (pureInterpolation) {
		return {
			name: normalizedName,
			expression: pureInterpolation[1]!,
		};
	}

	return {
		name: normalizedName,
		expression: INTERPOLATION_START_REGEX.test(value)
			? toTemplateLiteral(value)
			: JSON.stringify(value),
	};
}

function resolveWireElementCandidates(tagName: string): string[] {
	const raw = String(tagName || "").trim();
	if (!raw.includes(":")) return [];

	const [, ...rest] = raw.split(":");
	const path = rest.join(":").trim();
	if (!path) return [];

	const normalized = path
		.replace(/[\\/]+/g, ".")
		.replace(/:+/g, ".")
		.replace(/\.+/g, ".")
		.replace(/^\./, "")
		.replace(/\.$/, "");

	if (!normalized) return [];

	return [
		...new Set([
			normalized,
			`kirewire.${normalized}`,
			`livewire.${normalized}`,
			`components.${normalized}`,
		]),
	];
}

function writeWireComponentMount(
	api: any,
	componentLookupExpr: string,
	localsExpr: string,
) {
	api.markAsync();
	api.write(`{
                    const $wireComponentLookups = ${componentLookupExpr};
                    const $wireLookupList = Array.isArray($wireComponentLookups)
                        ? $wireComponentLookups
                        : [$wireComponentLookups];
                    const $locals = ${localsExpr};
                    const $userId = String($globals.user?.id || 'guest');
                    const $sessionId = String($globals.wireKey || $userId || 'guest');
                    const $pageId = String($globals.pageId || 'default-page');

                    let $componentName = '';
                    let $componentClass = null;
                    for (const $candidateRaw of $wireLookupList) {
                        const $candidate = String($candidateRaw || '').trim();
                        if (!$candidate) continue;
                        const $resolved = this.wire.components.get($candidate);
                        if (!$resolved) continue;
                        $componentName = $candidate;
                        $componentClass = $resolved;
                        break;
                    }

                    if (!$componentClass) {
                        const $attempted = [...new Set(
                            $wireLookupList
                                .map(($candidate) => String($candidate || '').trim())
                                .filter(Boolean)
                        )].join(', ');
                        $kire_response += \`<!-- Component "\${$attempted || 'unknown'}" not found -->\`;
                    } else {
                        const $page = this.wire.sessions.getPage($userId, $pageId, $sessionId);
                        const $id = this.wire.createComponentId();

                        const $instance = new $componentClass();
                        $instance.$id = $id;
                        $instance.$kire = this;
                        $instance.$wire_instance = this.wire;
                        $instance.$wire_scope_id = $sessionId;
                        $instance.$wire_page_id = $pageId;

                        const $listenerCleanup = this.wire.bindComponentListeners($instance, {
                            userId: $userId,
                            pageId: $pageId,
                            id: $id
                        });
                        this.wire.attachLifecycleGuards($instance, $listenerCleanup);
                        this.wire.applySafeLocals($instance, $locals);

                        await $instance.mount();
                        $page.components.set($id, $instance);

                        const $rendered = await $instance.render();
                        const $html = $rendered.toString();
                        const $finalState = $instance.getPublicState();
                        const $finalStateStr = JSON.stringify($finalState).replace(/'/g, "&#39;");

                        $kire_response += \`<div wire:id="\${$id}" wire:state='\${$finalStateStr}'>\${$html}</div>\`;
                    }
                }`);
}

export class KirewirePlugin {
	public wire!: Kirewire;
	public options: KirewireOptions;

	constructor(options: KirewireOptions) {
		this.options = options;
	}

	public load(kire: Kire) {
		kire.kireSchema({
			name: "@kirejs/wire",
			description:
				"Reactive component runtime for Kire with Livewire-style server actions and DOM updates.",
			author: "Drysius",
			repository: "https://github.com/drysius/kire",
			version: "0.1.0",
		});
		this.wire = new Kirewire(this.options);
		(kire as any).$wire = this.wire;
		(kire as any).wired = (nameOrClass: string | any, ComponentClass?: any) => {
			this.wire.wired(nameOrClass as any, ComponentClass as any);
			return kire;
		};

		const setup = (instance: any) => {
			instance.wire = this.wire;
			instance.$wire = this.wire;
		};

		setup(kire);
		kire.onFork(setup);

		// Register default properties
		this.wire.class("file", WireFile);
		this.wire.class("upload", WireUpload as any);
		this.wire.class("broadcast", WireBroadcast);
		kire.type({
			variable: "$wire",
			type: "global",
			comment: "Active Kirewire runtime instance available to templates.",
			tstype: "import('@kirejs/wire').Kirewire",
		});
		for (const attr of wireAttributeDocs) {
			kire.attribute(attr as any);
		}

		kire.directive({
			name: "wire:id",
			signature: ["id:string", "state:object"],
			children: false,
			description:
				"Low-level helper that writes the internal wire:id and wire:state attributes on a component root.",
			example: '@wire:id(id: "cmp-1", state: { count: 1 })',
			onCall: (api) => {
				const id = api.getAttribute("id");
				const state = api.getAttribute("state") || "{}";

				api.write(`{
                    const $state = ${state};
                    const $id = ${id};
                    const $stateStr = JSON.stringify($state).replace(/'/g, "&#39;");
                    $kire_response += \` wire:id="\${$id}" wire:state='\${$stateStr}'\`;
                }`);
			},
		});

		kire.directive({
			name: "kirewire",
			children: false,
			description:
				"Injects the Kirewire client runtime, transport metadata and bootstrap script into the page.",
			example: "@kirewire()",
			onCall: (api) => {
				api.write(`{
                    const $pageId = $globals.pageId || 'default-page';
                    const $sessionId = String($globals.wireKey || $globals.user?.id || 'guest');
                    const $busDelay = ${this.wire.options.bus_delay || 100};
                    const $transport = $globals.sharedTransport || 'sse';
                    const $wireUrl = (this.wire.options.adapter && typeof this.wire.options.adapter.getClientUrl === 'function')
                        ? this.wire.options.adapter.getClientUrl()
                        : '/_wire';
                    const $uploadUrl = (this.wire.options.adapter && typeof this.wire.options.adapter.getUploadUrl === 'function')
                        ? this.wire.options.adapter.getUploadUrl()
                        : ($wireUrl.replace(/\\/+$/, '') + '/upload');
                    const $previewUrl = this.wire.getReference('wire:preview-url', { adapter: this.wire.options.adapter })
                        || (($wireUrl.replace(/\\/+$/, '') + '/preview'));
                    const $pageIdAttr = String($pageId).replace(/"/g, '&quot;');
                    const $sessionIdAttr = String($sessionId).replace(/"/g, '&quot;');
                    const $wireUrlAttr = String($wireUrl).replace(/"/g, '&quot;');
                    const $uploadUrlAttr = String($uploadUrl).replace(/"/g, '&quot;');
                    const $previewUrlAttr = String($previewUrl).replace(/"/g, '&quot;');
                    const $transportAttr = String($transport).replace(/"/g, '&quot;');
                    $kire_response += \`
                        <meta name="kirewire:page-id" content="\${$pageIdAttr}">
                        <meta name="kirewire:session-id" content="\${$sessionIdAttr}">
                        <meta name="kirewire:url" content="\${$wireUrlAttr}">
                        <meta name="kirewire:upload-url" content="\${$uploadUrlAttr}">
                        <meta name="kirewire:preview-url" content="\${$previewUrlAttr}">
                        <meta name="kirewire:transport" content="\${$transportAttr}">
                        <meta name="kirewire:bus-delay" content="\${Number($busDelay) || 0}">
                        <script type="module" src="\${$wireUrl}/kirewire.js" data-kirewire-skip></script>
                        <script type="module" data-kirewire-skip>
                            window.__WIRE_INITIAL_CONFIG__ = Object.assign({}, window.__WIRE_INITIAL_CONFIG__ || {}, {
                                pageId: \${JSON.stringify($pageId)},
                                sessionId: \${JSON.stringify($sessionId)},
                                url: \${JSON.stringify($wireUrl)},
                                uploadUrl: \${JSON.stringify($uploadUrl)},
                                previewUrl: \${JSON.stringify($previewUrl)},
                                transport: \${JSON.stringify($transport)},
                                busDelay: \${Number($busDelay) || 0}
                            });
                            let __kirewireInitAttempts = 0;
                            const init = () => {
                                if (window.Kirewire && window.Alpine) {
                                    if (window.Kirewire.configure) {
                                        window.Kirewire.configure(window.__WIRE_INITIAL_CONFIG__ || {});
                                    }
                                    Kirewire.start(window.Alpine);
                                    if (window.Kirewire.bus) {
                                        window.Kirewire.bus.setDelay(Number(\${$busDelay}) || 0);
                                    }
                                    return;
                                } else {
                                    __kirewireInitAttempts += 1;
                                    const waitMs = Math.min(320, 24 + (__kirewireInitAttempts * 8));
                                    setTimeout(init, waitMs);
                                }
                            };
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', init, { once: true });
                            } else {
                                init();
                            }
                        </script>
                    \`;
                }`);
			},
		});

		kire.directive({
			name: "wire",
			signature: ["name:string", "locals:object"],
			children: false,
			description:
				"Mounts a registered Kirewire component, renders its initial HTML and emits the hydration payload.",
			example: '@wire("chat-message-list", { roomId: room.id })',
			onCall: (api) => {
				const nameExpr = api.getArgument(0) || api.getAttribute("name");
				const localsExpr =
					api.getArgument(1) || api.getAttribute("locals") || "{}";
				writeWireComponentMount(api, `[${nameExpr}]`, localsExpr);
			},
		});

		const wireElementDocsByName = new Map(
			wireElementDocs.map((entry) => [entry.name, entry]),
		);
		const registerWireElement = (name: string) => {
			const doc = wireElementDocsByName.get(name);
			kire.element({
				name,
				description: doc?.description,
				example: doc?.example,
				onCall: (api) => {
					const candidates = resolveWireElementCandidates(
						api.node.tagName || "",
					);
					const attrs = api.node.attributes || {};
					const attrMeta = api.node.attributeMeta || {};
					const locals = Object.keys(attrs)
						.filter(
							(key) =>
								!key.startsWith("@") &&
								!key.startsWith("wire:") &&
								!key.startsWith("x-"),
						)
						.map((key) => {
							const entry = toWireLocalEntry(
								api,
								key,
								attrs[key]!,
								!!attrMeta[key]?.quoted,
							);
							if (!entry) return "";
							return `${JSON.stringify(entry.name)}: ${entry.expression}`;
						})
						.filter(Boolean)
						.join(",");

					writeWireComponentMount(
						api,
						JSON.stringify(candidates),
						locals ? `{ ${locals} }` : "{}",
					);
				},
			});
		};

		registerWireElement("wire:*");
		registerWireElement("kirewire:*");
		registerWireElement("livewire:*");

		if (this.wire.options.adapter) {
			this.wire.options.adapter.install(this.wire, kire);
			if (
				this.wire.options.autoclean === true &&
				typeof this.wire.options.adapter.autoCleanUploads === "function"
			) {
				try {
					this.wire.options.adapter.autoCleanUploads();
				} catch (error) {
					console.warn(
						"[Kirewire] Failed to auto clean upload storage:",
						error,
					);
				}
			}
		}
	}
}

export class PageComponent extends Component {
	render() {
		return this.view(""); // Should be overridden
	}
}

export const wirePlugin = KirewirePlugin;
export const WirePlugin = KirewirePlugin;
export {
	type ActionRequest,
	type AdapterTransport,
	Component,
	type ComponentState,
	type EffectPacket,
	ElysiaAdapter,
	ElysiaPlugin,
	ExpressPlugin,
	FileStore,
	FiveMAdapter,
	HttpAdapter,
	HttpSocketAdapter,
	HttpSseAdapter,
	Kirewire,
	type KirewireOptions,
	KoaAdapter,
	KoaPlugin,
	Rule,
	SocketAdapter,
	type ValidationResult,
	VanillaAdapter,
	Variable,
	validateRule,
	Wire,
	WireBroadcast,
	type WireBroadcastOptions,
	type WireCacheStore,
	type WireCollectionAction,
	type WireCollectionMode,
	type WireCollectionPayload,
	WireFile,
	WireUpload,
};
export default {
	Component,
	FileStore,
	FiveMAdapter,
	HttpAdapter,
	HttpSocketAdapter,
	HttpSseAdapter,
	Kirewire,
	ElysiaAdapter,
	ElysiaPlugin,
	ExpressPlugin,
	KoaAdapter,
	KoaPlugin,
	VanillaAdapter,
	Variable,
	Wire,
	Rule,
	SocketAdapter,
	WireBroadcast,
	WireFile,
	WireUpload,
	validateRule,
};
