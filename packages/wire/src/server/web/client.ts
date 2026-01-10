import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ClientConfig {
	endpoint: string;
	method?: "http" | "socket";
	csrf?: string;
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
			// Relative to the source file (when running from dist/mjs/web/client.js)
			resolve(
				dirname(fileURLToPath(import.meta.url)),
				"../../client",
				filename,
			),
			// Relative to source file (when running from src/web/client.ts in dev)
			resolve(
				dirname(fileURLToPath(import.meta.url)),
				"../../dist/client",
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
					`[KireWire] Failed to read client script from ${foundPath}`,
					e,
				);
			}
		} else {
			// Only log if not in test environment to avoid noise
			if (process.env.NODE_ENV !== "test") {
				console.error(
					`[KireWire] Could not find client script ${filename}. Checked:`,
					pathsToTry,
				);
			}
			return `<script>console.error("KireWire client script not found. Please run 'bun run build' in packages/wire.");</script>`;
		}
	}

	return `
<script>
    window.__KIREWIRE_CONFIG__ = ${JSON.stringify(config)};
</script>
<script>
    ${scriptContent}
</script>
`;
};
