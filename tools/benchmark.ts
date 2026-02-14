import { Kire } from "../core/src/kire";
import { Edge } from "edge.js";
import { consumeStream } from "../core/src/utils/stream";

async function runBenchmark() {
    const tpl = `
        <div class="container">
            <h1>Users List</h1>
            <ul>
                @each(user in users)
                    <li class="{{ user.active ? 'active' : '' }}">
                        {{ user.name }} ({{ user.email }})
                        @if(user.isAdmin)
                            <span class="badge">Admin</span>
                        @endif
                    </li>
                @endeach
            </ul>
        </div>
    `.trim();

    const tplElements = `
        <div class="container">
            <h1>Users List</h1>
            <ul>
                <kire:for loop="users" as="user">
                    <li class="@{{ user.active ? 'active' : '' }}">
                        @{{ user.name }} (@{{ user.email }})
                        <kire:if cond="user.isAdmin">
                            <span class="badge">Admin</span>
                        </kire:if>
                    </li>
                </kire:for>
            </ul>
        </div>
    `.trim();

    const tplComponents = `
        <div class="container">
            <h1>Users List</h1>
            <ul>
                @each(user in users)
                    <x-user name="{{ user.name }}" email="{{ user.email }}" active="{{ user.active }}" isAdmin="{{ user.isAdmin }}" />
                @endeach
            </ul>
        </div>
    `.trim();

    const userComponent = `
        <li class="{{ active ? 'active' : '' }}">
            {{ name }} ({{ email }})
            @if(isAdmin)
                <span class="badge">Admin</span>
            @endif
        </li>
    `.trim();

    const edge = new Edge({ cache:false });

    const users = Array.from({ length: 500 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0,
        isAdmin: i % 10 === 0
    }));

    const data = { users };

    const kire = new Kire({
        production: true,
        files: {
            "bench.kire": tpl,
            "bench-elements.kire": tplElements,
            "bench-components.kire": tplComponents,
            "components/user.kire": userComponent
        }
    });
    
    // Compile bundled template
    const bundledTpl = await kire.compileFn(tpl, "bundled.kire", Object.keys(data));
    
    kire.namespace("components", kire.$root + "/components");

    const iterations = 500;

    console.log(`\n--- BENCHMARK: KIRE vs EDGE.JS ---`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Items per loop: ${data.users.length}\n`);

    // Warmup & Verify
    const rStandard = await consumeStream(await kire.render(tpl, data));
    const rVirtual = await consumeStream(await kire.view("bench.kire", data));
    const rElements = await consumeStream(await kire.view("bench-elements.kire", data));
    const rComponents = await consumeStream(await kire.view("bench-components.kire", data));
    const rBundled = await consumeStream(await kire.run(bundledTpl as any, data));
    const rEdge = await edge.renderRaw(tpl, data);

    console.log(`\nVerification (Result Lengths):`);
    console.log(`- Standard:   ${rStandard.length}`);
    console.log(`- Virtual:    ${rVirtual.length}`);
    console.log(`- Elements:   ${rElements.length}`);
    console.log(`- Components: ${rComponents.length}`);
    console.log(`- Bundled:    ${rBundled.length}`);
    console.log(`- Edge:       ${rEdge.length}\n`);

    if (rElements.length < rStandard.length * 0.5) {
        console.warn("⚠️ WARNING: Elements output seems incomplete!");
        console.log("Elements sample:", rElements.substring(0, 500));
    }

    // Kire Standard
    console.time("🚀 Kire (Standard)");
    for (let i = 0; i < iterations; i++) {
        await consumeStream(await kire.render(tpl, data));
    }
    console.timeEnd("🚀 Kire (Standard)");

    // Virtual File
    console.time("⚡ Kire (Virtual File)");
    for (let i = 0; i < iterations; i++) {
        await consumeStream(await kire.view("bench.kire", data));
    }
    console.timeEnd("⚡ Kire (Virtual File)");

    // Kire Elements
    console.time("💎 Kire (Elements)");
    for (let i = 0; i < iterations; i++) {
        await consumeStream(await kire.view("bench-elements.kire", data));
    }
    // console.log(await consumeStream(await kire.view("bench-elements.kire", data)))
    console.timeEnd("💎 Kire (Elements)");

    // Kire Components
    console.time("🧩 Kire (Components)");
    for (let i = 0; i < iterations; i++) {
        //await consumeStream(await kire.view("bench-components.kire", data));
    }
    console.timeEnd("🧩 Kire (Components)");

    // Kire Bundled
    console.time("🔥 Kire (Bundled)");
    for (let i = 0; i < iterations; i++) {
        //await consumeStream(await kire.run(bundledTpl as any, data));
    }
    console.timeEnd("🔥 Kire (Bundled)");

    // Edge
    console.time("📦 Edge.js");
    for (let i = 0; i < iterations; i++) {
        await edge.renderRaw(tpl, data);
    }
    console.timeEnd("📦 Edge.js");

    console.log("\n----------------------------------\n");
}

runBenchmark().catch(console.error);
