import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

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
        const res1 = await kire.render(template, { val: 1 });
        expect(res1.trim()).toBe("One");
        const res2 = await kire.render(template, { val: 2 });
        expect(res2.trim()).toBe("Two");
        const res3 = await kire.render(template, { val: 3 });
        expect(res3.trim()).toBe("Other");
    });

    test("@isset and @empty", async () => {
        expect(await kire.render("@isset(v)YES@endisset", { v: 1 })).toBe("YES");
        expect(await kire.render("@isset(v)YES@endisset", { v: null })).toBe("");
        
        expect(await kire.render("@empty(v)EMPTY@endempty", { v: [] })).toBe("EMPTY");
        expect(await kire.render("@empty(v)EMPTY@endempty", { v: [1] })).toBe("");
    });

    test("@class and @style", async () => {
        const tplClass = '<div @class(["a", b ? "b" : ""])></div>';
        const resClass = await kire.render(tplClass, { b: true });
        expect(resClass).toContain('class="a b"');
        
        const tplStyle = '<div @style({ color: "red", display: show ? "block" : "none" })></div>';
        const resStyle = await kire.render(tplStyle, { show: true });
        expect(resStyle).toContain('style="color: red; display: block"');
    });

    test("Namespaces and Views", async () => {
        const k = new Kire();
        const vPath = k.resolve("admin/dashboard");
        k.$files[vPath] = "Admin View";
        k.namespace("admin", k.$root + "/admin");
        
        const result = await k.view("admin.dashboard");
        expect(result).toBe("Admin View");
    });

    test("<kire:if> and <kire:for> elements", async () => {
        const tplIf = '<kire:if cond="true">Visible</kire:if>';
        expect(await kire.render(tplIf)).toBe("Visible");

        // Use raw text for inner content to avoid initial interpolation errors
        const tplFor = '<kire:for items="[1,2]" as="i">#</kire:for>';
        const resFor = await kire.render(tplFor);
        expect(resFor).toBe("##");
    });

    test("@stack and @push", async () => {
        const template = `
            @stack("scripts")
            @push("scripts")<script>1</script>@endpush
            @push("scripts")<script>2</script>@endpush
        `.trim();
        const result = await kire.render(template);
        expect(result.trim()).toContain("<script>1</script>");
        expect(result.trim()).toContain("<script>2</script>");
    });

    test("@define and @defined", async () => {
        const template = '@define("header")<h1>Title</h1>@enddefine @defined("header")Fallback@enddefined';
        const result = await kire.render(template);
        expect(result.trim()).toBe("<h1>Title</h1>");
    });

    test("order-independent @define and @defined", async () => {
        const template = '@defined("header")Fallback@enddefined @define("header")<h1>Title</h1>@enddefine';
        const result = await kire.render(template);
        expect(result.trim()).toBe("<h1>Title</h1>");
    });

    test("@defined without @end should not capture following template", async () => {
        const template = '@define("content")OK@enddefine [A] @defined("content") [B]';
        const result = await kire.render(template);
        expect(result.trim()).toBe("[A] OK [B]");
    });

    test("@defined with @end should support fallback block", async () => {
        const template = '@defined("missing")Fallback@enddefined';
        const result = await kire.render(template);
        expect(result.trim()).toBe("Fallback");
    });

    test("@unless directive", async () => {
        const template = "@unless(check)Show@endunless";
        expect(await kire.render(template, { check: false })).toBe("Show");
        expect(await kire.render(template, { check: true })).toBe("");
    });

    test("@error directive", async () => {
        const template = "@error('email'){{ $message }}@enderror";
        const result = await kire.render(template, { errors: { email: "Invalid email" } });
        expect(result).toBe("Invalid email");
    });

    test("@let and @const directives", async () => {
        const template = "@let(x = 10)@const(y = 20){{ x + y }}";
        const result = await kire.render(template);
        expect(result).toBe("30");
    });

    test("@switch with non-string values", async () => {
        const template = "@switch(val)@case(true)TRUE@endcase@case(false)FALSE@endswitch";
        expect(await kire.render(template, { val: true })).toBe("TRUE");
        expect(await kire.render(template, { val: false })).toBe("FALSE");
    });

    test("@include should merge locals only inside dependency scope", async () => {
        const k = new Kire({ production: true });
        k.$files[k.resolvePath("partials.item")] = "{{ name }}";
        const template = "@include('partials.item', { name: 'Inner' })|{{ typeof name }}";
        const result = await k.render(template, { name: "Outer" });
        expect(result).toBe("Inner|string");
    });

    test("@for should iterate object keys", async () => {
        const template = "@for(key in data){{ key }};@endfor";
        const result = await kire.render(template, { data: { a: 1, b: 2 } });
        expect(result).toBe("a;b;");
    });

    test("@for should support @empty fallback", async () => {
        const template = "@for(item of items){{ item }};@emptyNO_ITEMS@endfor";
        expect(await kire.render(template, { items: [1, 2] })).toBe("1;2;");
        expect(await kire.render(template, { items: [] })).toBe("NO_ITEMS");
    });

    test("@for should expose index and $loop when used", async () => {
        const template = "@for((item, i) of items){{ i }}:{{ $loop.first ? 'F' : 'N' }}-{{ item }};@endfor";
        const result = await kire.render(template, { items: [10, 20] });
        expect(result).toBe("0:F-10;1:N-20;");
    });

    test("@csrf should render token and throw when token is missing", async () => {
        const withToken = new Kire({ production: true });
        withToken.$global("csrf", "secure-token");
        expect(await withToken.render("@csrf")).toBe('<input type="hidden" name="_token" value="secure-token">');

        const noToken = new Kire({ production: true });
        try {
            await noToken.render("@csrf");
            expect.unreachable("should throw when csrf token is missing");
        } catch (e: any) {
            expect(e.message).toContain("CSRF token not defined");
        }
    });

    test("@component should pass named and default slots to @yield", async () => {
        const k = new Kire({ production: true });
        k.$files[k.resolvePath("layout.card")] = "<article>@yield('header', 'No header')|@yield('default')</article>";
        const template = "@component('layout.card')@slot('header')Head@endslot@slot('default')Body@endslot@endcomponent";
        const result = await k.render(template);
        expect(result).toBe("<article>Head|Body</article>");
    });

    test("@method should render escaped runtime value", async () => {
        const result = await kire.render("@method('PUT')");
        expect(result).toBe('<input type="hidden" name="_method" value="PUT">');

        const escaped = await kire.render("@method(method)", { method: 'P\"UT' });
        expect(escaped).toBe('<input type="hidden" name="_method" value="P&quot;UT">');
    });

    test("slot/define/stack names should support apostrophes safely", async () => {
        const k = new Kire({ production: true });
        k.$files[k.resolvePath("layout.quote")] = "<article>@yield(\"he'ad\", 'none')</article>";

        const slotResult = await k.render("@component('layout.quote')@slot(\"he'ad\")Body@endslot@endcomponent");
        expect(slotResult).toBe("<article>Body</article>");

        const defineResult = await k.render("@define(\"he'ad\")OK@enddefine @defined(\"he'ad\")NO@enddefined");
        expect(defineResult.trim()).toBe("OK");

        const stackResult = await k.render("@stack(\"he'ad\")@push(\"he'ad\")<script>1</script>@endpush");
        expect(stackResult).toContain("<script>1</script>");
    });

    test("unknown directives should not be parsed by prefix", async () => {
        const result = await kire.render("@ifx(true)A@endifx");
        expect(result).toBe("@ifx(true)A@endifx");
    });

    test("strict_directives should throw on unknown directives", async () => {
        const strict = new Kire({ production: true, strict_directives: true, silent: true });
        try {
            await strict.render("@unknownDirective(1)", {}, {}, "strict_test.kire");
            expect.unreachable("should throw on unknown directives in strict mode");
        } catch (e: any) {
            expect(e.message).toContain('Unknown directive "@unknownDirective"');
            expect(e.message).toContain("strict_test.kire");
        }
    });

    test("directive arguments should handle closing parenthesis inside strings", async () => {
        const result = await kire.render('@if(")")OK@endif');
        expect(result).toBe("OK");
    });

    test("escaped interpolation", async () => {
        const template = "@{{ escaped }} @{{{ raw_escaped }}}";
        expect(await kire.render(template)).toBe("{{ escaped }} {{{ raw_escaped }}}");
    });
});
