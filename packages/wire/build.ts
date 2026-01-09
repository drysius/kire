import { $ } from "bun";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

console.log("⚡ [Wire] Starting prebuild...");

// 1. Build Client
console.log("   [Client] Building kirewire.js...");
await $`bun build ./src/client/index.ts --outfile ./dist/client/kirewire.js --target browser`;
await $`bun build ./src/client/index.ts --outfile ./dist/client/kirewire.min.js --minify --target browser`;

// 2. Build Adapters
console.log("   [Adapters] Building server adapters...");
const adaptersDir = join(process.cwd(), "src/server/adapters");
const files = await readdir(adaptersDir);

for (const file of files) {
    if (!file.endsWith('.ts')) continue;
    
    const name = file.replace('.ts', '');
    console.log(`     - ${name}`);
    
    const entry = join(adaptersDir, file);
    
    // Build ESM
    await $`bun build ${entry} --outdir ./dist/esm/adapters --format esm --target node --packages external`;
    
    // Build CJS (Rename .js to .cjs manually if needed, or let bun handle extension if we use specific outfile, 
    // but --outdir outputs .js. We might need to rename or rely on package.json "type": "commonjs" in subfolder if we structure it that way.
    // However, root build.ts expects adapters in specific paths.
    // The main build.ts uses --outdir and then writes a package.json.
    
    // Let's match the output expected by package.json exports:
    // require: "./dist/cjs/adapters/express.cjs"
    // import: "./dist/esm/adapters/express.js"
    
    await $`bun build ${entry} --outfile ./dist/esm/adapters/${name}.js --format esm --target node --packages external`;
    await $`bun build ${entry} --outfile ./dist/cjs/adapters/${name}.cjs --format cjs --target node --packages external`;
}

console.log("✅ [Wire] Prebuild complete.");
