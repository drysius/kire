import { $ } from "bun";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(import.meta.dir, "dist/client");
const esmDir = join(import.meta.dir, "dist/esm");
const esmMethodsDir = join(esmDir, "methods");
const esmAdaptersDir = join(esmDir, "adapters");
const cjsDir = join(import.meta.dir, "dist/cjs");
const cjsMethodsDir = join(cjsDir, "methods");
const cjsAdaptersDir = join(cjsDir, "adapters");
const distDir = join(import.meta.dir, "dist");

function ensureDir(dir: string) {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

ensureDir(outDir);
ensureDir(esmDir);
ensureDir(esmMethodsDir);
ensureDir(esmAdaptersDir);
ensureDir(cjsDir);
ensureDir(cjsMethodsDir);
ensureDir(cjsAdaptersDir);
ensureDir(distDir);

async function buildServerEntry(
	entry: string,
	outfile: string,
	format: "esm" | "cjs",
	label: string,
) {
	const result = await $`bun build ${entry} --outfile ${outfile} --format ${format} --target node --packages external`;
	if (result.exitCode !== 0) {
		throw new Error(`${label} build failed.`);
	}
}

console.log("[wire] Building web client...");

try {
	const clientResult = await $`bun build ./web/index.ts --outdir ${outDir} --minify --sourcemap=external --target browser`;
	if (clientResult.exitCode !== 0) {
		throw new Error("Wire client build failed.");
	}

	const generatedClientFile = join(outDir, "index.js");
	const targetClientFile = join(outDir, "wire.js");
	if (existsSync(generatedClientFile)) {
		renameSync(generatedClientFile, targetClientFile);
		if (existsSync(`${generatedClientFile}.map`)) {
			renameSync(`${generatedClientFile}.map`, `${targetClientFile}.map`);
		}
	}

	await buildServerEntry(
		"./src/index.ts",
		join(esmDir, "index.js"),
		"esm",
		"Wire server ESM",
	);
	await buildServerEntry(
		"./src/methods/index.ts",
		join(esmMethodsDir, "index.js"),
		"esm",
		"Wire methods ESM",
	);
	await buildServerEntry(
		"./src/adapters/index.ts",
		join(esmAdaptersDir, "index.js"),
		"esm",
		"Wire adapters ESM",
	);

	await buildServerEntry(
		"./src/index.ts",
		join(cjsDir, "index.js"),
		"cjs",
		"Wire server CJS",
	);
	await buildServerEntry(
		"./src/methods/index.ts",
		join(cjsMethodsDir, "index.js"),
		"cjs",
		"Wire methods CJS",
	);
	await buildServerEntry(
		"./src/adapters/index.ts",
		join(cjsAdaptersDir, "index.js"),
		"cjs",
		"Wire adapters CJS",
	);

	const fivemClientFile = join(distDir, "fivem-client.js");
	const fivemClientResult = await $`bun build ./fivem/client.ts --outfile ${fivemClientFile} --target bun`;
	if (fivemClientResult.exitCode !== 0) {
		throw new Error("Wire FiveM client build failed.");
	}

	writeFileSync(join(esmDir, "package.json"), JSON.stringify({ type: "module" }));
	writeFileSync(join(cjsDir, "package.json"), JSON.stringify({ type: "commonjs" }));

	console.log("[wire] Build complete: client, server, methods, adapters, fivem-client.");
} catch (error) {
	console.error("[wire] Build error:", error);
	process.exit(1);
}
