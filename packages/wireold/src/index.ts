import { kirePlugin, type Kire } from "kire";
import { randomUUID } from "node:crypto";
import { Component } from "./core/component";
import { ChecksumManager } from "./core/checksum";
import { processRequest } from "./core/processor";
import { discoverComponents } from "./core/discovery";
import { FileManager } from "./core/file";
import { getAssetContent } from "./core/assets";
import { WireBroadcast } from "./core/broadcast";
import { setupFivemAdapter } from "./adapters/fivem";
import { setupSocketAdapter } from "./adapters/socket";
import type { WireOptions } from "./types";

type WireComponentCtor = new () => Component;
type WireComponentModule = {
    default?: unknown;
    [key: string]: unknown;
};

function resolveWireComponent(input: unknown): WireComponentCtor | null {
    if (typeof input === "function" && input.prototype instanceof Component) {
        return input as WireComponentCtor;
    }

    if (input && typeof input === "object") {
        const mod = input as WireComponentModule;
        if (typeof mod.default === "function" && mod.default.prototype instanceof Component) {
            return mod.default as WireComponentCtor;
        }

        for (const value of Object.values(mod)) {
            if (typeof value === "function" && value.prototype instanceof Component) {
                return value as WireComponentCtor;
            }
        }
    }

    return null;
}

/**
 * Robust Wire Plugin for Kire.
 */
