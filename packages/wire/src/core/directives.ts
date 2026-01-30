import type { Kire } from "kire";
import type { WireOptions } from "../types";
import { getClientScript } from "../utils/client-script";

export function registerDirectives(kire: Kire, options: WireOptions) {
	const wireDirectiveHandler = async (compiler: any) => {
		const nameExpr = compiler.param("name");
		const paramsExpr = compiler.param("params") || "{}";
		const optionsExpr = compiler.param("options") || "{}";

		compiler.raw(`await (async () => {
                const $w = $ctx.$wire;
                const $name = ${JSON.stringify(nameExpr)};
                const $params = ${paramsExpr};
                const $opts = ${optionsExpr};
                
                if ($opts.lazy) {
                    const $id = crypto.randomUUID();
                    const $pJson = JSON.stringify($params).replace(/"/g, '&quot;');
                    $ctx.$add('<div wire:id="' + $id + '" wire:lazy="true" wire:component="' + $name + '" wire:init-params="' + $pJson + '">');
                    $ctx.$add($opts.placeholder || 'Loading...');
                    $ctx.$add('</div>');
                    return;
                }

                const $c = $w.getComponentClass($name);
                
                if (!$c) {
                    $ctx.$add('<!-- Wire component "' + $name + '" not found -->');
                    return;
                }

                const $i = new $c($ctx.$kire);
                $i.context = { ...$ctx, kire: $ctx.$kire };
                $i.params = $params;

                if ($i.mount) await $i.mount($params);
                
                let $html = $i.render();
                if (typeof $html === "string") {
                    $html = await $i.html($html, {
                        ...$i.getDataForRender(),
                        errors: $i.__errors,
                    });
                } else {
                    $html = await $html;
                }
                
                const $state = $i.getPublicProperties();
                
                const $memo = {
                    id: $i.__id,
                    name: $name,
                    path: "/", 
                    method: "GET",
                    children: [],
                    scripts: [],
                    assets: [],
                    errors: [],
                    locale: "en",
                    listeners: $i.listeners || {},
                };

                const $ident = $ctx.$wireToken || ($ctx.$props && $ctx.$props.$wireToken) || "";
                const $sum = $w.checksum.generate($state, $memo, $ident);
                
                const $snap = JSON.stringify({
                    data: $state,
                    memo: $memo,
                    checksum: $sum
                });

                const $esc = $snap.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                const $style = (!$html || !$html.trim()) ? ' style="display: none;"' : '';

                $ctx.$add('<div wire:id="' + $i.__id + '" wire:snapshot="' + $esc + '" wire:component="' + $name + '"' + $style + '>');
                $ctx.$add($html || '');
                $ctx.$add('</div>');
            })();`);
	};

	kire.directive({
		name: "wire",
		params: ["name:string", "params?:object", "options?:object"],
		children: false,
		type: "html",
		description: "Renders a Kirewire component.",
		example: "@wire('counter', { count: 10 }, { lazy: true })",
		onCall: wireDirectiveHandler,
	});

	kire.directive({
		name: "live",
		params: ["name:string", "params?:object", "options?:object"],
		children: false,
		type: "html",
		description: "Alias for @wire. Renders a Kirewire component.",
		example: "@live('counter', { count: 10 })",
		onCall: wireDirectiveHandler,
	});

	const injectScripts = (compiler: any) => {
		const script = getClientScript(
			{
				endpoint: options.route || "/_wired",
				adapter: options.adapter || "http",
				csrf: options.csrf,
			},
			kire.production,
		);
		compiler.res(script);
	};

	kire.directive({
		name: "wired",
		children: false,
		type: "html",
		description: "Injects the necessary client-side scripts for Wired.",
		example: "@wired",
		onCall: injectScripts,
	});

	kire.directive({
		name: "wiredScripts",
		children: false,
		type: "html",
		description: "Alias for @wired. Injects client-side scripts.",
		example: "@wiredScripts",
		onCall: injectScripts,
	});

	// Legacy aliases
	kire.directive({
		name: "kirewire",
		children: false,
		type: "html",
		description: "Legacy alias for @wired.",
		example: "@kirewire",
		onCall: injectScripts,
	});

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
				comment: "Runs an action immediately after the component initializes.",
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
}
