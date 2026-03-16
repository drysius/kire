import { describe, expect, it } from "bun:test";
import { extractJsAttributeExpressions } from "../src/utils/embedded";

describe("extractJsAttributeExpressions", () => {
	it("extracts forced dynamic expressions from x-* component props", () => {
		const [attr] = extractJsAttributeExpressions(
			'<x-button label="{user.name}" icon="gear" />',
		).filter((entry) => entry.name === "label");

		expect(attr?.tagName).toBe("x-button");
		expect(attr?.value).toBe("user.name");
	});

	it("does not treat plain html attrs wrapped with braces as js", () => {
		const attrs = extractJsAttributeExpressions(
			'<div title="{user.name}" data-id="1"></div>',
		);

		expect(attrs.find((entry) => entry.name === "title")).toBeUndefined();
	});
});
