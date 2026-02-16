import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Elements System (Pattern-based)", () => {
    test("should handle element with wildcard pattern (test:*)", async () => {
        const k = new Kire();
        
        k.element({
            name: 'test:*',
            onCall: (api) => {
                api.raw(`$kire_response += "[${api.wildcard}:";`);
                if (api.children) api.set(api.children);
                api.raw(`$kire_response += "]";`);
            }
        });

        const result = await k.render("<test:if>condition</test:if>");
        expect(result).toBe("[if:condition]");
    });

    test("should handle element with wildcard pattern (x-*)", async () => {
        const k = new Kire();
        
        k.element({
            name: 'x-*',
            onCall: (ctx) => {
                ctx.res(`[${ctx.wildcard}]`);
            }
        });

        const result = await k.render("<x-button></x-button>");
        expect(result).toBe("[button]");
    });

    test("should handle native kire:if element", async () => {
        const k = new Kire();
        const result = await k.render('<kire:if cond="true">Yes</kire:if>');
        expect(result.trim()).toBe("Yes");

        const result2 = await k.render('<kire:if cond="false">Yes</kire:if>');
        expect(result2.trim()).toBe("");
    });

    test("should handle native kire:if/elseif/else elements", async () => {
        const k = new Kire();
        const template = `
            <kire:if cond="false">
                If
            <kire:elseif cond="true">
                ElseIf
            <kire:else>
                Else
            </kire:if>
        `;
        const result = await k.render(template);
        expect(result.trim()).toBe("ElseIf");
    });

    test("should handle native kire:for element", async () => {
        const k = new Kire();
        const template = '<kire:for items="[1, 2, 3]" as="num">{{ num }}</kire:for>';
        const result = await k.render(template);
        expect(result.trim()).toBe("123");
    });

    test("should handle attributes via attribute() helper", async () => {
        const k = new Kire();
        k.element({
            name: 'my:tag',
            onCall: (ctx) => {
                const title = ctx.attribute('title');
                ctx.res(`Title: ${title}`);
            }
        });

        const result = await k.render('<my:tag title="Hello World" />');
        expect(result).toBe("Title: Hello World");
    });

    test("should handle x-* components with x-slot", async () => {
        const k = new Kire();
        const cardPath = k.resolve("card");
        k.$vfiles[cardPath] = "<div class='card'>@yield('header')<div class='body'>{{ slots.default }}</div>@yield('footer')</div>";

        const template = `
            <x-card>
                <x-slot name="header"><h1>Header</h1></x-slot>
                Main Content
                <x-slot name="footer"><p>Footer</p></x-slot>
            </x-card>
        `;

        const result = await k.render(template);
        expect(result).toContain("<div class='card'>");
        expect(result).toContain("<h1>Header</h1>");
        expect(result).toContain("Main Content");
        expect(result).toContain("<p>Footer</p>");
    });
});
