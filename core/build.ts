import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const outDir = join(import.meta.dir, "dist/browser");
const entryFile = join(import.meta.dir, "src/browser.ts");
if (!existsSync(outDir)) {
	mkdirSync(outDir, { recursive: true });
}

console.log("Building Kire browser runtime...");

try {
	const result =
		await $`bun build ${entryFile} --outdir ${outDir} --target browser --format esm --minify --sourcemap=external`;

	if (result.exitCode !== 0) {
		console.error("Kire browser build failed.");
		process.exit(1);
	}

	const generatedFile = join(outDir, "browser.js");
	const generatedMap = `${generatedFile}.map`;
	const targetFile = join(outDir, "kire.js");
	const targetMap = `${targetFile}.map`;

	if (existsSync(generatedFile)) {
		const content = readFileSync(generatedFile, "utf-8");
		if (
			/from\s*["']node:/.test(content) ||
			/import\(\s*["']node:/.test(content)
		) {
			throw new Error("Browser bundle still references node:* modules.");
		}

		renameSync(generatedFile, targetFile);
		if (existsSync(generatedMap)) {
			renameSync(generatedMap, targetMap);
		}
	}

	console.log("Kire browser runtime built at dist/browser/kire.js");
} catch (error) {
	console.error("Error while building Kire browser runtime:", error);
	process.exit(1);
}
