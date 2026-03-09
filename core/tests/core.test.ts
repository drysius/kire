import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Core (Bun)", () => {
    const kire = new Kire({ production: true });

    test("should render simple text", async () => {
        const result = await kire.render("Hello World");
        expect(result).toBe("Hello World");
    });

    test("should render variables", async () => {
        const result = await kire.render("Hello {{ name }}", { name: "Kire" });
        expect(result).toBe("Hello Kire");
    });

    test("should handle @if directive", async () => {
        const template = `
            @if(show)
                Visible
            @else
                Hidden
            @endif
        `.trim();
        
        const res1 = await kire.render(template, { show: true });
        expect(res1.trim()).toBe("Visible");
        
        const res2 = await kire.render(template, { show: false });
        expect(res2.trim()).toBe("Hidden");
    });

    test("should handle @for loop", async () => {
        const template = `@for(item of items){{ item }}@endfor`;
        const result = await kire.render(template, { items: [1, 2, 3] });
        expect(result).toBe("123");
    });

    test("should handle custom elements (compiler-based)", async () => {
        const k = new Kire();
        k.element({
            name: "my-tag",
            onCall: (api) => {
                api.raw('$kire_response += "<span>";');
                if (api.children) api.set(api.children);
                api.raw('$kire_response += "</span>";');
            }
        });

        const result = await k.render("<my-tag>Hello</my-tag>");
        expect(result).toBe("<span>Hello</span>");
    });

    test("should handle nested custom elements (compiler-based)", async () => {
        const k = new Kire();
        k.element({
            name: "outer",
            onCall: (api) => {
                api.raw('$kire_response += "<div>";');
                if (api.children) api.set(api.children);
                api.raw('$kire_response += "</div>";');
            }
        });
        k.element({
            name: "inner",
            onCall: (api) => {
                api.raw('$kire_response += "<span>";');
                if (api.children) api.set(api.children);
                api.raw('$kire_response += "</span>";');
            }
        });

        const result = await k.render("<outer><inner>Text</inner></outer>");
        expect(result).toBe("<div><span>Text</span></div>");
    });

    test("should allow declaration-only elements for schema/intellisense", async () => {
        const k = new Kire();
        k.element({
            name: "z-card",
            description: "Schema-only element declaration",
            attributes: [{ name: "title", type: "string" }],
        });

        const declared = k.$schema.elements.find((entry) => entry.name === "z-card");
        expect(declared?.name).toBe("z-card");
        expect(declared?.attributes?.[0]?.name).toBe("title");

        // No runtime transformer => render should keep original markup.
        const output = await k.render("<z-card title=\"Example\">Body</z-card>");
        expect(output).toContain("<z-card");
        expect(output).toContain("Body");
    });

    test("should handle prototype-based globals shadowing", async () => {
        const k = new Kire();
        k.$global("theme", "dark");
        
        const result1 = await k.render("Theme: {{ theme }}");
        expect(result1).toBe("Theme: dark");

        // Shadowing in a fork or via locals
        const result2 = await k.render("Theme: {{ theme }}", { theme: "light" });
        expect(result2).toBe("Theme: light");
    });
});
