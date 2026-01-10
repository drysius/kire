import { expect, spyOn, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire Error Reporting - Should format runtime errors with context", async () => {
	const kire = new Kire();

	// Spy on console.error to capture the formatted message
	const errorSpy = spyOn(console, "error").mockImplementation(() => {});

	const template = `
    <h1>Hello</h1>
    <p>This is fine</p>
    {{ nonExistentVariable.property }}
    <p>This will not run</p>
    `;

	try {
		await kire.render(template);
	} catch (e: any) {
		console.log(e.toString());
		expect(e.message).toContain("Kire Error:");
		// Check if console.error was called with the formatted message
		expect(errorSpy).toHaveBeenCalled();
		const errorMessage = errorSpy.mock.calls[0]![0] as string;

		// Verify key parts of the formatted error
		expect(errorMessage).toContain("Kire Error:");
		expect(errorMessage).toContain("<anonymous>"); // Source
		expect(errorMessage).toContain("{{ nonExistentVariable.property }}"); // Context snippet (Source code!)
		expect(errorMessage).toContain("trace:"); // Stack trace section
	} finally {
		errorSpy.mockRestore();
	}
});
