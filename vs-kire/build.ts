declare const Bun: any;

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The Kire core version this extension bundles, read from core/package.json. */
function coreVersion(): string {
	try {
		const pkg = JSON.parse(
			readFileSync(join(import.meta.dirname, "../core/package.json"), "utf8"),
		);
		return typeof pkg?.version === "string" ? pkg.version : "0.0.0";
	} catch {
		return "0.0.0";
	}
}

async function buildExtension(): Promise<void> {
	await Bun.build({
		entrypoints: ["./src/extension.ts"],
		outdir: "./dist",
		target: "node",
		format: "esm",
		external: ["vscode"],
		root: "./src",
	});

	await Bun.build({
		entrypoints: ["./bundled/kire-runtime.ts"],
		outdir: "./dist",
		target: "node",
		format: "esm",
		root: "./bundled",
		define: {
			__KIRE_VERSION__: JSON.stringify(coreVersion()),
		},
	});
}

buildExtension();
