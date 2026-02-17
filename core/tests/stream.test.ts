import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Streaming (Delta-based)", () => {
    test("should stream chunks incrementally with await", async () => {
        const kire = new Kire({ stream: true, production: true });
        
        const template = `
            Part 1
            <?js await new Promise(resolve => setTimeout(resolve, 50)); ?>
            Part 2
            <?js await new Promise(resolve => setTimeout(resolve, 50)); ?>
            Part 3
        `.trim();

        const stream = kire.render(template) as ReadableStream;
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        
        const chunks: string[] = [];
        let done = false;

        while (!done) {
            const { value, done: streamDone } = await reader.read();
            if (value) {
                chunks.push(decoder.decode(value));
            }
            done = streamDone;
        }

        // We expect at least 3 chunks if streaming is working
        // One for Part 1, one for Part 2 (after 50ms), one for Part 3 (after another 50ms)
        // Note: some whitespace or newlines might be separate chunks depending on how compiler splits them.
        expect(chunks.length).toBeGreaterThanOrEqual(3);
        
        const fullContent = chunks.join("");
        expect(fullContent).toContain("Part 1");
        expect(fullContent).toContain("Part 2");
        expect(fullContent).toContain("Part 3");
    });

    test("should handle $kire_response resets or modifications safely", async () => {
        const kire = new Kire({ stream: true, production: true });
        
        // This template uses a slot-like pattern where $kire_response is temporarily cleared
        // The delta-based streamer should handle this (reset lastSent)
        const template = `
            Header
            <?js 
                const _old = $kire_response; 
                $kire_response = "Content"; 
                // Now $kire_response is shorter than 'Header
' (which was lastSent)
            ?>
            Footer
        `.trim();

        const stream = kire.render(template) as ReadableStream;
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        
        let fullContent = "";
        let done = false;
        while (!done) {
            const { value, done: streamDone } = await reader.read();
            if (value) fullContent += decoder.decode(value);
            done = streamDone;
        }

        // It should still contain everything because we force a reset if length decreases
        expect(fullContent).toContain("Header");
        expect(fullContent).toContain("Content");
        expect(fullContent).toContain("Footer");
    });

    test("should inject $kire_stream calls in compiled code", () => {
        const kire = new Kire({ stream: true });
        const compiled = kire.compile("Hello {{ name }}");
        const code = compiled.meta.code;
        
        expect(code).toContain("const $kire_stream = $globals['~$kire-stream']");
        expect(code).toContain("$kire_stream($kire_response)");
    });
});
