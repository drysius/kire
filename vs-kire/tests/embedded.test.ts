import { describe, expect, it } from "bun:test";
import {
	extractJsAttributeExpressions,
	extractTagAttributes,
} from "../src/utils/embedded";

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

	it("captures boolean kire attributes for tokenization without treating them as js expressions", () => {
		const attrs = extractTagAttributes('<a wire:navigate href="/docs"></a>');
		const navigate = attrs.find((entry) => entry.name === "wire:navigate");

		expect(navigate?.hasValue).toBe(false);
		expect(navigate?.value).toBe("");
		expect(
			extractJsAttributeExpressions('<a wire:navigate href="/docs"></a>').find(
				(entry) => entry.name === "wire:navigate",
			),
		).toBeUndefined();
	});
});
