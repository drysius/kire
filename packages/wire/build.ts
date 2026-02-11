import { $ } from "bun";

console.log("⚡ [Wire] Starting prebuild...");

// 1. Build Client
console.log("   [Client] Building kirewire.js...");
await $`bun build ./src/web/index.ts --outfile ./dist/client/kirewire.js --target browser`;
await $`bun build ./src/web/index.ts --outfile ./dist/client/kirewire.min.js --minify --target browser`;

console.log("   [Client] Building kirewire.css...");
const cssContent = await Bun.file("./src/web/kirewire.css").text();
await Bun.write("./dist/client/kirewire.css", cssContent);
// Simple minification for CSS
const minifiedCss = cssContent.replace(/\s+/g, " ").replace(/\{\s+/g, "{").replace(/\s+\}/g, "}").replace(/;\s+/g, ";").trim();
await Bun.write("./dist/client/kirewire.min.css", minifiedCss);

await $`bun build ./src/fivem-client.ts --outfile ./dist/fivem-client.js --minify --target browser`;

console.log("✅ [Wire] Prebuild complete.");
