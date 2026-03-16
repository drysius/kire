import { describe, expect, it } from "bun:test";
import { scanDirectives } from "../src/core/directiveScan";
import { extractInterfaceContextsFromDirectives } from "../src/utils/interface";

describe("@interface tooling parser", () => {
	it("parses object shapes with generic types", () => {
		const directives = scanDirectives(
			"@interface({ user: Map<string, User>, settings: Partial<AppSettings> })",
		);
		const contexts = extractInterfaceContextsFromDirectives(directives);

		expect(contexts.local.vars.get("user")?.type).toBe("Map<string, User>");
		expect(contexts.local.vars.get("settings")?.type).toBe(
			"Partial<AppSettings>",
		);
	});

	it("parses local thisType declarations", () => {
		const directives = scanDirectives("@interface(App.ViewModel)");
		const contexts = extractInterfaceContextsFromDirectives(directives);

		expect(contexts.local.thisType).toBe("App.ViewModel");
	});

	it("extracts interface field descriptions from comments", () => {
		const directives = scanDirectives(`
@interface({
	/** Human readable table type */
	type: string,
	size: "sm" | "md" /* Visual density */
})
		`);
		const contexts = extractInterfaceContextsFromDirectives(directives);

		expect(contexts.local.vars.get("type")?.description).toBe(
			"Human readable table type",
		);
		expect(contexts.local.vars.get("size")?.description).toBe("Visual density");
	});
});
