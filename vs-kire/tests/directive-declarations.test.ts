import { beforeEach, describe, expect, it } from "bun:test";
import { kireStore } from "../src/core/store";
import { extractTopLevelDirectiveDeclarations } from "../src/utils/directiveDeclarations";

describe("extractTopLevelDirectiveDeclarations", () => {
	beforeEach(() => {
		kireStore.getState().clear();
		kireStore.getState().setEngine({
			getDirective(name: string) {
				if (name === "const" || name === "let") {
					return {
						name,
						children: false,
						scope(args: string[]) {
							const expr = args[0] || "";
							const first = expr.split("=")[0];
							return first ? [first.trim()] : [];
						},
					};
				}
				if (name === "error") {
					return {
						name,
						children: true,
						scope() {
							return ["$message"];
						},
					};
				}
				return undefined;
			},
		} as any);
	});

	it("extracts top-level vars declared by @const and @let", () => {
		const vars = extractTopLevelDirectiveDeclarations(`
@const(title = "Orders")
@let(count = items.length)
		`);

		expect(vars.map((entry) => entry.name)).toEqual(["title", "count"]);
		expect(vars[0]?.directive).toBe("const");
		expect(vars[1]?.directive).toBe("let");
	});

	it("ignores block scoped directives", () => {
		const vars = extractTopLevelDirectiveDeclarations(`
@error("name")
  {{ $message }}
@enderror
		`);

		expect(vars).toHaveLength(0);
	});

	it("falls back to signature pattern metadata when runtime scope is unavailable", () => {
		kireStore.getState().setEngine(null);
		kireStore.getState().applyKireSchema({
			directives: [
				{
					name: "const",
					children: false,
					signature: ["$name = $value"],
				},
			],
		} as any);

		const vars = extractTopLevelDirectiveDeclarations(`@const(title = "Orders")`);
		expect(vars.map((entry) => entry.name)).toEqual(["title"]);
	});

	it("prefers declares metadata when available", () => {
		kireStore.getState().setEngine(null);
		kireStore.getState().applyKireSchema({
			directives: [
				{
					name: "const",
					children: false,
					signature: ["expr:string"],
					declares: [{ fromArg: 0, pattern: "$name = $value", capture: "name", type: "any" }],
				},
			],
		} as any);

		const vars = extractTopLevelDirectiveDeclarations(`@const(title = "Orders")`);
		expect(vars.map((entry) => entry.name)).toEqual(["title"]);
	});

	it("captures const initializer metadata for virtual typing", () => {
		const vars = extractTopLevelDirectiveDeclarations(
			`@const(resolvedShellClass = \`mc-table-shell \${it.shellClass || ""}\`.trim())`,
		);

		expect(vars[0]?.name).toBe("resolvedShellClass");
		expect(vars[0]?.declarationKind).toBe("const");
		expect(vars[0]?.initializer).toBe("`mc-table-shell ${it.shellClass || \"\"}`.trim()");
		expect(vars[0]?.description).toBe("Constant declared by @const.");
	});
});
