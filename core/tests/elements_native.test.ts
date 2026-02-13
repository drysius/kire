import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";
import { KireNode } from "../../packages/node/src";

describe("Native Elements & Enhanced Attributes", () => {
    test("kire:if should conditionally render content", async () => {
        const kire = new Kire();
        
        const template = `
            <kire:if cond={true}>visible</kire:if>
            <kire:if cond={false}>hidden</kire:if>
        `;
        
        const output = await kire.render(template);
        expect(output).toContain("visible");
        expect(output).not.toContain("hidden");
        expect(output).not.toContain("<kire:if");
    });

    test("attribute expressions with ={expr} should be evaluated", async () => {
        const kire = new Kire();
        kire.element({
            name: "test-el",
            run: (ctx) => {
                ctx.replace(`value is ${ctx.element.attributes.val}`);
            }
        });

        const template = `<test-el val={1 + 1} />`;
        const output = await kire.render(template);
        expect(output).toBe("value is 2");
    });

    test("spread attributes {...obj} should be merged", async () => {
        const kire = new Kire();
        kire.element({
            name: "test-spread",
            run: (ctx) => {
                ctx.replace(`id:${ctx.element.attributes.id}, class:${ctx.element.attributes.class}`);
            }
        });

        const props = { id: "my-id", class: "my-class" };
        const template = `<test-spread {...it.props} />`;
        const output = await kire.render(template, { props });
        expect(output).toBe("id:my-id, class:my-class");
    });

    test("x-components should load from components namespace", async () => {
        const kire = new Kire();
        kire.plugin(KireNode);
        
        // Mock a component view
        kire.$resolver = async (path) => {
            if (path.includes("button")) {
                return `<button class="{{ it.class || '' }}">@yield('default')</button>`;
            }
            return "";
        };
        kire.namespace("components", "/mock/components");

        const template = `
            <x-button class="btn-primary">
                Click Me
            </x-button>
        `;

        const output = await kire.render(template);
        expect(output).toContain('<button class="btn-primary">');
        expect(output).toContain("Click Me");
    });

    test("named slots should be correctly extracted and passed to components", async () => {
        const kire = new Kire();
        kire.plugin(KireNode);
        
        kire.$resolver = async (path) => {
            if (path.includes("card")) {
                return `
                    <div class="card">
                        <div class="header">@yield('header')</div>
                        <div class="body">@yield('default')</div>
                    </div>
                `;
            }
            return "";
        };
        kire.namespace("components", "/mock/components");

        const template = `
            <x-card>
                <x-slot:header>My Header</x-slot:header>
                My Body
            </x-card>
        `;

        const output = await kire.render(template);
        expect(output).toContain('<div class="header">My Header</div>');
        expect(output).toContain('<div class="body">My Body</div>');
    });

    test("$att helper should merge classes and styles correctly", async () => {
        const kire = new Kire();
        kire.element({
            name: "my-btn",
            run: (ctx) => {
                // Merge static classes with passed classes
                const finalAtts = ctx.$att.merge({ class: "btn-base", style: "color: red" });
                ctx.replace(`<button ${finalAtts}>content</button>`);
            }
        });

        const template = `<my-btn class="btn-primary" style="margin: 10px" id="b1" />`;
        const output = await kire.render(template);
        
        // Check merged class (order depends on implementation, but both should be there)
        expect(output).toContain('class="btn-primary btn-base"');
        // Check merged style
        expect(output).toContain('style="margin: 10px;color: red"');
        // Check other attributes preserved
        expect(output).toContain('id="b1"');
    });
});
