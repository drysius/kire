/**
 * Build the wire package: server bundles (ESM + CJS) and a standalone browser
 * client bundle. The client must not pull in any Node built-ins — the build
 * fails loudly if it does. Run with `bun run packages/wire/build.ts`.
 */
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = `${dir}/`;
const at = (p: string) => join(dir, p);

await rm(at("dist"), { recursive: true, force: true });

async function bundle(label: string, opts: Parameters<typeof Bun.build>[0]) {
	const result = await Bun.build(opts);
	if (!result.success) {
		console.error(`✗ ${label} failed`);
		for (const log of result.logs) console.error(log);
		process.exit(1);
	}
	console.log(`✓ ${label}`);
}

// Server (depends on `kire` and node built-ins, kept external)
await bundle("server esm", {
	entrypoints: [`${root}src/index.ts`],
	outdir: `${root}dist/esm`,
	target: "node",
	format: "esm",
	external: ["kire"],
});
await bundle("server cjs", {
	entrypoints: [`${root}src/index.ts`],
	outdir: `${root}dist/cjs`,
	target: "node",
	format: "cjs",
	external: ["kire"],
});

// Client (browser; must be Node-free)
await bundle("client", {
	entrypoints: [`${root}src/client/index.ts`],
	outdir: `${root}dist/client`,
	target: "browser",
	format: "esm",
	minify: true,
});

const clientCode = await Bun.file(`${root}dist/client/index.js`).text();
if (/\bnode:|require\(["']node:/.test(clientCode)) {
	console.error("✗ client bundle contains Node imports");
	process.exit(1);
}
console.log("✓ client bundle is Node-free");
