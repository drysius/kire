import { expect, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire Error Reporting - Should allow manual HTML error generation", async () => {
	const kire = new Kire({ production: false });
	const template = `{{ nonExistentVariable.property }}`;

	try {
		await kire.render(template);
		// If render didn't throw, fail the test
		expect(true).toBe(false); 
	} catch (e) {
		const html = kire.renderError(e);
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("Kire Runtime Error");
		expect(html).toContain("nonExistentVariable");
	}
});