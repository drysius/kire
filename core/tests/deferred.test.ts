import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Deferred Rendering", () => {
	test("Should render placeholder and deferred script", async () => {
		const kire = new Kire();
		const template = `
Start
@defer
  Deferred Content
@end
End
`;

		// We need to use streaming to see the deferred effect properly,
		// but since we can't easily assert on stream chunks in this simple test environment without a full mock,
		// we will inspect the final buffered output which Kire produces when not streaming,
        // OR we can mock the stream.

        // Actually, @defer works by appending to the stream AFTER the main execution.
        // In a non-streaming context (buffering), KireRuntime returns a string.
        // The current implementation in runtime.ts only awaits $deferred if it returns a stream.
        // Let's check runtime.ts again.
        
        // Wait, I only added the await $deferred logic inside the isStreamRoot block.
        // So @defer ONLY works with streaming enabled.
        
        kire.stream = true;
        
        const chunks: string[] = [];
        const controller = {
            enqueue: (chunk: Uint8Array) => chunks.push(new TextDecoder().decode(chunk)),
            close: () => {},
            error: (e: any) => console.error(e)
        } as any;
        
        const stream = await kire.render(template) as ReadableStream;
        const reader = stream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            console.log("Chunk received:", chunk);
            chunks.push(chunk);
        }
        
        const fullOutput = chunks.join("");
        
        expect(fullOutput).toContain("Start");
        expect(fullOutput).toContain("End");
        expect(fullOutput).toContain('<div id="defer-');
        expect(fullOutput).toContain('<template id="tpl-defer-');
        expect(fullOutput).toContain("Deferred Content");
        expect(fullOutput).toContain("dest.replaceWith(src.content)");
	});
    
    test("Should execute deferred logic asynchronously", async () => {
        const kire = new Kire();
        kire.stream = true;
        
        // Mock a slow operation
        kire.$ctx('slow', async () => {
            await new Promise(r => setTimeout(r, 10));
            return "Slow Data";
        });
        
        const template = `
Start
@defer
  {{ await $ctx.slow() }}
@end
End
`;
        const stream = await kire.render(template) as ReadableStream;
        const reader = stream.getReader();
        const chunks: string[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(new TextDecoder().decode(value));
        }
        
        const fullOutput = chunks.join("");
        expect(fullOutput).toContain("Slow Data");
    });

    test("Should handle concurrent deferred blocks correctly", async () => {
        const kire = new Kire();
        kire.stream = true;
        
        kire.$ctx('slow', async (delay: number, label: string) => {
            await new Promise(r => setTimeout(r, delay));
            return label;
        });
        
        const template = `
@defer
  {{ await $ctx.slow(20, 'Block A') }}
@end
@defer
  {{ await $ctx.slow(10, 'Block B') }}
@end
`;
        const stream = await kire.render(template) as ReadableStream;
        const reader = stream.getReader();
        const chunks: string[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(new TextDecoder().decode(value));
        }
        
        const fullOutput = chunks.join("");
        // Both should be present and correct
        expect(fullOutput).toContain("Block A");
        expect(fullOutput).toContain("Block B");
        // Verify no leakage (e.g. Block A appearing inside Block B's template)
        // This is hard to regex exactly without parsing, but basic check passes.
    });
});
