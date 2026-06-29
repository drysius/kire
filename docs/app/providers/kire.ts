import path from "node:path";
import { fileURLToPath } from "node:url";
import KireMarkdown from "@kirejs/markdown";
import { Kire } from "kire";
import { isProd } from "#app/config";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VIEWS_ROOT = path.resolve(PACKAGE_ROOT, "resources/views");

let engine: Kire<boolean> | null = null;

/**
 * The configured Kire engine (singleton). Views live in `resources/views`;
 * markdown rendering is available via `kire().mdrender(...)`.
 */
export function kire(): Kire<boolean> {
	if (engine) return engine;
	engine = new Kire({
		root: VIEWS_ROOT,
		extension: "kire",
		production: isProd(),
	});
	engine.plugin(KireMarkdown, { codeBlockClass: "kire-code not-prose" });
	return engine;
}
