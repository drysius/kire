import { $ } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = import.meta.dir;
const serverDir = join(root, "server");
const clientDir = join(root, "client");

if (!existsSync(serverDir)) {
    mkdirSync(serverDir, { recursive: true });
}
if (!existsSync(clientDir)) {
    mkdirSync(clientDir, { recursive: true });
}

const serverEntry = join(root, "server.ts");
const serverOut = join(serverDir, "server.js");
const clientEntry = join(root, "../../packages/wire/fivem/client.ts");
const clientOut = join(clientDir, "fivem-client.js");
const clientAliasOut = join(clientDir, "fv-client.js");
const wireClientEntry = join(root, "../../packages/wire/web/index.ts");
const wireClientOut = join(clientDir, "kirewire.js");

console.log("Building FiveM example server bundle...");
const serverBuild = await $`bun build ${serverEntry} --outfile ${serverOut} --target node --format cjs`;
if (serverBuild.exitCode !== 0) {
    console.error("Failed to build examples/fivem-example/server.ts");
    process.exit(1);
}

console.log("Building FiveM client bridge bundle...");
const clientBuild = await $`bun build ${clientEntry} --outfile ${clientOut} --target bun`;
if (clientBuild.exitCode !== 0) {
    console.error("Failed to build packages/wire/fivem/client.ts");
    process.exit(1);
}

const aliasBuild = await $`bun build ${clientEntry} --outfile ${clientAliasOut} --target bun`;
if (aliasBuild.exitCode !== 0) {
    console.error("Failed to build client alias bundle (fv-client.js).");
    process.exit(1);
}

console.log("Building local wire web runtime...");
const wireClientBuild = await $`bun build ${wireClientEntry} --outfile ${wireClientOut} --target browser --minify`;
if (wireClientBuild.exitCode !== 0) {
    console.error("Failed to build packages/wire/web/index.ts");
    process.exit(1);
}

console.log("FiveM example build completed.");
console.log(`- Server: ${serverOut}`);
console.log(`- Client: ${clientOut}`);
