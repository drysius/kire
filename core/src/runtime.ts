import type { Kire } from "./kire";
import type { KireContext, KireTplFunction } from "./types";
import { KireError } from "./utils/error";
import {
    HTML_ESCAPE_CHECK_REGEX,
    HTML_ESCAPE_GLOBAL_REGEX,
    NullProtoObj
} from "./utils/regex";

const ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

export const escapeHtml = (v: any): string => {
    const s = String(v ?? "");
    if (!HTML_ESCAPE_CHECK_REGEX.test(s)) return s;
    return s.replace(HTML_ESCAPE_GLOBAL_REGEX, (c) => ESCAPES[c]!);
};

/**
 * Creates a Kire Template Function from compiled code and metadata.
 */
export function createKireFunction(
    kire: Kire<any>,
    execute: Function,
    meta: Omit<KireTplFunction['meta'], 'dependencies'> & { dependencies: Record<string, string> }
): KireTplFunction {
    
    // Base function (defaults to async behavior for compatibility)
    const fn: any = function(this: Kire<any> | void, locals?: object, globals?: object) {
        // Handle 'this' context if called as method on Kire instance, otherwise use captured kire
        const instance = (this && (this as any).compile) ? (this as Kire<any>) : kire;
        return fn.async(instance, locals, globals);
    };

    // Attach metadata
    fn.meta = meta;

    // Internal execute wrapper (matches low-level signature)
    fn.execute = (ctx: KireContext, deps: any) => {
        try {
            return execute(ctx, deps);
        } catch (e: any) {
            throw new KireError(e, fn);
        }
    };

    // Async execution
    fn.async = async (instance: Kire<any>, locals: any = {}, globals?: any) => {
        const ctx = createContext(instance, locals, globals, fn);
        const deps = await resolveDependencies(instance, meta.dependencies);
        
        const result = execute(ctx, deps);
        if (result instanceof Promise) await result;
        return ctx.$response;
    };

    // Sync execution
    fn.sync = (instance: Kire<any>, locals: any = {}, globals?: any) => {
        const ctx = createContext(instance, locals, globals, fn);
        const deps = resolveDependenciesSync(instance, meta.dependencies);
        
        const result = execute(ctx, deps);
        if (result instanceof Promise) {
            throw new Error(`Template ${meta.path} contains async code but was called synchronously.`);
        }
        return ctx.$response;
    };

    // Stream execution
    fn.stream = (instance: Kire<any>, locals: any = {}, globals?: any) => {
        const encoder = new TextEncoder();
        
        return new ReadableStream({
            async start(controller) {
                const ctx = createContext(instance, locals, globals, fn);
                
                // Override $response with a proxy for streaming
                let buffer = "";
                Object.defineProperty(ctx, '$response', {
                    get() { return buffer; },
                    set(val) {
                        if (val) controller.enqueue(encoder.encode(val));
                        buffer = "";
                    },
                    configurable: true
                });
                
                ctx.$add = (v: string) => {
                    if (v) controller.enqueue(encoder.encode(v));
                };

                try {
                    const deps = await resolveDependencies(instance, meta.dependencies);
                    const result = execute(ctx, deps);
                    if (result instanceof Promise) await result;
                    controller.close();
                } catch (e) {
                    controller.error(new KireError(e as Error, fn));
                }
            }
        });
    };

    return fn as KireTplFunction;
}

function createContext(kire: Kire<any>, locals: any, globals: any, template: KireTplFunction): KireContext {
    const ctx: any = new NullProtoObj();
    ctx.NullProtoObj = NullProtoObj;
    ctx.$globals = globals || kire.$globals;
    ctx.$props = locals || {};
    ctx.$kire = kire;
    ctx.$template = template;
    ctx.$response = "";
    ctx.$escape = escapeHtml;
    ctx.$add = (v: string) => { ctx.$response += v; };
    return ctx;
}

async function resolveDependencies(kire: Kire<any>, depMap: Record<string, string>): Promise<Record<string, any>> {
    const deps: Record<string, any> = new NullProtoObj();
    if (!depMap) return deps;

    for (const [path, id] of Object.entries(depMap)) {
        const resolved = kire.resolvePath(path);
        let compiled = kire.$files[resolved];
        if (!compiled) {
            const content = await kire.readFile(resolved);
            compiled = kire.compile(content, resolved);
            if (kire.production) kire.$files[resolved] = compiled;
        }
        deps[id] = compiled;
    }
    return deps;
}

function resolveDependenciesSync(kire: Kire<any>, depMap: Record<string, string>): Record<string, any> {
    const deps: Record<string, any> = new NullProtoObj();
    if (!depMap) return deps;

    for (const [path, id] of Object.entries(depMap)) {
        const resolved = kire.resolvePath(path);
        const compiled = kire.$files[resolved];
        if (!compiled) {
             console.warn(`[Kire] Sync execution warning: Dependency '${path}' not pre-loaded. It may cause errors.`);
             continue;
        }
        deps[id] = compiled;
    }
    return deps;
}
