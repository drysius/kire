import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Attempts to locate and read the content of a Wire client asset.
 */
export async function getAssetContent(filename: string): Promise<{ content: string | Buffer, contentType: string } | null> {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    const pathsToTry = [
        // 1. Relative to this source file (development)
        resolve(__dirname, "../../dist/client", filename),
        resolve(__dirname, "../web", filename),
        
        // 2. Relative to process.cwd() (standard project layout)
        resolve(process.cwd(), "packages/wire/dist/client", filename),
        resolve(process.cwd(), "dist/client", filename),
        
        // 3. Node modules path
        resolve(process.cwd(), "node_modules/@kirejs/wire/dist/client", filename),
    ];

    for (const p of pathsToTry) {
        if (existsSync(p)) {
            try {
                const content = readFileSync(p);
                const contentType = filename.endsWith(".js") ? "application/javascript" : "text/css";
                return { content, contentType };
            } catch (e) {
                // Skip and try next path
            }
        }
    }
    
    return null;
}
