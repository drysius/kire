import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Source Map Error Reporting", () => {
	test("Should use source map to report error location", async () => {
		const kire = new Kire({ production: false }); // Enable source maps
		
        // Template with multiple lines to ensure we aren't just lucky
		const template = `
Hello
World
{{ it.missing.prop }}
End
`;
		
        // render catches runtime errors and returns HTML
        const result = await kire.render(template, { missing: undefined }, undefined, "error.kire");
        
        // Check for error page content
        expect(result).toContain("Kire Runtime Error at error.kire:4");
        // Check if the snippet correctly highlights line 4
        expect(result).toContain('<span style="color:#666; user-select:none; width: 30px; text-align: right;">4</span><span>{{ it.missing.prop }}</span>');
	});
});
