import { existsSync, readdirSync, statSync } from "node:fs";
import { join, parse, resolve } from "node:path";
import type { Kire } from "kire";
import { WireComponent } from "../component";

/**
 * Scans directories to discover and register Wire components.
 */
export async function discoverComponents(kire: Kire, pattern: string) {
    const root = process.cwd();
    let searchDir = resolve(root, pattern.replace(/\*.*$/, ""));

    if (!existsSync(searchDir)) return;

    const files = walk(searchDir);
    for (const file of files) {
        if ((file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts")) {
            try {
                const mod = await import(file);
                const Comp = mod.default || Object.values(mod).find((e: any) => 
                    typeof e === "function" && e.prototype instanceof WireComponent
                );

                if (Comp) {
                    const relPath = file.slice(searchDir.length + 1);
                    const parsed = parse(relPath);
                    const dirParts = parsed.dir ? parsed.dir.split(/[\/]/) : [];
                    const name = [...dirParts, parsed.name].join(".");

                    kire.$kire["~wire"].registry.set(name, Comp);
                }
            } catch (e) {
                if (!kire.$silent) console.error(`[Wire] Failed to load component: ${file}`, e);
            }
        }
    }
}

function walk(dir: string): string[] {
    let results: string[] = [];
    const list = readdirSync(dir);
    for (const file of list) {
        const path = join(dir, file);
        const stat = statSync(path);
        if (stat && stat.isDirectory()) results = results.concat(walk(path));
        else results.push(path);
    }
    return results;
}
