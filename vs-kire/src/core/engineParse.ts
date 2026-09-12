import { kireLog } from "./log";
import { kireStore } from "./store";

export interface StructuralProblem {
	message: string;
	start: number;
	end: number;
	severity: "error" | "warning";
}

interface EngineLike {
	parseDetailed?: (content: string) => {
		nodes: unknown[];
		errors: Array<{ message: string; start: number; end: number }>;
	};
	getDirective?: (name: string) => unknown;
	directive?: (def: Record<string, unknown>) => unknown;
}

let syncedRevision = -1;

/**
 * Directives that only exist in the store (declared by kire.schema.js as
 * plain metadata, without running `handle(engine)`) are unknown to the
 * engine's lexer. Register no-op stubs carrying just the structural bits
 * (children, closeBy, relatedTo) so the parser treats them like the real
 * thing. Runs once per store revision.
 */
function syncSchemaDirectivesIntoEngine(engine: EngineLike): void {
	const state = kireStore.getState();
	if (state.revision === syncedRevision) return;
	if (typeof engine.directive !== "function" || !engine.getDirective) return;

	let added = 0;
	for (const def of state.directives.values()) {
		if (!def?.name || engine.getDirective(def.name)) continue;
		try {
			engine.directive({
				name: def.name,
				children: def.children,
				closeBy: def.closeBy,
				relatedTo: Array.isArray(def.related) ? def.related : def.relatedTo,
				onCall: () => {},
			});
			added++;
		} catch {}
	}
	syncedRevision = state.revision;
	if (added > 0) {
		kireLog("debug", `Registered ${added} schema-only directive stub(s) in engine.`);
	}
}

/**
 * Structural diagnostics straight from the Kire lexer, so the extension
 * reports exactly what the engine would do with the template. Returns null
 * when no engine with `parseDetailed` is loaded (older runtime), in which
 * case callers fall back to the regex-based validators.
 */
export function getStructuralProblems(text: string): StructuralProblem[] | null {
	const engine = kireStore.getState().engine as EngineLike | null;
	if (!engine || typeof engine.parseDetailed !== "function") return null;

	syncSchemaDirectivesIntoEngine(engine);

	try {
		const { errors } = engine.parseDetailed(text);
		return errors.map((error) => ({
			message: error.message,
			start: error.start,
			end: Math.max(error.end, error.start + 1),
			severity: error.message.endsWith("is not closed") ? "warning" : "error",
		}));
	} catch (error) {
		kireLog(
			"warn",
			`Engine parse failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return null;
	}
}
