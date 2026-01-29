import { describe, expect, test } from "bun:test";
import { Kire } from "../src/index";

describe("Kire - Escaping & Raw Interpolation", () => {
	test("Standard interpolation {{ }} should escape HTML", async () => {
		const kire = new Kire({ silent: true });
		const template = "Hello {{ it.name }}";
		const result = await kire.render(template, { name: "<b>World</b>" });
		expect(result).toBe("Hello &lt;b&gt;World&lt;/b&gt;");
	});

	test("Raw interpolation {{{ }}} should NOT escape HTML", async () => {
		const kire = new Kire({ silent: true });
		const template = "Hello {{{ it.name }}}";
		const result = await kire.render(template, { name: "<b>World</b>" });
		expect(result).toBe("Hello <b>World</b>");
	});

	test("Mixed interpolation types", async () => {
		const kire = new Kire({ silent: true });
		const template = "Escaped: {{ it.val }}, Raw: {{{ it.val }}}";
		const result = await kire.render(template, { val: "<i>Italic</i>" });
		expect(result).toBe(
			"Escaped: &lt;i&gt;Italic&lt;/i&gt;, Raw: <i>Italic</i>",
		);
	});

	test("Null and undefined should render as empty string", async () => {
		const kire = new Kire({ silent: true });
		const template = "Null: {{ it.n }}, Undefined: {{ it.u }}";
		const result = await kire.render(template, { n: null, u: undefined });
		expect(result).toBe("Null: , Undefined: ");
	});
});
