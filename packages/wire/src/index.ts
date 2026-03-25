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

const wireEventModifierDocs = [
	{
		name: "prevent",
		description: "Prevent the browser default action before dispatching the wire event.",
	},
	{
		name: "stop",
		description: "Stop DOM event propagation after the wire handler runs.",
	},
	{
		name: "self",
		description: "Only react when the event originates from the element itself.",
	},
	{
		name: "once",
		description: "Run the listener only once for the current element.",
	},
];

const wireAttributeDocs = [
	{
		name: "wire:model",
		type: "javascript",
		description:
			"Synchronizes an input, textarea or select value with component state.",
		example: '<input wire:model="title" />',
		extends: [
			{
				name: "live",
				description:
					"Send updates immediately instead of waiting for an action.",
			},
			{
				name: "defer",
				description:
					"Queue updates locally and flush them on the next component call.",
			},
			{
				name: "debounce",
				description:
					"Debounce outgoing updates. You can append a duration like .debounce.300ms.",
				signature: ["duration:string"],
			},
			{
				name: "lazy",
				description: "Update on blur for text-like inputs.",
			},
			{
				name: "blur",
				description: "Update when the field loses focus.",
			},
		],
	},
	{
		name: "wire:click",
		type: "javascript",
		description: "Calls a component method when the element is clicked.",
		example: '<button wire:click="save">Save</button>',
		extends: wireEventModifierDocs,
	},
	{
		name: "wire:init",
		type: "javascript",
		description: "Runs a component action once the element is initialized.",
		example: '<div wire:init="loadStats"></div>',
	},
	{
		name: "wire:loading",
		type: "string",
		description:
			"Shows, hides or decorates an element while one or more component actions are running.",
		example: '<div wire:loading>Saving...</div>',
		extends: [
			{
				name: "remove",
				description: "Invert the default visibility behaviour.",
			},
			{
				name: "class",
				description: "Toggle a CSS class instead of toggling visibility.",
			},
			{
				name: "attr",
				description: "Toggle an attribute instead of toggling visibility.",
			},
			{
				name: "failsafe",
				description:
					"Force cleanup after a timeout. You can append a duration like .failsafe.30s.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:target",
		type: "string",
		description:
			"Limits another wire directive, such as wire:loading, to one or more specific actions or state paths.",
		example: '<div wire:loading wire:target="save,remove">Working...</div>',
	},
	{
		name: "wire:poll",
		type: "javascript",
		description:
			"Periodically triggers a component action or refresh while the page is active.",
		example: '<div wire:poll.5s="$refresh"></div>',
		extends: [
			{
				name: "visible",
				description: "Only poll while the element is visible in the viewport.",
			},
			{
				name: "once",
				description: "Stop polling after the first successful run.",
			},
			{
				name: "throttle",
				description:
					"Throttle polling triggers. You can append a duration like .throttle.500ms.",
				signature: ["duration:string"],
			},
			{
				name: "debounce",
				description:
					"Debounce polling triggers. You can append a duration like .debounce.500ms.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:intersect",
		type: "javascript",
		description:
			"Calls a component action when the element intersects the viewport or a specific edge.",
		example: '<div wire:intersect.once="loadMore"></div>',
		extends: [
			{
				name: "once",
				description: "Disconnect the observer after the first match.",
			},
			{
				name: "top",
				description: "Only trigger when the intersection touches the top edge.",
			},
			{
				name: "bottom",
				description: "Only trigger when the intersection touches the bottom edge.",
			},
			{
				name: "left",
				description: "Only trigger when the intersection touches the left edge.",
			},
			{
				name: "right",
				description: "Only trigger when the intersection touches the right edge.",
			},
			{
				name: "throttle",
				description:
					"Throttle observer callbacks. You can append a duration like .throttle.250ms.",
				signature: ["duration:string"],
			},
			{
				name: "debounce",
				description:
					"Debounce observer callbacks. You can append a duration like .debounce.250ms.",
				signature: ["duration:string"],
			},
		],
	},
	{
		name: "wire:show",
		type: "javascript",
		description: "Shows or hides an element based on a component state expression.",
		example: '<div wire:show="open">Panel</div>',
	},
	{
		name: "wire:dirty",
		type: "string",
		description:
			"Marks an element when a bound model value has diverged from the last server snapshot.",
		example: '<div wire:dirty.class="ring-amber-400"></div>',
		extends: [
			{
				name: "class",
				description: "Toggle a CSS class while the element is dirty.",
			},
			{
				name: "attr",
				description: "Toggle an attribute while the element is dirty.",
			},
		],
	},
	{
		name: "wire:ignore",
		type: "boolean",
		description:
			"Exclude the element from DOM morphing performed by Kirewire updates.",
		example: '<div wire:ignore></div>',
		extends: [
			{
				name: "self",
				description: "Ignore updates only for the current element, not its children.",
			},
		],
	},
	{
		name: "wire:offline",
		type: "string",
		description:
			"React to offline state changes by toggling visibility, classes or attributes.",
		example: '<div wire:offline.class="opacity-50">Offline</div>',
		extends: [
			{
				name: "class",
				description: "Toggle a CSS class while offline.",
			},
			{
				name: "attr",
				description: "Toggle an attribute while offline.",
			},
		],
	},
	{
		name: "wire:collection",
		type: "string",
		description:
			"Targets an element as a DOM collection sink for streamed collection updates.",
		example: '<ul wire:collection="todos"></ul>',
		extends: [
			{
				name: "empty",
				description:
					"Treat the element as the empty-state placeholder for the collection.",
			},
		],
	},
	{
		name: "wire:broadcast",
		type: "string",
		description:
			"Subscribes the current component tree to a named broadcast channel.",
		example: '<section wire:broadcast="chat.room.1"></section>',
	},
	{
		name: "wire:canvas",
		type: "javascript",
		description:
			"Bootstraps the game-canvas integration for a canvas element and action channel.",
		example: '<canvas wire:canvas="tank.game"></canvas>',
	},
	{
		name: "wire:canvas-channel",
		type: "string",
		description:
			"Stores the resolved canvas channel used by the game-canvas integration.",
	},
	{
		name: "wire:canvas-method",
		type: "string",
		description:
			"Stores the action method associated with a canvas control binding.",
	},
	{
		name: "wire:file",
		type: "javascript",
		description:
			"Enables enhanced upload behaviour and optional preview handling on file inputs.",
		example: '<input type="file" wire:file.preview wire:model="avatar" />',
		extends: [
			{
				name: "preview",
				description: "Generate client-side previews for selected files when possible.",
			},
		],
	},
	{
		name: "wire:navigate",
		type: "boolean",
		description:
			"Intercepts same-origin anchor navigation and swaps the document through Kirewire.",
		example: '<a href="/dashboard" wire:navigate>Dashboard</a>',
		extends: [
			{
				name: "replace",
				description: "Replace the current history entry instead of pushing a new one.",
			},
		],
	},
	{
		name: "wire:key",
		type: "string",
		description:
			"Provides a stable morph key so DOM diffing can preserve the right element instance.",
		example: '<li wire:key="todo-{{ todo.id }}"></li>',
	},
	{
		name: "wire:id",
		type: "string",
		description:
			"Internal hydration identifier assigned to a server-rendered Kirewire component root.",
	},
	{
		name: "wire:state",
		type: "string",
		description:
			"Serialized component state snapshot used to hydrate and resume the client runtime.",
	},
];

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
