import type { Kire } from "./kire";
/**
 * Executes the compiled template function within a prepared runtime context.
 *
 * Execution Flow:
 * 1. Initialize context with globals and locals.
 * 2. Run directive `onInit` hooks.
 * 3. Execute `mainFn` (the compiled template). This populates `~res` and collects `~$pre`/`~$pos` hooks.
 * 4. Execute `~$pre` hooks (deferred logic that runs immediately after main render).
 * 5. Execute `~$pos` hooks (final post-processing).
 * 6. Process custom elements (if not in a child block).
 *
 * @param kire The Kire instance.
 * @param mainFn The compiled async function of the template.
 * @param locals Local variables passed to the template.
 * @param children Whether this runtime is executing a child block (nested).
 * @returns The final rendered HTML string.
 */
export declare function kireRuntime(kire: Kire, mainFn: Function, locals: Record<string, any>, children?: boolean): Promise<any>;
