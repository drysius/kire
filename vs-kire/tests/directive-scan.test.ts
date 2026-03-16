import { describe, expect, it } from "bun:test";
import { scanDirectives } from "../src/core/directiveScan";

describe("scanDirectives", () => {
	it("keeps generic commas inside @interface types", () => {
		const [directive] = scanDirectives(
			"@interface({ user: Map<string, User>, settings: Partial<AppSettings> })",
		);

		expect(directive?.name).toBe("interface");
		expect(directive?.args).toHaveLength(1);
		expect(directive?.args[0]?.value).toBe(
			"{ user: Map<string, User>, settings: Partial<AppSettings> }",
		);
	});

	it("keeps generic commas inside multiple directive arguments", () => {
		const [directive] = scanDirectives(
			"@interface({ user: Result<Account, Error> }, true)",
		);

		expect(directive?.args).toHaveLength(2);
		expect(directive?.args[0]?.value).toBe("{ user: Result<Account, Error> }");
		expect(directive?.args[1]?.value).toBe("true");
	});
});
