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
        (kire as any).wire = this.wire;
        // For compatibility with old code
        (kire as any).wireRegister = this.wire.wireRegister.bind(this.wire);
        (kire as any).wireRequest = async (req: any) => {
            if (this.wire.options.adapter && this.wire.options.adapter.handleRequest) {
                const result = await this.wire.options.adapter.handleRequest(
                    req.body, 
                    req.userId || 'guest', 
                    req.sessionId || 'default'
                );
                return { result };
            }
            return { result: { error: 'No adapter configured' } };
        };

        kire.directive({
            name: 'wire:id',
            onCall: (api) => {
                const id = api.getAttribute('id');
                const state = api.getAttribute('state') || '{}';
                const sessionId = api.getArgument(0) || 'default-session'; 
                
                const checksum = this.wire.generateChecksum(state, sessionId);

                api.append(` wire:id="${id}" wire:state='${JSON.stringify(state)}' wire:checksum="${checksum}"`);
            }
        });

        kire.directive({
            name: 'kirewire',
            onCall: (api) => {
                const pageId = (api as any).$globals?.pageId || 'default-page';
                
                api.append(`
                    <script src="/dist/client/wire.js"></script>
                    <script>
                        document.addEventListener('DOMContentLoaded', () => {
                            Kirewire.start(window.Alpine);
                            new Kirewire.HttpClientAdapter({ 
                                url: '/_wire', 
                                pageId: '${pageId}' 
                            });
                        });
                    </script>
                `);
            }
        });

        kire.directive({
            name: 'wire',
            params: ['name:string', 'locals:object'],
            onCall: async (api) => {
                const name = api.getAttribute('name');
                const locals = api.getAttribute('locals') || '{}';
                
                // Note: In a real app, we need userId and pageId from context
                const userId = (api as any).$globals?.user?.id || 'guest';
                const pageId = (api as any).$globals?.pageId || 'default-page';
                const sessionId = (api as any).$globals?.wireKey || 'default-session';

                const componentClass = this.wire.components.get(name);
                if (!componentClass) {
                    api.append(`<!-- Component ${name} not found -->`);
                    return;
                }

                const page = this.wire.sessions.getPage(userId, pageId);
                const id = Math.random().toString(36).substring(2, 11);
                
                const instance = new (componentClass as any)();
                (instance as any).$id = id;
                (instance as any).$kire = kire;
                (instance as any).$wire_instance = this.wire;
                
                // Register listeners
                if (instance.listeners) {
                    for (const [event, method] of Object.entries(instance.listeners)) {
                        this.wire.$on(`event:${event}`, async (data: any) => {
                            if (data.sourceId !== id) {
                                await (instance as any)[method as string](...data.params);
                                // Trigger update for this component too
                                await this.wire.$emit('component:update', {
                                    userId, pageId, id, html: (await instance.render()).toString(),
                                    state: this.getPublicState(instance)
                                });
                            }
                        });
                    }
                }
                
                // Hydrate with locals
                Object.assign(instance, JSON.parse(locals));
                
                await instance.mount();
                page.components.set(id, instance);

                const html = await instance.render().toString();
                const state = this.getPublicState(instance);
                const checksum = this.wire.generateChecksum(state, sessionId);

                api.append(`<div wire:id="${id}" wire:state='${JSON.stringify(state)}' wire:checksum="${checksum}">${html}</div>`);
            }
        });

        if (this.wire.options.adapter) {
            this.wire.options.adapter.install(this.wire, kire);
        }
    }

    private getPublicState(instance: any): any {
        const state: any = {};
        for (const key of Object.keys(instance)) {
            if (!key.startsWith('$') && !key.startsWith('_') && typeof instance[key] !== 'function') {
                state[key] = instance[key];
            }
        }
        return state;
    }
}

export const wirePlugin = KirewirePlugin;
export { Kirewire, Component, HttpAdapter, SocketAdapter, FileStore, fileUploadMiddleware };
