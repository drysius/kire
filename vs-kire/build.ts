declare const Bun: any;

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
	});
}

buildExtension();
