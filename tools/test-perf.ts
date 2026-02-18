import { Kire } from "../core/src/kire";

async function testPerf() {
    const kire = new Kire({ production: true });
    
    // Test 1: Simple Loop with @each (Directives)
    const tplDirectives = `@each(i in items){{ i }}@endeach`;
    const items = Array.from({ length: 1000 }, (_, i) => i);
    
    console.log("Warmup...");
    const r1 = await kire.render(tplDirectives, { items });
    console.log(`Directives Warmup length: ${r1.length}`);

    console.time("Directives Loop (1000 items)");
    for(let i=0; i<100; i++) {
        await kire.render(tplDirectives, { items });
    }
    console.timeEnd("Directives Loop (1000 items)");

    // Test 2: Simple Loop with <kire:for> (Elements)
    const tplElements = `<kire:for loop="{{ items }}" as="i">@{{ i }}</kire:for>`;
    const r2 = await kire.render(tplElements, { items });
    console.log(`Elements Warmup length: ${r2.length}`);

    console.time("Elements Loop (1000 items)");
    for(let i=0; i<100; i++) {
        await kire.render(tplElements, { items });
    }
    console.timeEnd("Elements Loop (1000 items)");

    // Test 3: Components in loop
    kire.namespace("components", ".");
    const resolvedPath = kire.resolvePath("components.item");
    console.log(`[Test Debug] Resolved Path for item: ${resolvedPath}`);
    kire.$virtualFiles[resolvedPath] = `{{ i }}`;
    const tplComponents = `@each(i in items)<x-item i="{{ i }}" />@endeach`;
    const r3 = await kire.render(tplComponents, { items });
    console.log(`Components Warmup length: ${r3.length}`);
    await kire.render(tplComponents, { items });

    console.time("Components Loop (1000 items)");
    for(let i=0; i<100; i++) {
        await kire.render(tplComponents, { items });
    }
    console.timeEnd("Components Loop (1000 items)");

    // Test 4: Dynamic attributes
    const tplDynamic = `<div class="item-{{ i }}" data-id="{{ i }}"></div>`;
    await kire.render(tplDynamic, { i: 1 });
    console.time("Dynamic Attributes (10000 iterations)");
    for(let i=0; i<10000; i++) {
        await kire.render(tplDynamic, { i });
    }
    console.timeEnd("Dynamic Attributes (10000 iterations)");
}

testPerf().catch(console.error);
