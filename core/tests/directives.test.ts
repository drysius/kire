import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";
import { consumeStream } from "../src/utils/stream";

describe("Kire Directives & Elements", () => {
    const kire = new Kire({ production: false });

    test("@if with process.uptime() logic", async () => {
        const template = "@if(uptime % 2 === 0)EVEN@elseODD@endif";
        
        const res1 = await kire.render(template, { uptime: 2 });
        expect(res1).toBe("EVEN");
        
        const res2 = await kire.render(template, { uptime: 3 });
        expect(res2).toBe("ODD");
    });

    test("@switch directive", async () => {
        const template = `
            @switch(val)
                @case(1)One@endcase
                @case(2)Two@endcase
                @defaultOther@enddefault
            @endswitch
        `.trim();
        const res1 = await consumeStream(await kire.render(template, { val: 1 }));
        expect(res1.trim()).toBe("One");
        const res2 = await consumeStream(await kire.render(template, { val: 2 }));
        expect(res2.trim()).toBe("Two");
        const res3 = await consumeStream(await kire.render(template, { val: 3 }));
        expect(res3.trim()).toBe("Other");
    });

    test("@isset and @empty", async () => {
        expect(await consumeStream(await kire.render("@isset(v)YES@endisset", { v: 1 }))).toBe("YES");
        expect(await consumeStream(await kire.render("@isset(v)YES@endisset", { v: null }))).toBe("");
        
        expect(await consumeStream(await kire.render("@empty(v)EMPTY@endempty", { v: [] }))).toBe("EMPTY");
        expect(await consumeStream(await kire.render("@empty(v)EMPTY@endempty", { v: [1] }))).toBe("");
    });

    test("@class and @style", async () => {
        const tplClass = '<div @class(["a", b ? "b" : ""])></div>';
        const resClass = await consumeStream(await kire.render(tplClass, { b: true }));
        expect(resClass).toContain('class="a b"');
        
        const tplStyle = '<div @style({ color: "red", display: show ? "block" : "none" })></div>';
        const resStyle = await consumeStream(await kire.render(tplStyle, { show: true }));
        expect(resStyle).toContain('style="color: red; display: block"');
    });

    test("Namespaces and Views", async () => {
        const k = new Kire();
        const vPath = k.resolvePath("admin/dashboard");
        k.$virtualFiles[vPath] = "Admin View";
        k.namespace("admin", k.$root + "/admin");
        
        const result = await consumeStream(await k.view("admin.dashboard"));
        expect(result).toBe("Admin View");
    });

    test("<kire:if> and <kire:for> elements", async () => {
        const tplIf = '<kire:if cond="true">Visible</kire:if>';
        expect(await consumeStream(await kire.render(tplIf))).toBe("Visible");

        // Use raw text for inner content to avoid initial interpolation errors
        const tplFor = '<kire:for items="[1,2]" as="i">#</kire:for>';
        const resFor = await consumeStream(await kire.render(tplFor));
        expect(resFor).toBe("##");
    });

    test("@stack and @push", async () => {
        const template = `
            @stack("scripts")
            @push("scripts")<script>1</script>@endpush
            @push("scripts")<script>2</script>@endpush
        `.trim();
        const result = await consumeStream(await kire.render(template));
        expect(result.trim()).toContain("<script>1</script>");
        expect(result.trim()).toContain("<script>2</script>");
    });

    test("@define and @defined", async () => {
        const template = '@define("header")<h1>Title</h1>@enddefine @defined("header")Fallback@enddefined';
        const result = await consumeStream(await kire.render(template));
        expect(result.trim()).toBe("<h1>Title</h1>");
    });

    test("@unless directive", async () => {
        const template = "@unless(check)Show@endunless";
        expect(await consumeStream(await kire.render(template, { check: false }))).toBe("Show");
        expect(await consumeStream(await kire.render(template, { check: true }))).toBe("");
    });

    test("@error directive", async () => {
        const template = "@error('email'){{ $message }}@enderror";
        const result = await consumeStream(await kire.render(template, { errors: { email: "Invalid email" } }));
        expect(result).toBe("Invalid email");
    });

    test("@let and @const directives", async () => {
        const template = "@let(x = 10)@const(y = 20){{ x + y }}";
        const result = await consumeStream(await kire.render(template));
        expect(result).toBe("30");
    });

    test("@switch with non-string values", async () => {
        const template = "@switch(val)@case(true)TRUE@endcase@case(false)FALSE@endswitch";
        expect(await consumeStream(await kire.render(template, { val: true }))).toBe("TRUE");
        expect(await consumeStream(await kire.render(template, { val: false }))).toBe("FALSE");
    });

    test("escaped interpolation", async () => {
        const template = "@{{ escaped }} @{{{ raw_escaped }}}";
        expect(await consumeStream(await kire.render(template))).toBe("{{ escaped }} {{{ raw_escaped }}}");
    });
});
