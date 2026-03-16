import { kirePlugin } from "kire";
import { renderViteTags } from "./manifest";
import type { KireViteRenderOptions } from "./types";

const DEFAULT_OPTIONS: KireViteRenderOptions = {
	publicDirectory: "public",
	buildDirectory: "build",
	manifestFilename: "manifest.json",
	throwOnMissingEntry: true,
};

export const KireVite = kirePlugin<KireViteRenderOptions>(
	DEFAULT_OPTIONS,
	(kire, opts) => {
		const runtimeOptions: KireViteRenderOptions = {
			...DEFAULT_OPTIONS,
			...opts,
		};

		kire.kireSchema({
			name: "@kirejs/vite",
			author: "Drysius",
			repository: "https://github.com/drysius/kire",
			version: "0.1.0",
		});

		kire.$global("$vite", (entries?: unknown) =>
			renderViteTags(entries, runtimeOptions),
		);

		kire.directive({
			name: "vite",
			signature: ["entries:string|string[]"],
			children: false,
			description:
				"Inject Vite assets. Uses hot file in development and manifest.json in production.",
			example: `@vite(["js/app.js", "css/app.css"])`,
			onCall(api) {
				const args = api.node.args || [];
				if (args.length === 0) {
					api.write("$kire_response += $globals.$vite();");
					return;
				}

				if (args.length === 1) {
					api.write(`$kire_response += $globals.$vite(${args[0]});`);
					return;
				}

				api.write(`$kire_response += $globals.$vite([${args.join(",")}]);`);
			},
		});
	},
);

export default KireVite;
