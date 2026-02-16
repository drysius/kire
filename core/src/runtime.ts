import type { Kire } from "./kire";
import type { KireTplFunction } from "./types";
import { KireError } from "./utils/error";

/**
 * Creates a Kire Template Function from compiled code and metadata.
 */
export function createKireFunction(
    kire: Kire<any>,
    execute: Function,
    meta: Omit<KireTplFunction['meta'], 'dependencies'> & { dependencies: Record<string, string> }
): KireTplFunction {
    const fn = execute as any;
    fn.meta = meta;
    return fn as KireTplFunction;
}
