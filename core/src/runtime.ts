import type { Kire } from "./kire";
import type { KireContext, KireTplFunction } from "./types";
import { KireError } from "./utils/error";

/**
 * Creates a Kire Template Function from compiled code and metadata.
 */
export function createKireFunction(
    kire: Kire<any>,
    execute: Function,
    meta: Omit<KireTplFunction['meta'], 'dependencies'> & { dependencies: Record<string, string> }
): KireTplFunction {
    
    // Base function
    const fn: any = function(this: Kire<any> | void, locals?: object, globals?: object) {
        const instance = (this && (this as any).compile) ? (this as Kire<any>) : kire;
        return fn.async(instance, locals, globals);
    };

    fn.meta = meta;

    // Internal execute wrapper
    // We maintain signature compatibility but ignore deps arg if not needed by new code
    fn.execute = (ctx: KireContext) => {
        try {
            return execute(ctx);
        } catch (e: any) {
            throw new KireError(e, fn);
        }
    };

    // Async execution
    fn.async = async (instance: Kire<any>, locals: any = {}, globals?: any) => {
        const deps = instance.resolveDependencies(meta.dependencies);
        const ctx = instance.createContext(locals, globals, fn, deps);
        
        const result = execute(ctx);
        if (result instanceof Promise) await result;
        return ctx.$response;
    };

    // Sync execution
    fn.sync = (instance: Kire<any>, locals: any = {}, globals?: any) => {
        const deps = instance.resolveDependencies(meta.dependencies);
        const ctx = instance.createContext(locals, globals, fn, deps);
        
        const result = execute(ctx);
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
                const deps = instance.resolveDependencies(meta.dependencies);
                const ctx = instance.createContext(locals, globals, fn, deps);
                
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
                    const result = execute(ctx);
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
