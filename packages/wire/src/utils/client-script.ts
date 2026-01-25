import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ClientConfig {
	route?: string;
	adapter?: string;
	csrf?: string;
	token?: string;
	[key: string]: any;
}

let cachedScript: string | null = null;

export const getClientScript = (config: ClientConfig, production = true) => {
	const filename = production ? "kirewire.min.js" : "kirewire.js";
	let scriptContent = "";

	if (production && cachedScript) {
		scriptContent = cachedScript;
	} else {
		const pathsToTry = [
			// Relative to the source file (when running from dist/mjs/utils/client-script.js)
			resolve(
				dirname(fileURLToPath(import.meta.url)),
				"../../client",
				filename,
			),
			// Relative to source file (when running from src/utils/client-script.ts in dev)
			resolve(
				dirname(fileURLToPath(import.meta.url)),
				"../../dist/client",
				filename,
			),
			// Relative to source file (when running from src/utils/client-script.ts in dev)
			resolve(
				dirname(fileURLToPath(import.meta.url)),
				"../../../dist/client",
				filename,
			),
			// Monorepo/Workspace context: Current CWD is root or example
			join(process.cwd(), "packages/wire/dist/client", filename),
			// Monorepo context: If CWD is inside example
			join(process.cwd(), "../../packages/wire/dist/client", filename),
			// Node modules context
			join(process.cwd(), "node_modules/@kirejs/wire/dist/client", filename),
		];

		let foundPath = "";
		for (const p of pathsToTry) {
			if (existsSync(p)) {
				foundPath = p;
				break;
			}
		}

		if (foundPath) {
			try {
				scriptContent = readFileSync(foundPath, "utf-8");
				if (production) cachedScript = scriptContent;
			} catch (e) {
				console.error(
					`[Wired] Failed to read client script from ${foundPath}`,
					e,
				);
			}
		} else {
			if (process.env.NODE_ENV !== "test") {
				console.error(
					`[Wired] Could not find client script ${filename}. Checked:`,
					pathsToTry,
				);
			}
			return `<script>console.error("Wired client script not found. Please run 'bun run build' in packages/wire.");</script>`;
		}
	}
	return `
<style>
    [wire:loading], [wire:loading.delay], [wire:loading.inline-block], [wire:loading.inline], [wire:loading.block], [wire:loading.flex], [wire:loading.table], [wire:loading.grid], [wire:loading.inline-flex] {
        display: none;
    }
    [wire:loading.delay.shortest], [wire:loading.delay.shorter], [wire:loading.delay.short], [wire:loading.delay.long], [wire:loading.delay.longer], [wire:loading.delay.longest] {
        display: none;
    }
    [wire:offline] {
        display: none;
    }
    [wire:dirty]:not([wire:dirty.class]):not([wire:dirty.attr]) {
        display: none;
    }
</style>
<script>
    ${scriptContent}
</script>
`;
};
