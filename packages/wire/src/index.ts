import type { Kire } from "kire";
import {
	ElysiaAdapter,
	ElysiaPlugin,
	ExpressPlugin,
	KoaAdapter,
	KoaPlugin,
	VanillaAdapter,
} from "./adapters";
import { HttpSocketAdapter } from "./methods/http-socket";
import { HttpSseAdapter } from "./methods/http-sse";
import { FiveMAdapter } from "./methods/fivem";
import { HttpAdapter } from "./methods/http";
import { SocketAdapter } from "./methods/socket";
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
import {
	type ValidationResult,
	validateRuleString as validateRule,
} from "./validation/rule";

export class KirewirePlugin {
	public wire!: Kirewire;
	public options: KirewireOptions;

	constructor(options: KirewireOptions) {
		this.options = options;
	}

	public load(kire: Kire) {
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

		kire.directive({
			name: "wire:id",
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
			onCall: (api) => {
				const nameExpr = api.getArgument(0) || api.getAttribute("name");
				const localsExpr =
					api.getArgument(1) || api.getAttribute("locals") || "{}";

				api.markAsync();
                api.write(`{
                    const $name = (${nameExpr}).replace(/^['"]|['"]$/g, '');
                    const $locals = ${localsExpr};
                    const $userId = String($globals.user?.id || 'guest');
                    const $sessionId = String($globals.wireKey || $userId || 'guest');
                    const $pageId = String($globals.pageId || 'default-page');

                    const $componentClass = this.wire.components.get($name);
                    if (!$componentClass) {
                        $kire_response += \`<!-- Component "\${$name}" not found -->\`;
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
			},
		});

		if (this.wire.options.adapter) {
			this.wire.options.adapter.install(this.wire, kire);
			if (
				this.wire.options.autoclean === true &&
				typeof this.wire.options.adapter.autoCleanUploads === "function"
			) {
				try {
					this.wire.options.adapter.autoCleanUploads();
				} catch (error) {
					console.warn("[Kirewire] Failed to auto clean upload storage:", error);
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
	FileStore,
	FiveMAdapter,
	HttpAdapter,
	HttpSocketAdapter,
	HttpSseAdapter,
	Kirewire,
	type KirewireOptions,
	type WireCacheStore,
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
	type ValidationResult,
	validateRule,
	WireBroadcast,
	type WireBroadcastOptions,
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
