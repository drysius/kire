import type { KirePlugin } from "kire";
import { Kire } from "kire";
import type { WireComponent } from "./component";
import { WireCore } from "./core";
import type { WireOptions } from "../types";
import { getClientScript } from "./web/client";

export const Kirewire: KirePlugin<WireOptions> = {
	name: "@kirejs/wire",
	options: {},
	load(kire: Kire, options: WireOptions = {}) {
		const core = WireCore.get();
		core.init(kire, options);

		kire.$ctx("$wire", core);
		kire.$ctx("kire", kire);

		kire.directive({
			name: "wire",
			params: ["name:string", "params?:object"],
			children: false,
			type: "html",
			description: "Renders a Kirewire component.",
			example: "@wire('counter', { count: 10 })",
			async onCall(compiler) {
				const name = compiler.param("name");
				const params = compiler.param("params") || "{}";

				compiler.raw(`await (async () => {
               const compName = ${JSON.stringify(name)};
               const initParams = ${params};
               const core = $ctx.$wire; 
               if (!core) throw new Error("Kirewire core not found.");

               const ComponentClass = core.getComponentClass(compName);
               
               if(ComponentClass) {
                   const instance = new ComponentClass();
                   instance.kire = $ctx.kire; 
                   // Inject kire into context but also keep existing context
                   instance.context = { ...$ctx, kire: $ctx.kire };
                   
                   if(instance.mount) await instance.mount(initParams);
                   
                   let html = await instance.render();
                   const state = instance.getPublicProperties();
                   
                   let style = "";
                   if (!html || !html.trim()) {
                        style = ' style="display: none;"';
                   }
                   
                   const memo = {
                        id: instance.__id,
                        name: compName,
                        path: "/", 
                        method: "GET",
                        children: [],
                        scripts: [],
                        assets: [],
                        errors: [],
                        locale: "en",
                        listeners: instance.listeners,
                   };

                   const checksum = core.getChecksum().generate(state, memo);
                   
                   const snapshot = JSON.stringify({
                        data: state,
                        memo: memo,
                        checksum: checksum
                   });

                   // HTML Attribute Escaping
                   // Escape & " ' < >
                   const escapedSnapshot = snapshot
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                   
                   $ctx.res('<div wire:id="' + instance.__id + '" wire:snapshot="' + escapedSnapshot + '" wire:component="' + compName + '"' + style + '>');
                   $ctx.res(html);
                   $ctx.res('</div>');
               } else {
                   $ctx.res(\`<!-- Wire component "\${compName}" not found -->\`);
               }
           })();`);
			},
		});

		const injectScripts = (compiler: any) => {
			const opts = WireCore.get().getOptions();
			const script = getClientScript({
				endpoint: opts.route || "/_kirewire",
				method: opts.method || "http",
			});
			compiler.res(script);
		};

		kire.directive({
			name: "kirewire",
			children: false,
			type: "html",
			description: "Injects the necessary client-side scripts for Kirewire.",
			example: "@kirewire",
			onCall: injectScripts,
		});

		// Alias for backward compatibility or alternative name
		kire.directive({
			name: "wireScripts",
			children: false,
			type: "html",
			description: "Alias for @kirewire. Injects client-side scripts.",
			example: "@wireScripts",
			onCall: injectScripts,
		});

		// Register wire attributes for IDE support
		kire.schematic("attributes", {
			global: {
				"wire:click": {
					type: "string",
					comment: "Handles click events and calls a component method.",
					example: 'wire:click="increment"',
				},
				"wire:model": {
					type: "string",
					comment: "Two-way data binding for component properties.",
					example: 'wire:model="search"',
				},
				"wire:submit": {
					type: "string",
					comment: "Handles form submission.",
					example: 'wire:submit="save"',
				},
				"wire:submit.prevent": {
					type: "string",
					comment: "Handles form submission and prevents default behavior.",
					example: 'wire:submit.prevent="save"',
				},
				"wire:keydown": {
					type: "string",
					comment: "Listens for keydown events.",
					example: 'wire:keydown="search"',
				},
				"wire:keydown.enter": {
					type: "string",
					comment: "Listens for the Enter key.",
					example: 'wire:keydown.enter="search"',
				},
				"wire:init": {
					type: "string",
					comment:
						"Runs an action immediately after the component initializes.",
					example: 'wire:init="loadData"',
				},
				"wire:loading": {
					type: "string",
					comment:
						"Toggles visibility or classes while a network request is pending.",
					example: "wire:loading",
				},
				"wire:loading.class": {
					type: "string",
					comment: "Adds a class while a network request is pending.",
					example: 'wire:loading.class="opacity-50"',
				},
				"wire:loading.attr": {
					type: "string",
					comment: "Adds an attribute while a network request is pending.",
					example: 'wire:loading.attr="disabled"',
				},
				"wire:target": {
					type: "string",
					comment: "Scopes loading indicators to a specific method or model.",
					example: 'wire:target="save"',
				},
				"wire:ignore": {
					type: "boolean",
					comment:
						"Tells Kirewire to ignore this element and its children during DOM updates.",
					example: "wire:ignore",
				},
				"wire:key": {
					type: "string",
					comment: "Assigns a unique key to an element for diffing.",
					example: 'wire:key="item-{{ id }}"',
				},
				"wire:id": {
					type: "string",
					comment: "Internal ID of the component instance (auto-generated).",
					example: 'wire:id="..."',
				},
				"wire:poll": {
					type: "string",
					comment: "Polls the server at a specified interval.",
					example: 'wire:poll.2s="refresh"',
				},
				"wire:navigate": {
					type: "boolean",
					comment: "Enables SPA-like navigation for links.",
					example: "wire:navigate",
				},
				"wire:confirm": {
					type: "string",
					comment: "Prompts the user for confirmation before an action.",
					example: 'wire:confirm="Are you sure?"',
				},
			},
		});
	},
};

// Module Augmentation
declare module "kire" {
	interface KireClass {
		wire(name: string, component: new () => WireComponent): void;
	}
}

(Kire.prototype as any).wire = (name: string, component: new () => WireComponent) => {
	WireCore.get().registerComponent(name, component);
};
