import { existsSync, readdirSync, statSync } from "node:fs";
import { join, parse, resolve } from "node:path";
import type { Kire } from "kire";
import { Component } from "./component";

export async function discoverComponents(kire: Kire, pattern: string | string[]) {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const root = process.cwd();

    for (const p of patterns) {
        let searchDir = resolve(root, p.replace(/\*.*$/, ""));
        if (!existsSync(searchDir)) continue;

        const files = walk(searchDir);
        for (const file of files) {
            if ((file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts")) {
                try {
                    const mod = await import(file);
                    // Find exported class extending Component
                    const Comp = mod.default || Object.values(mod).find((e: any) => 
                        typeof e === "function" && e.prototype instanceof Component
                    );

                    if (Comp) {
                        const relPath = file.slice(searchDir.length + 1);
                        const parsed = parse(relPath);
                        const dirParts = parsed.dir ? parsed.dir.split(/[\/]/) : [];
                        // Name strategy: directory.file (e.g. auth.login)
                        const name = [...dirParts, parsed.name].join(".").toLowerCase();

                        kire.wireRegister(name, Comp);
                    }
                } catch (e) {
                    console.error(`[Wire:Discover] Failed to load ${file}:`, e);
                }
            }
        }
    }
}

function walk(dir: string): string[] {
    let results: string[] = [];
    try {
        const list = readdirSync(dir);
        for (const file of list) {
            const path = join(dir, file);
            const stat = statSync(path);
            if (stat && stat.isDirectory()) results = results.concat(walk(path));
            else results.push(path);
        }
    } catch(e) {}
    return results;
}
