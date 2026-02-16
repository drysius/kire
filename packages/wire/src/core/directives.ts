import type { Kire, KireHandler } from "kire";
import type { WireOptions } from "../types";
import { getClientScript } from "../utils/client-script";
import registerTypes from "../type-declare";

export function registerDirectives(kire: Kire, options: WireOptions) {
    registerTypes(kire);

	const wireDirectiveHandler: KireHandler = (api) => {
		const nameExpr = api.getArgument(0);
		const paramsExpr = api.getArgument(1) || "{}";
		const optionsExpr = api.getArgument(2) || "{}";

        api.markAsync();
		api.write(`await (async () => {
                const $w = $globals.Wired;
                const $name = ${nameExpr};
                const $params = ${paramsExpr};
                const $opts = ${optionsExpr};
                
                if ($opts.lazy) {
                    const $id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
                    const $pJson = JSON.stringify($params).replace(/"/g, '&quot;');
                    $kire_response += '<div wire:id="' + $id + '" wire:lazy="true" wire:component="' + $name + '" wire:init-params="' + $pJson + '">';
                    $kire_response += $opts.placeholder || 'Loading...';
                    $kire_response += '</div>';
                    return;
                }

                const $c = $w.getComponentClass($name);
                
                if (!$c) {
                    $kire_response += '<!-- Wire component "' + $name + '" not found -->';
                    return;
                }

                const $i = new $c(this);
                $i.context = { kire: this };
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

                const $ident = $globals.$wireToken || "";
                const $sum = $w.checksum.generate($state, $memo, $ident);
                
                const $snap = JSON.stringify({
                    data: $state,
                    memo: $memo,
                    checksum: $sum
                });

                const $esc = $snap.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                const $style = (!$html || !$html.trim()) ? ' style="display: none;"' : '';

                $kire_response += '<div wire:id="' + $i.__id + '" wire:snapshot="' + $esc + '" wire:component="' + $name + '"' + $style + '>';
                $kire_response += $html || '';
                $kire_response += '</div>';
            }).call(this);`);
	};

	kire.directive({
		name: "wire",
		params: ["name", "params", "options"],
		children: false,
		description: "Renders a Kirewire component.",
		example: "@wire('counter', { count: 10 }, { lazy: true })",
		onCall: wireDirectiveHandler,
	});

	kire.live = kire.wire = (name: string, params: object = {}, options: object = {}) => {
        return kire.render(`@wire(${JSON.stringify(name)}, ${JSON.stringify(params)}, ${JSON.stringify(options)})`);
    };

	kire.directive({
		name: "live",
		params: ["name", "params", "options"],
		children: false,
		description: "Alias for @wire. Renders a Kirewire component.",
		example: "@live('counter', { count: 10 })",
		onCall: wireDirectiveHandler,
	});

	const injectScripts: KireHandler = (api) => {
		const script = getClientScript(
			{
				route: options.route || "/_wired",
				adapter: options.adapter || "http",
				csrf: options.csrf,
                live_debounce: options.live_debounce,
                bus_delay: options.bus_delay,
                wire_model: options.wire_model,
			},
			kire.production,
		);
		api.write(`$kire_response += ${JSON.stringify(script)};`);
	};

	kire.directive({
		name: "wired",
		children: false,
		description: "Injects the necessary client-side scripts for Wired.",
		example: "@wired",
		onCall: injectScripts,
	});

	kire.directive({
		name: "wiredScripts",
		children: false,
		description: "Alias for @wired. Injects client-side scripts.",
		example: "@wiredScripts",
		onCall: injectScripts,
	});

	// Legacy aliases
	kire.directive({
		name: "kirewire",
		children: false,
		description: "Legacy alias for @wired.",
		example: "@kirewire",
		onCall: injectScripts,
	});
}