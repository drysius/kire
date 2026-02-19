import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Attempts to locate and read the content of a Kirewire client asset.
 */
export async function getAssetContent(filename: string): Promise<string | null> {
    const pathsToTry = [
        // Development and build output paths
        resolve(dirname(fileURLToPath(import.meta.url)), "../../client", filename),
        resolve(dirname(fileURLToPath(import.meta.url)), "../../dist/client", filename),
        resolve(dirname(fileURLToPath(import.meta.url)), "../web", filename),
        resolve(dirname(fileURLToPath(import.meta.url)), "../../../dist/client", filename),
        join(process.cwd(), "packages/wire/dist/client", filename),
        join(process.cwd(), "../packages/wire/dist/client", filename),
        join(process.cwd(), "node_modules/@kirejs/wire/dist/client", filename),
    ];

    for (const p of pathsToTry) {
        if (existsSync(p)) {
            try {
                return readFileSync(p, "utf-8");
            } catch (e) {
                // Silently fail and try next path
            }
        }
    }
    return null;
}
