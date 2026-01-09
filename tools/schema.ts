import { Kire } from "../core/src/index";
import { writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import { getPackages } from "./utils";

export async function generate() {
    console.log("🔍 Discovering packages...");
    const packages = await getPackages();

    for (const pkg of packages) {
        console.log(`\n📦 Processing ${pkg.name}...`);

        try {
            // Determine if it's Core or a Plugin
            if (pkg.name === "kire") {
                // Core: Load with defaults
                const kire = new Kire();
                const schema = kire.pkgSchema(pkg.name, pkg.json.repository, pkg.version);
                
                const outPath = join(pkg.path, "kire-schema.json");
                await writeFile(outPath, JSON.stringify(schema, null, 4));
                console.log(`✅ Generated kire-schema.json for ${pkg.name}`);
            } else {
                // Plugin: Load WITHOUT defaults to capture only plugin directives
                const kire = new Kire({ directives: false });

                // Try to find entry point
                const entry = join(pkg.path, "src/index.ts");
                if (!existsSync(entry)) {
                    console.log(`⚠️  No src/index.ts found for ${pkg.name}, skipping.`);
                    continue;
                }

                // Dynamic import
                const mod = await import(resolve(entry));
                const plugin = mod.default;

                if (!plugin) {
                    console.log(`⚠️  No default export found in ${entry}, skipping.`);
                    continue;
                }

                if (typeof plugin === 'object' && typeof plugin.load === 'function' || typeof plugin === 'function') {
                    // Load plugin
                    kire.plugin(plugin);

                    const schema = kire.pkgSchema(pkg.name, pkg.json.repository, pkg.version);

                    const outPath = join(pkg.path, "kire-schema.json");
                    await writeFile(outPath, JSON.stringify(schema, null, 4));
                    console.log(`✅ Generated kire-schema.json for ${pkg.name}`);
                } else {
                    console.log(`⚠️  Default export is not a recognized Kire plugin in ${entry}.`);
                }
            }
        } catch (e) {
            console.error(`❌ Error processing ${pkg.name}:`, e);
        }
    }
}

generate();