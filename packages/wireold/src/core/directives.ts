import type { Kire, KireHandler } from "kire";
import { randomUUID } from "node:crypto";

/**
 * Registers Wire directives and elements.
 */
export function registerDirectives(kire: Kire) {
    
    // Directive: @live('name', params, options)
    const liveHandler: KireHandler = (api) => {
        const nameExpr = api.getArgument(0);
        const paramsExpr = api.getArgument(1) || "{}";
        const optionsExpr = api.getArgument(2) || "{}";

        api.markAsync();
        api.write(`await (async () => {
            const $name = ${nameExpr};
            const $params = ${paramsExpr};
            const $opts = ${optionsExpr};
            
            const $wire = this.$wire;
            const $ComponentClass = $wire.registry.get($name);
            
            if (!$ComponentClass) {
                $kire_response += '<!-- Wire component "' + $name + '" not found -->';
                return;
            }

            const $id = $opts.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
            const $instance = new $ComponentClass(this);
            $instance.__id = $id;
            $instance.__name = $name;
            
            $wire.components.set($id, $instance);

            if ($instance.mount) await $instance.mount($params);
            
            let $html = await $instance.render();
            if (typeof $html === "string") {
                $html = await $instance.html($html);
            }

            const $state = $instance.getPublicProperties();
            const $memo = { 
                id: $id, 
                name: $name, 
                path: "/", 
                method: "GET", 
                children: [], 
                scripts: [], 
                assets: [], 
                errors: $instance.__errors || {}, 
                locale: "en", 
                listeners: $instance.listeners || {} 
            };
            
            // Generate real checksum for initial render
            const $ident = (this as any).$globals?.["$wireToken"] || "";
            const $checksum = $wire.checksum.generate($state, $memo, $ident);

            const $snap = JSON.stringify({
                data: $state,
                memo: $memo,
                checksum: $checksum
            }).replace(/"/g, '&quot;');

            $kire_response += '<div wire:id="' + $id + '" wire:component="' + $name + '" wire:snapshot="' + $snap + '">';
            $kire_response += $html || '';
            $kire_response += '</div>';
        }).call(this);`);
    };

    kire.directive({
        name: "live",
        children: false,
        onCall: liveHandler
    });

    kire.directive({
        name: "wire",
        children: false,
        onCall: liveHandler
    });

    const wiredHandler: KireHandler = (api) => {
        const wire = api.kire.$wire;
        if (!wire || !wire.options) return;
        const route = wire.options.route;
        const js = `<script src="${route}/kirewire.min.js"></script>`;
        const css = `<link rel="stylesheet" href="${route}/kirewire.min.css">`;
        api.append("\n" + css + "\n" + js + "\n");
    };

    kire.directive({ name: "wired", children: false, onCall: wiredHandler });
    kire.directive({ name: "wiredScripts", children: false, onCall: wiredHandler });

    // Element: <wire:name ...props />
    kire.element({
        name: /^wire:/,
        onCall: (api) => {
            const tagName = api.node.tagName!;
            const componentName = tagName.slice(5); // Remove 'wire:'
            
            const attrs = api.node.attributes || {};
            const propsStr = Object.keys(attrs)
                .map(k => `'${k}': ${api.getAttribute(k)}`)
                .join(',');

            api.markAsync();
            api.write(`await (async () => {
                const $name = "${componentName}";
                const $params = { ${propsStr} };
                
                // Reuse liveHandler logic but injected
                const $wire = this.$kire["~wire"];
                const $ComponentClass = $wire.registry.get($name);
                
                if (!$ComponentClass) {
                    $kire_response += '<!-- Wire component "' + $name + '" not found -->';
                    return;
                }

                const $id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                const $instance = new $ComponentClass(this);
                $instance.__id = $id;
                $instance.__name = $name;
                
                $wire.components.set($id, $instance);

                if ($instance.mount) await $instance.mount($params);
                
                let $html = await $instance.render();
                if (typeof $html === "string") {
                    $html = await $instance.html($html);
                }

                const $state = $instance.getPublicProperties();
                const $memo = { 
                    id: $id, 
                    name: $name, 
                    path: "/", 
                    method: "GET", 
                    children: [], 
                    scripts: [], 
                    assets: [], 
                    errors: $instance.__errors || {}, 
                    locale: "en", 
                    listeners: $instance.listeners || {} 
                };
                
                // Generate real checksum for initial render
                const $ident = (this as any).$globals?.["$wireToken"] || "";
                const $checksum = $wire.checksum.generate($state, $memo, $ident);

                const $snap = JSON.stringify({ data: $state, memo: $memo, checksum: $checksum }).replace(/"/g, '&quot;');

                $kire_response += '<div wire:id="' + $id + '" wire:component="' + $name + '" wire:snapshot="' + $snap + '">';
                $kire_response += $html || '';
                $kire_response += '</div>';
            }).call(this);`);
        }
    });
}
