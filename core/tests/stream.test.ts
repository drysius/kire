
import { test, expect } from "bun:test";
import { Kire } from "../src/kire";

test("Kire Streaming - Should return a ReadableStream", async () => {
    const kire = new Kire({ stream: true });
    
    // Simple template
    kire.$resolver = async () => "Hello {{ it.name }}!";
    
    const stream = await kire.view("test", { name: "World" });
    
    expect(stream).toBeInstanceOf(ReadableStream);
    
    // Read the stream
    const reader = (stream as ReadableStream).getReader();
    let result = "";
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
    }
    
    expect(result).toBe("Hello World!");
});
test("Kire Streaming - Nested includes should stream to same controller", async () => {
    const kire = new Kire({ stream: true });
    
    kire.production = false;
    kire.$resolver = async (path) => {
        if (path.includes("parent")) return "Parent Start | @include('child') | Parent End";
        if (path.includes("child")) return "Child Content";
        return "";
    };
    
    const stream = await kire.view("parent");
    expect(stream).toBeInstanceOf(ReadableStream);
    
    const reader = (stream as ReadableStream).getReader();
    let result = "";
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
    }
    
    expect(result).toBe("Parent Start | Child Content | Parent End");
});

test("Kire Streaming - $merge should buffer correctly", async () => {
     const kire = new Kire({ stream: true });
     // Simulate a slot or captured block
     // @component is essentially a wrapper around $merge and includes
     kire.$resolver = async () => `
Start
@component('wrapper')
    Inside Slot
@end
End`;
    
    kire.cached("@kirejs/core").set("js:wrapper", (async ($ctx: any) => {
        // Mock wrapper component logic
        // This usually does $ctx.slots = ... via directives, but simplified here
        $ctx.$add("Wrapper Start - ");
        if ($ctx.slots && $ctx.slots.default) {
            $ctx.$add($ctx.slots.default);
        }
        $ctx.$add(" - Wrapper End");
    }) as any);

    // We need to register the component manually/mock it since we don't have file system here
    // But @component directive uses $require usually.
    // Let's rely on standard directive behavior.
    
    // Actually, simpler test for $merge logic specifically:
    // Ensure no leading spaces/newlines confuse the parser for this test
    kire.$resolver = async () => `Start
<?js
    await $ctx.$merge(async () => {
        $ctx.$add("Buffered");
        $ctx.captured = $ctx.$response;
    });
?>
Captured: {{ $ctx.captured }}
End`;

    const stream = await kire.view("test");
    const reader = (stream as ReadableStream).getReader();
    let result = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
    }
    
    // Note: "Buffered" is NOT emitted to stream directly because it was captured in $merge
    // Then it is printed via {{ $ctx.captured }}
    
    // Whitespace might be tricky with newlines in template
    expect(result.replace(/\s+/g, ' ').trim()).toBe("Start Captured: Buffered End");
});
