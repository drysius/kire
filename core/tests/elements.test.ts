import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";
import { consumeStream } from "../src/utils/stream";

describe("Kire Elements System", () => {
    test("should handle element with parent separator (:)", async () => {
        const k = new Kire();
        let capturedParent: string | undefined = undefined;
        
        k.element({
            name: 'kire',
            parent: ':',
            run: (ctx) => {
                capturedParent = ctx.element.parent;
                ctx.replace(`[${ctx.element.parent}:${ctx.element.inner}]`);
            }
        });

        const result = await k.render("<kire:if>condition</kire:if>");
        expect(capturedParent).toBe("if");
        expect(result).toBe("[if:condition]");
    });

    test("should handle element with parent separator (-)", async () => {
        const k = new Kire();
        let capturedParent: string | undefined = undefined;
        
        k.element({
            name: 'x',
            parent: '-',
            run: (ctx) => {
                capturedParent = ctx.element.parent;
                ctx.replace(`[${ctx.element.parent}]`);
            }
        });

        const result = await k.render("<x-button></x-button>");
        expect(capturedParent).toBe("button");
        expect(result).toBe("[button]");
    });

    test("should handle nested elements with parents", async () => {
        const k = new Kire();
        k.element({
            name: 'kire',
            parent: ':',
            run: (ctx) => {
                ctx.replace(`<div class="${ctx.element.parent}">${ctx.element.inner}</div>`);
            }
        });

        const result = await k.render("<kire:outer><kire:inner>Content</kire:inner></kire:outer>");
        expect(result).toBe('<div class="outer"><div class="inner">Content</div></div>');
    });

    test("should handle native kire:if element", async () => {
        const k = new Kire();
        // Native elements are registered by default unless directives: false
        const result = await k.render('<kire:if cond="true">Yes</kire:if>');
        expect(result.trim()).toBe("Yes");

        const result2 = await k.render('<kire:if cond="false">Yes</kire:if>');
        expect(result2.trim()).toBe("");
    });
});
