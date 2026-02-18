import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";
import { KireError } from "../src/utils/error";

describe("Kire Advanced Features", () => {
    
    test("Namespaces: should resolve templates across multiple namespaces", async () => {
        const k = new Kire();
        k.namespace("theme", "views/theme");
        k.namespace("shared", "views/shared");
        
        // Mock virtual files
        k["~store"].files[k.resolvePath("views/theme/layout.kire")] = "Theme Layout: @yield('content')";
        k["~store"].files[k.resolvePath("views/shared/button.kire")] = "<button>{{ text }}</button>";
        
        const template = `
            @layout('theme.layout')
                @slot('content')
                    @include('shared.button', { text: 'Click me' })
                @endslot
            @endlayout
        `.trim();
        
        const result = await k.render(template);
        expect(result).toContain("Theme Layout:");
        expect(result).toContain("<button>Click me</button>");
    });

    test("Forks: should inherit state but maintain isolation", async () => {
        const parent = new Kire();
        parent.$global("appName", "KireApp");
        parent.$global("version", "1.0.0");
        
        const child = parent.fork();
        child.$global("appName", "ForkedApp"); // Shadowing
        
        const tpl = "{{ appName }} v{{ version }}";
        
        expect(await parent.render(tpl)).toBe("KireApp v1.0.0");
        expect(await child.render(tpl)).toBe("ForkedApp v1.0.0");
        
        // Global in child should not affect parent
        expect(parent.$globals["appName"]).toBe("KireApp");
    });

    test("onFork: should execute handlers when a fork is created", () => {
        const k = new Kire();
        let forkHandled = false;
        
        k.onFork((fork) => {
            forkHandled = true;
            fork.$global("forked", true);
        });
        
        const f = k.fork();
        expect(forkHandled).toBe(true);
        expect(f.$globals["forked"]).toBe(true);
        expect(k.$globals["forked"]).toBeUndefined();
    });

    test("Circular Dependencies: should detect and throw error", async () => {
        const k = new Kire();
        k["~store"].files[k.resolvePath("a.kire")] = "@include('b')";
        k["~store"].files[k.resolvePath("b.kire")] = "@include('a')";
        
        try {
            await k.view("a");
            expect.unreachable("Should have thrown a circular dependency error");
        } catch (e: any) {
            expect(e.message).toContain("Circular dependency detected");
            expect(e.message).toContain("a.kire");
        }
    });

    test("Introspection: $kire variable usage", async () => {
        const k = new Kire();
        const tpl = "Path: {{ $kire.meta.path }}";
        
        const result = await k.render(tpl, {}, {}, "custom_name.kire");
        expect(result).toBe("Path: custom_name.kire");
    });

    test("Error Handling: should map error to source template", async () => {
        const k = new Kire({ production: false, silent: true });
        const tpl = `
            Line 1
            Line 2
            {{ it.fail.invalid() }}
            Line 4
        `.trim();
        
        try {
            await k.render(tpl, { fail: null }, {}, "error_test.kire");
            expect.unreachable("Should have thrown an error");
        } catch (e: any) {
            expect(e).toBeInstanceOf(KireError);
            // The stack trace should contain the template path and the correct line
            // In the generated code, the interpolation is at Line 3
            expect(e.stack).toContain("error_test.kire:3");
        }
    });

    test("VFiles: should resolve templates from memory", async () => {
        const k = new Kire();
        k["~store"].files[k.resolvePath("partials/header")] = "<h1>Header</h1>";
        
        const result = await k.render("@include('partials.header')");
        expect(result).toBe("<h1>Header</h1>");
    });
});
