import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";
import { consumeStream } from "../src/utils/stream";

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
        
        const res1 = await consumeStream(await kire.render(template, { show: true }));
        expect(res1.trim()).toBe("Visible");
        
        const res2 = await consumeStream(await kire.render(template, { show: false }));
        expect(res2.trim()).toBe("Hidden");
    });

    test("should handle @for loop", async () => {
        const template = `@for(item of items){{ item }}@endfor`;
        const result = await kire.render(template, { items: [1, 2, 3] });
        expect(result).toBe("123");
    });

    test("should handle custom elements (processElements)", async () => {
        const k = new Kire();
        k.element("my-tag", (ctx) => {
            ctx.replace(`<span>${ctx.element.inner}</span>`);
        });

        const result = await k.render("<my-tag>Hello</my-tag>");
        expect(result).toBe("<span>Hello</span>");
    });

    test("should handle nested custom elements", async () => {
        const k = new Kire();
        k.element("outer", (ctx) => {
            ctx.replace(`<div>${ctx.element.inner}</div>`);
        });
        k.element("inner", (ctx) => {
            ctx.replace(`<span>${ctx.element.inner}</span>`);
        });

        const result = await k.render("<outer><inner>Text</inner></outer>");
        expect(result).toBe("<div><span>Text</span></div>");
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

    test("should handle streaming", async () => {
        const k = new Kire({ stream: true });
        const stream = await k.render("Stream {{ name }}", { name: "Active" });
        expect(stream).toBeInstanceOf(ReadableStream);
        
        const result = await consumeStream(stream);
        expect(result).toBe("Stream Active");
    });

    test("should trigger lifecycle hooks", async () => {
        const k = new Kire();
        let beforeTriggered = false;
        k.on("before", () => {
            beforeTriggered = true;
        });

        await k.render("test");
        expect(beforeTriggered).toBe(true);
    });
});
