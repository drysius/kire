import type { Kire } from "kire";
import { Kirewire, type KirewireOptions } from "./kirewire";
import { Component } from "./component";
import { HttpAdapter } from "./adapters/http";
import { SocketAdapter } from "./adapters/socket";
import { FileStore } from "./features/file-store";
import { fileUploadMiddleware, WireFile, Rule } from "./features/file-upload";

export class KirewirePlugin {
    public wire!: Kirewire;
    public options: KirewireOptions;

    constructor(options: KirewireOptions) {
        this.options = options;
    }

    public load(kire: Kire, options: KirewireOptions) {
        this.wire = new Kirewire(options);
        
        const setup = (instance: any) => {
            instance.wire = this.wire;
            instance.wireRegister = this.wire.wireRegister.bind(this.wire);
            instance.wireRequest = async (req: any) => {
                if (this.wire.options.adapter && this.wire.options.adapter.handleRequest) {
                    return await this.wire.options.adapter.handleRequest(
                        { method: req.method || 'POST', url: req.url, body: req.body, signal: req.signal }, 
                        req.userId || 'guest', 
                        req.sessionId || 'default'
                    );
                }
                return { status: 500, result: { error: 'No adapter configured' } };
            };
        };

        setup(kire);
        kire.onFork(setup);

        kire.directive({
            name: 'wire:id',
            onCall: (api) => {
                const id = api.getAttribute('id');
                const state = api.getAttribute('state') || '{}';
                const sessionId = api.getArgument(0) || '$globals.wireKey || "default"'; 
                
                api.write(`{
                    const $state = ${state};
                    const $id = ${id};
                    const $sessionId = ${sessionId};
                    const $checksum = this.wire.generateChecksum($state, $sessionId);
                    const $stateStr = JSON.stringify($state).replace(/'/g, "&#39;");
                    $kire_response += \` wire:id="\${$id}" wire:state='\${$stateStr}' wire:checksum="\${$checksum}"\`;
                }`);
            }
        });

        kire.directive({
            name: 'kirewire',
            onCall: (api) => {
                const pageId = (api as any).$globals?.pageId || 'default-page';
                
                api.append(`
                    <script type="module" src="/dist/client/wire.js"></script>
                    <script type="module">
                        const init = () => {
                            if (window.Kirewire && window.Alpine) {
                                Kirewire.start(window.Alpine);
                                new Kirewire.HttpClientAdapter({ 
                                    url: '/_wire', 
                                    pageId: '${pageId}' 
                                });
                            } else {
                                setTimeout(init, 10);
                            }
                        };
                        init();
                    </script>
                `);
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
                    const $userId = $globals.user?.id || 'guest';
                    const $pageId = $globals.pageId || 'default-page';
                    const $sessionId = $globals.wireKey || 'default-session';

                    const $componentClass = this.wire.components.get($name);
                    if (!$componentClass) {
                        $kire_response += \`<!-- Component "\${$name}" not found -->\`;
                    } else {
                        const $page = this.wire.sessions.getPage($userId, $pageId);
                        const $id = Math.random().toString(36).substring(2, 11);
                        
                        const $instance = new $componentClass();
                        $instance.$id = $id;
                        $instance.$kire = this;
                        $instance.$wire_instance = this.wire;
                        
                        // Register listeners
                        if ($instance.listeners) {
                            for (const [event, method] of Object.entries($instance.listeners)) {
                                this.wire.$on(\`event:\${event}\`, async (data) => {
                                    if (data.sourceId !== $id) {
                                        await $instance[method](...data.params);
                                        await this.wire.$emit('component:update', {
                                            userId: $userId, pageId: $pageId, id: $id, 
                                            html: (await $instance.render()).toString(),
                                            state: this.wire.options.adapter.getPublicState($instance)
                                        });
                                    }
                                });
                            }
                        }
                        
                        Object.assign($instance, $locals);
                        await $instance.mount();
                        $page.components.set($id, $instance);

                        const $html = await $instance.render();
                        const $state = {};
                        for (const key of Object.keys($instance)) {
                            if (!key.startsWith('$') && !key.startsWith('_') && typeof $instance[key] !== 'function') {
                                $state[key] = $instance[key];
                            }
                        }
                        const $checksum = this.wire.generateChecksum($state, $sessionId);
                        const $stateStr = JSON.stringify($state).replace(/'/g, "&#39;");

                        $kire_response += \`<div wire:id="\${$id}" wire:state='\${$stateStr}' wire:checksum="\${$checksum}">\${$html}</div>\`;
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

export class WireBroadcast {
    // Stub
}

export const wirePlugin = KirewirePlugin;
export { Kirewire, Component, HttpAdapter, SocketAdapter, FileStore, fileUploadMiddleware, WireFile, Rule };
