import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Elements System (Pattern-based)", () => {
    test("should handle element with wildcard pattern (test:*)", async () => {
        const k = new Kire();
        
        k.element({
            name: 'test:*',
            onCall: (ctx) => {
                ctx.raw(`$ctx.$add("[${ctx.wildcard}:");`);
                if (ctx.children) ctx.set(ctx.children);
                ctx.raw(`$ctx.$add("]");`);
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
            attributes: ['title:string'],
            onCall: (ctx) => {
                const title = ctx.attribute('title');
                ctx.res(`Title: ${title}`);
            }
        });

        const result = await k.render('<my:tag title="Hello World" />');
        expect(result).toBe("Title: Hello World");
    });
});
