import { expect, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire Error Reporting - Should return HTML error page automatically", async () => {
	const kire = new Kire({ production: false });
	const template = `{{ it.nonExistentVariable.property }}`;

	const html = await kire.render(template);
    
	expect(html).toContain("<!DOCTYPE html>");
	expect(html).toContain("Kire Runtime Error");
	expect(html).toContain("nonExistentVariable");
});
