import type { Kire } from "kire";
import { Kirewire, type KirewireOptions } from "./kirewire";
import { Component } from "./component";
import { HttpAdapter } from "./adapters/http";
import { SocketAdapter } from "./adapters/socket";
import { FileStore } from "./features/file-store";
import { WireFile, Rule } from "./features/file-upload";
import { WireBroadcast, type WireBroadcastOptions } from "./features/wire-broadcast";
import { validateRuleString as validateRule, type ValidationResult } from "./validation/rule";

export class KirewirePlugin {
    public wire!: Kirewire;
    public options: KirewireOptions;

    constructor(options: KirewireOptions) {
        this.options = options;
    }

    public load(kire: Kire) {
        this.wire = new Kirewire(this.options);
        (kire as any).$wire = this.wire;
        
        const setup = (instance: any) => {
            instance.wire = this.wire;
            instance.$wire = this.wire;
        };

        setup(kire);
        kire.onFork(setup);

        // Register default properties
        this.wire.class('file', WireFile);
        this.wire.class('broadcast', WireBroadcast);

        kire.directive({
            name: 'wire:id',
            onCall: (api) => {
                const id = api.getAttribute('id');
                const state = api.getAttribute('state') || '{}';
                
                api.write(`{
                    const $state = ${state};
                    const $id = ${id};
                    const $stateStr = JSON.stringify($state).replace(/'/g, "&#39;");
                    $kire_response += \` wire:id="\${$id}" wire:state='\${$stateStr}'\`;
                }`);
            }
        });

        kire.directive({
            name: 'kirewire',
            onCall: (api) => {
                api.write(`{
                    const $pageId = $globals.pageId || 'default-page';
                    const $busDelay = ${this.wire.options.bus_delay || 100};
                    const $transport = $globals.sharedTransport || 'sse';
                    const $wireUrl = (this.wire.options.adapter && typeof this.wire.options.adapter.getClientUrl === 'function')
                        ? this.wire.options.adapter.getClientUrl()
                        : '/_wire';
                    const $uploadUrl = (this.wire.options.adapter && typeof this.wire.options.adapter.getUploadUrl === 'function')
                        ? this.wire.options.adapter.getUploadUrl()
                        : ($wireUrl.replace(/\\/+$/, '') + '/upload');
                    $kire_response += \`
                        <script type="module" src="\${$wireUrl}/kirewire.js"></script>
                        <script type="module">
                            window.__WIRE_INITIAL_CONFIG__ = Object.assign({}, window.__WIRE_INITIAL_CONFIG__ || {}, {
                                pageId: \${JSON.stringify($pageId)},
                                url: \${JSON.stringify($wireUrl)},
                                uploadUrl: \${JSON.stringify($uploadUrl)},
                                transport: \${JSON.stringify($transport)},
                                busDelay: \${Number($busDelay) || 0}
                            });
                            const init = () => {
                                if (window.Kirewire && window.Alpine) {
                                    if (window.Kirewire.configure) {
                                        window.Kirewire.configure(window.__WIRE_INITIAL_CONFIG__ || {});
                                    }
                                    Kirewire.start(window.Alpine);
                                    if (window.Kirewire.bus) {
                                        window.Kirewire.bus.setDelay(Number(\${$busDelay}) || 0);
                                    }
                                } else {
                                    setTimeout(init, 10);
                                }
                            };
                            init();
                        </script>
                    \`;
                }`);
            }
        });

        kire.directive({
            name: 'wire',
            params: ['name:string', 'locals:object'],
            onCall: (api) => {
                const nameExpr = api.getArgument(0) || api.getAttribute('name');
                const localsExpr = api.getArgument(1) || api.getAttribute('locals') || '{}';
                
                api.markAsync();
                api.write(`{
                    const $name = (${nameExpr}).replace(/^['"]|['"]$/g, '');
                    const $locals = ${localsExpr};
                    const $userId = String($globals.user?.id || 'guest');
                    const $pageId = String($globals.pageId || 'default-page');

                    const $componentClass = this.wire.components.get($name);
                    if (!$componentClass) {
                        $kire_response += \`<!-- Component "\${$name}" not found -->\`;
                    } else {
                        const $page = this.wire.sessions.getPage($userId, $pageId);
                        const $id = this.wire.createComponentId();
                        
                        const $instance = new $componentClass();
                        $instance.$id = $id;
                        $instance.$kire = this;
                        $instance.$wire_instance = this.wire;

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
        });

        if (this.wire.options.adapter) {
            this.wire.options.adapter.install(this.wire, kire);
        }
    }
}

export class PageComponent extends Component {
    render() {
        return this.view(""); // Should be overridden
    }
}

export const wirePlugin = KirewirePlugin;
export { Kirewire, Component, HttpAdapter, SocketAdapter, FileStore, WireFile, Rule, WireBroadcast, validateRule, type ValidationResult, type WireBroadcastOptions };
export default { Kirewire, Component, HttpAdapter, SocketAdapter, FileStore, WireFile, Rule, WireBroadcast, validateRule }
