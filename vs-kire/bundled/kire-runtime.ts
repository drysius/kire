export { Kire } from "../../core/src/index.ts";

// Stamped by vs-kire/build.ts from core/package.json at bundle time, so the
// bundled fallback reports the real Kire version instead of a placeholder.
declare const __KIRE_VERSION__: string;
export const KIRE_VERSION: string =
	typeof __KIRE_VERSION__ === "string" ? __KIRE_VERSION__ : "0.0.0";
