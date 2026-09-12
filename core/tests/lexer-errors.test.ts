import { describe, expect, test } from "bun:test";
import { Kire } from "../src/kire";

describe("Lexer structural errors (parseDetailed)", () => {
	const kire = new Kire({ async: false, silent: true });

	test("clean template has no errors and nodes carry offsets", () => {
		const tpl = `<div>@if(a)X@end</div>`;
		const { nodes, errors } = kire.parseDetailed(tpl);
		expect(errors).toEqual([]);
		expect(nodes[0]?.loc?.offset).toBe(0);
		expect(nodes[0]?.children?.[0]?.loc?.offset).toBe(5);
	});

	test("unclosed directive is reported at its start", () => {
		const tpl = `text @if(a) X`;
		const { errors } = kire.parseDetailed(tpl);
		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toBe("@if is not closed");
		expect(errors[0]!.start).toBe(5);
		expect(errors[0]!.end).toBe(8);
	});

	test("orphan closers are reported", () => {
		expect(kire.parseDetailed(`A @end B`).errors[0]!.message).toBe(
			"@end has no matching opening directive",
		);
		expect(kire.parseDetailed(`@if(a)X@endfor@end`).errors[0]!.message).toBe(
			"@endfor does not close the current block",
		);
	});

	test("closing tag without an opening tag is reported", () => {
		const { errors } = kire.parseDetailed(`<div>x</span></div>`);
		expect(errors.map((e) => e.message)).toEqual([
			"</span> has no matching opening tag",
		]);
	});

	test("unclosed element is reported", () => {
		const { errors } = kire.parseDetailed(`<ul><li>a<li>b</ul>`);
		expect(errors.map((e) => e.message)).toEqual([
			"<li> is not closed",
			"<li> is not closed",
		]);
	});

	test("raw elements are not parsed as HTML but still see directives", () => {
		const tpl = `<script>if (a<b) { x() }</script>`;
		expect(kire.parseDetailed(tpl).errors).toEqual([]);
		expect(kire.render(tpl)).toBe(tpl);

		const nested = `<style>\n@if(dark) body { color: #fff }</style>`;
		const { errors } = kire.parseDetailed(nested);
		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toBe("@if is not closed");
		expect(errors[0]!.start).toBe(nested.indexOf("@if"));
		expect(errors[0]!.line).toBe(2);
	});

	test("nested lexer keeps line numbers for nodes inside raw elements", () => {
		const tpl = `<div>\n\n<script>\n{{ a }}\n</script></div>`;
		const nodes = kire.parse(tpl);
		const script = nodes[0]!.children!.find((n) => n.tagName === "script")!;
		const interp = script.children!.find((n) => n.type === "interpolation")!;
		expect(interp.loc?.line).toBe(4);
		expect(interp.loc?.offset).toBe(tpl.indexOf("{{"));
	});
});
