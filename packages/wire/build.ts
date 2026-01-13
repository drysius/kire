import { $ } from "bun";

console.log("⚡ [Wire] Starting prebuild...");

// 1. Build Client
console.log("   [Client] Building kirewire.js...");
await $`bun build ./src/client/index.ts --outfile ./dist/client/kirewire.js --target browser`;
await $`bun build ./src/client/index.ts --outfile ./dist/client/kirewire.min.js --minify --target browser`;

console.log("✅ [Wire] Prebuild complete.");
