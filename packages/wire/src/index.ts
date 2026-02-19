import { kirePlugin, type Kire } from "kire";
import { randomUUID } from "node:crypto";
import { Component } from "./core/component";
import { ChecksumManager } from "./core/checksum";
import { processRequest as processWireAction } from "./core/processor";
import type { WirePayload } from "./types";

export interface WireOptions {
    route?: string;
    secret?: string;
}

export const wirePlugin = kirePlugin<WireOptions>({
    route: "/_wire",
}, (kire, options) => {
    const secret = options.secret || randomUUID();
    
    if (!kire.$kire["~wire"]) {
        kire.$kire["~wire"] = {
            registry: new Map<string, new () => Component>(),
            checksum: new ChecksumManager(secret),
            options: { ...options, secret }
        };
    }

    const wire = kire.$kire["~wire"];

    // Handler <wire:name />
    kire.element({
        name: /^wire:/,
        onCall: (api) => {
            const tagName = api.node.tagName!;
            const componentName = tagName.slice(5);
            const attrs = api.node.attributes || {};
            const propsStr = Object.keys(attrs)
                .map(k => `'${k}': ${api.getAttribute(k)}`)
                .join(',');

            api.markAsync();
            api.write(`{
                const $name = "${componentName}";
                const $params = { ${propsStr} };
                const $wire = this.$kire["~wire"];
                const $ComponentClass = $wire.registry.get($name);
                
                if (!$ComponentClass) {
                    $kire_response += '<!-- Wire: Component "' + $name + '" not found -->';
                } else {
                    const $instance = new $ComponentClass();
                    $instance._setKire(this);
                    $instance.__name = $name;

                    await $instance.mount($params);
                    $instance.fill($params);

                    const $html = await $instance.render();
                    const $state = $instance.getPublicProperties();
                    const $id = $instance.__id;
                    const $wireKey = this.$wireKey || "";
                    const $checksum = $wire.checksum.generate($state, $wireKey);
                    
                    const $stateStr = JSON.stringify($state).replace(/"/g, '&quot;');
                    
                    $kire_response += '<div wire:id="' + $id + '" wire:component="' + $name + '" wire:state="' + $stateStr + '" wire:checksum="' + $checksum + '">';
                    $kire_response += $html || '';
                    $kire_response += '</div>';
                }
            }`);
        }
    });

    const setup = (instance: any) => {
        instance.wireRegister = (name: string, component: new () => Component) => {
            wire.registry.set(name, component);
        };

        instance.wireKey = (key: string) => {
            instance.$wireKey = key;
            return instance;
        };

        instance.wireRequest = async (req: { url: string; body: any; query?: any }) => {
            try {
                const payload = req.body as WirePayload;
                const result = await processWireAction(instance, payload);
                return { status: 200, code: "ok", result };
            } catch (e: any) {
                return { status: 500, code: "error", result: { error: e.message } };
            }
        };

        Object.defineProperty(instance, '$wire', { get: () => wire.options });
    };

    setup(kire);
    kire.onFork(setup);
});

export { Component, processWireAction };
export * from "./types";
export default wirePlugin;

declare module 'kire' {
    interface Kire {
        wireRegister(name: string, component: new () => Component): void;
        wireKey(key: string): this;
        wireRequest(req: { url: string; body: any; query?: any }): Promise<{ status: number; code: string; result: any }>;
        $wire: { route: string; secret: string };
        "~wire": {
            registry: Map<string, new () => Component>;
            checksum: ChecksumManager;
            options: WireOptions;
        };
    }
}