export const wirePlugin = kirePlugin<WireOptions>({
    route: "/_wire",
    adapter: "http",
}, (kire, options) => {
    const secret = options.secret || randomUUID();
    
    if (!kire.$kire["~wire"]) {
        kire.$kire["~wire"] = {
            registry: new Map<string, new () => Component>(),
            checksum: new ChecksumManager(secret),
            files: undefined,
            broadcasts: undefined,
            options: { route: "/_wire", adapter: "http", ...options, secret }
        };
    }

    const wire = kire.$kire["~wire"];
    wire.options = { ...wire.options, ...options, secret };
    const selectedAdapter = String(wire.options.adapter || "http").toLowerCase() as "http" | "socket" | "fivem";

    if (selectedAdapter === "fivem") {
        setupFivemAdapter(kire);
    } else if (selectedAdapter === "socket" && wire.options.socket) {
        setupSocketAdapter(kire, wire.options.socket);
    }

    const renderWireComponentCode = (nameExpr: string, paramsExpr: string) => `{
        const $name = ${nameExpr};
        const $params = ${paramsExpr};
        const $wireState = this.$kire["~wire"];
        const $ComponentClass = $wireState.registry.get($name);
        
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
            const $checksum = $wireState.checksum.generate($state, $wireKey, { id: $id, component: $name });
            const $listeners = $instance.listeners || {};
            
            const $stateStr = JSON.stringify($state).replace(/"/g, '&quot;');
            const $listenersStr = JSON.stringify($listeners).replace(/"/g, '&quot;');
            
            $kire_response += '<div wire:id="' + $id + '" wire:component="' + $name + '" wire:state="' + $stateStr + '" wire:checksum="' + $checksum + '" wire:listeners="' + $listenersStr + '">';
            $kire_response += $html || '';
            $kire_response += '</div>';
        }
    }`;

    // Directive @kirewire
    kire.directive({
        name: "kirewire",
        children: false,
        onCall: (api) => {
            const route = wire.options.route || "/_wire";
            const adapter = wire.options.adapter || "http";
            const busDelay = Number(wire.options.bus_delay || 100);
            const clientConfig = JSON.stringify({
                endpoint: route,
                adapter,
                bus_delay: busDelay,
                production: !!api.kire.$production,
                transport: adapter === "socket" ? "socket" : "sse"
            });
            const suffix = api.kire.$production ? "" : `?v=${Date.now()}`;
            api.append(`<script>window.__WIRE_INITIAL_CONFIG__ = Object.assign({}, window.__WIRE_INITIAL_CONFIG__ || {}, ${clientConfig});</script>`);
            api.append(`<script type="module" src="${route}/wire.js${suffix}" defer></script>`);
        }
    });

    // Directive @wire('name', { ...props })
    kire.directive({
        name: "wire",
        children: false,
        onCall: (api) => {
            const nameExpr = api.getArgument(0) || api.getAttribute("name");
            const paramsExpr = api.getArgument(1) || api.getAttribute("params") || "{}";
            if (!nameExpr) {
                api.append(`<!-- Wire: Missing component name in @wire(...) -->`);
                return;
            }

            api.markAsync();
            api.write(renderWireComponentCode(nameExpr, paramsExpr));
        }
    });

    // Alias: @live('name', { ...props })
    kire.directive({
        name: "live",
        children: false,
        onCall: (api) => kire.getDirective("wire")?.onCall(api)
    });

    // Element <wire:name />
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
            api.write(renderWireComponentCode(JSON.stringify(componentName), `{ ${propsStr} }`));
        }
    });

    const setup = (instance: any) => {
        instance.wireRegister = async (nameOrPattern: string, component?: unknown) => {
            if (typeof component === "undefined") {
                await discoverComponents(instance, nameOrPattern);
                return;
            }

            const resolved = resolveWireComponent(component);
            if (!resolved) {
                throw new Error(`Wire component "${nameOrPattern}" must be a Component class or module export.`);
            }

            wire.registry.set(nameOrPattern, resolved);
        };

        instance.wireKey = (key: string) => {
            instance.$wireKey = key;
            return instance;
        };

        Object.defineProperty(instance, '$wire', {
            get: () => ({
                ...wire.options,
                discover: (pattern: string | string[]) => discoverComponents(instance, pattern)
            }),
            configurable: true
        });

        instance.wireRequest = async (req: { url: string; body: any; query?: any }) => {
            const url = new URL(req.url, "http://localhost");
            const route = wire.options.route || "/_wire";
            
            // 1. Static Assets (.js, .css, .min.js, .min.css)
            if (url.pathname.startsWith(route) && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
                const filename = url.pathname.split('/').pop()!;
                const asset = await getAssetContent(filename);
                
                if (asset) {
                    const cacheControl = instance.$production
                        ? "public, max-age=604800, immutable"
                        : "no-store";
                    return { 
                        status: 200, 
                        headers: { 
                            "Content-Type": asset.contentType, 
                            "Cache-Control": cacheControl 
                        }, 
                        result: asset.content 
                    };
                }
            }

            // 2. File Preview
            if (url.pathname === `${route}/preview`) {
                const id = req.query?.id;
                const files = wire.files;
                const file = files ? files.get(id) : null;
                if (file) {
                    return { status: 200, headers: { "Content-Type": file.meta.mime }, result: file.file };
                }
                return { status: 404, result: "File not found" };
            }

            // 2.5 Shared broadcast stream (SSE for HTTP mode)
            if (url.pathname === `${route}/broadcast` || url.pathname === `${route}/events` || url.pathname === `${route}/broadcast/stream`) {
                const componentName = String(req.query?.component || "");
                if (!componentName) {
                    return { status: 400, result: "Missing component query param" };
                }

                const ComponentClass = wire.registry.get(componentName);
                if (!ComponentClass) {
                    return { status: 404, result: "Component not found" };
                }

                const room = String(req.query?.channel || "global");
                const password = req.query?.password != null ? String(req.query.password) : undefined;
                const instanceComp = new ComponentClass();
                instanceComp._setKire(instance);
                instanceComp.__name = componentName;
                instanceComp.__id = String(req.query?.id || `sse_${Math.random().toString(36).slice(2)}`);
                await instanceComp.mount(req.query || {});
                await instanceComp.hydrate();

                const broadcasters = Object.values(instanceComp as any).filter((x: any) => x instanceof WireBroadcast) as WireBroadcast[];
                const selected = broadcasters.find((b: any) => (b as any).options?.name === room) || broadcasters[0];
                if (!selected) {
                    return { status: 404, result: "No WireBroadcast found in component" };
                }
                if (!selected.verifyPassword(password)) {
                    return { status: 403, result: "Invalid broadcast password" };
                }

                selected.hydrate(instanceComp, room);
                let currentController: ReadableStreamDefaultController<string> | null = null;
                let heartbeat: ReturnType<typeof setInterval> | null = null;
                const stream = new ReadableStream({
                    start(controller) {
                        currentController = controller;
                        try {
                            controller.enqueue(`retry: 3000\n`);
                            selected.connectSSE(controller);
                            controller.enqueue(`event: wire:broadcast:connected\n`);
                            controller.enqueue(`data: ${JSON.stringify({
                                type: "wire:broadcast:connected",
                                channel: selected.getChannel(),
                                component: componentName,
                                connections: selected.connections
                            })}\n\n`);
                        } catch {}
                        heartbeat = setInterval(() => {
                            try {
                                controller.enqueue(`: keep-alive\n\n`);
                            } catch {
                                if (currentController) selected.disconnectSSE(currentController);
                                currentController = null;
                                if (heartbeat) clearInterval(heartbeat);
                                heartbeat = null;
                            }
                        }, 15000);
                    },
                    cancel() {
                        if (currentController) selected.disconnectSSE(currentController);
                        currentController = null;
                        if (heartbeat) clearInterval(heartbeat);
                        heartbeat = null;
                    }
                });

                return {
                    status: 200,
                    headers: {
                        "Content-Type": "text/event-stream; charset=utf-8",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                    result: stream
                };
            }

            // 3. Batch Actions
            const body = req.body || {};
            if (body.components || body.component) {
                try {
                    if (body.component) {
                        const res = await processRequest(instance, body);
                        return {
                            status: 200,
                            headers: { "Content-Type": "application/json" },
                            result: JSON.stringify(res)
                        };
                    }

                    const payloads = body.components || [body];
                    const results = [];
                    const latestByComponent = new Map<string, { state: Record<string, any>; checksum: string }>();

                    for (const payload of payloads) {
                        try {
                            const key = String(payload.id || "");
                            const last = latestByComponent.get(key);
                            const effectivePayload = {
                                ...payload,
                                state: last?.state ?? payload.state,
                                checksum: last?.checksum ?? payload.checksum
                            };

                            const res = await processRequest(instance, effectivePayload);
                            if (res.state && res.checksum) {
                                latestByComponent.set(key, { state: res.state, checksum: res.checksum });
                            }
                            results.push(res);
                        } catch (e: any) {
                            results.push({ id: payload.id, error: e.message });
                        }
                    }

                    return { 
                        status: 200, 
                        headers: { "Content-Type": "application/json" },
                        result: JSON.stringify({ results }) 
                    };
                } catch (e: any) {
                    return { 
                        status: 500, 
                        headers: { "Content-Type": "application/json" },
                        result: JSON.stringify({ error: e.message }) 
                    };
                }
            }

            return { status: 404, result: "Not found" };
        };
    };

    setup(kire);
    kire.onFork(setup);
});

export { Component, processRequest };
export { processWireAction } from "./adapters/http-sse";
export * from "./core/upload";
export * from "./core/rule";
export * from "./core/broadcast";
export * from "./page-component";
export * from "./types";
export default wirePlugin;

declare module 'kire' {
    interface Kire {
        wireRegister(name: string, component: WireComponentCtor | WireComponentModule): void | Promise<void>;
        wireRegister(pattern: string): Promise<void>;
        wireKey(key: string): this;
        wireRequest(req: { url: string; body: any; query?: any }): Promise<{ status: number; headers?: any; code?: string; result: any }>;
        $wire: WireOptions & { discover(pattern: string | string[]): Promise<void> };
        "~wire": {
            registry: Map<string, new () => Component>;
            checksum: ChecksumManager;
            files?: FileManager;
            broadcasts?: Map<string, any>;
            options: WireOptions;
        };
    }
}
