
import type { Kire } from "kire";
import type { Wired } from "../wired";

declare global {
    const Wired: typeof Wired;
    const $wire: typeof Wired;
    const kire: Kire;
    const $ctx: any;
    
    /**
     * Kire extends variable of locals values
     */
    let it: Record<string, any>;
}
