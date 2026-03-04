import { $ } from "bun";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Script to build the client-side Wire runtime.
 */
const outDir = join(import.meta.dir, "dist/client");
const esmDir = join(import.meta.dir, "dist/esm");
const cjsDir = join(import.meta.dir, "dist/cjs");
if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
}
if (!existsSync(esmDir)) {
    mkdirSync(esmDir, { recursive: true });
}
if (!existsSync(cjsDir)) {
    mkdirSync(cjsDir, { recursive: true });
}

console.log("🚀 Building Wire Client (Web)...");

try {
    // Using --outdir to support external sourcemaps
    const result = await $`bun build ./web/index.ts --outdir ${outDir} --minify --sourcemap=external --target browser`;
    
    if (result.exitCode === 0) {
        // Bun names the file based on entry point (index.ts -> index.js)
        // We rename it to wire.js for better branding
        const generatedFile = join(outDir, "index.js");
        const targetFile = join(outDir, "wire.js");
        
        if (existsSync(generatedFile)) {
            renameSync(generatedFile, targetFile);
            // Also rename the sourcemap if it exists
            if (existsSync(generatedFile + ".map")) {
                renameSync(generatedFile + ".map", targetFile + ".map");
            }
        }

        console.log("✅ Wire Client built successfully at dist/client/wire.js");
    } else {
        console.error("❌ Wire Client build failed!");
        process.exit(1);
    }

    const esm = await $`bun build ./src/index.ts --outdir ${esmDir} --format esm --target node --packages external`;
    if (esm.exitCode !== 0) {
        console.error("❌ Wire server ESM build failed!");
        process.exit(1);
    }

    const cjs = await $`bun build ./src/index.ts --outdir ${cjsDir} --format cjs --target node --packages external`;
    if (cjs.exitCode !== 0) {
        console.error("❌ Wire server CJS build failed!");
        process.exit(1);
    }

    writeFileSync(join(esmDir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(cjsDir, "package.json"), JSON.stringify({ type: "commonjs" }));

    console.log("✅ Wire Server built successfully at dist/esm and dist/cjs");
} catch (error) {
    console.error("❌ Error during build:", error);
    process.exit(1);
}
