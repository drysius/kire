import type { Kire } from "kire";
import type { WireOptions } from "../types";
import { getClientScript } from "../utils/client-script";
import registerTypes from "../type-declare";

export function registerDirectives(kire: Kire, options: WireOptions) {
    registerTypes(kire);

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
				route: options.route || "/_wired",
				adapter: options.adapter || "http",
				csrf: options.csrf,
                live_debounce: options.live_debounce,
                bus_delay: options.bus_delay,
                wire_model: options.wire_model,
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
}