import { expect, spyOn, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire Error Reporting - Should format runtime errors with context", async () => {
	const kire = new Kire({ silent: true });

	// Spy on console.error to capture the formatted message
	const errorSpy = spyOn(console, "error").mockImplementation(() => {});

	const template = `
    <h1>Hello</h1>
    <p>This is fine</p>
    {{ it.nonExistentVariable.property }}
    <p>This will not run</p>
    `;

	const result = await kire.render(template);
	
    expect(errorSpy).toHaveBeenCalled();
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("Kire Runtime Error");
    
    errorSpy.mockRestore();
});
