import { describe, expect, it } from "bun:test";
import { formatCode } from "../src/utils/formatCode";

describe("formatCode", () => {
	it("formats javascript", async () => {
		const out = await formatCode("const x=1;let  y=2", "javascript");
		expect(out).toBe("const x = 1;\nlet y = 2;");
	});
	it("formats typescript", async () => {
		const out = await formatCode("const x:number=1", "typescript");
		expect(out).toBe("const x: number = 1;");
	});
	it("formats css", async () => {
		const out = await formatCode(".a{color:red;margin:0}", "css");
		expect(out).toContain("color: red;");
		expect(out).toContain("margin: 0;");
	});
	it("honors tabWidth/useTabs", async () => {
		const out = await formatCode("function f(){return 1}", "javascript", { useTabs: true });
		expect(out).toContain("\treturn 1;");
	});
	it("returns null on syntax error (caller falls back)", async () => {
		expect(await formatCode("const = ;", "javascript")).toBeNull();
	});
	it("empty input returns empty", async () => {
		expect(await formatCode("   ", "css")).toBe("");
	});
});
