//import { Kire } from "../core/dist/index.js";
import { Kire } from "../core/src";
import { Edge } from "edge.js";
import { consumeStream } from "../core/src/utils/stream.ts";
import { NullProtoObj } from "../core/src/utils/regex.ts";

async function runBenchmark() {
    const tpl = `
        <div class="container">
            <h1>Users List</h1>
            <ul>
                @each(user in users)
                    <li class="{{ user.active ? 'active' : '' }}">
                        {{ user.name }} ({{ user.email }})
                        @if(user.isAdmin)
                            <x-user name="user.name" email="user.email" active="user.active" isAdmin="user.isAdmin" />
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
                            <x-user name="user.name" email="user.email" active="user.active" isAdmin="user.isAdmin" />
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

    const data: any = new NullProtoObj();
    data.users = users;

    const kire = new Kire({
        production: true,
        root: process.cwd().replace(/\\/g, '/')
    });
    
    kire.namespace("components", kire.$root + "/components");
    kire.$global("users", users);
    
    console.log(`Diagnostic: Users in globals: ${!!kire.$globals.users}, Count: ${kire.$globals.users?.length}`);

    // Register files with normalized paths - using $sources for caching
    kire.$sources[kire.resolve("bench.kire")] = tpl;
    kire.$sources[kire.resolve("bench-elements.kire")] = tplElements;
    kire.$sources[kire.resolve("bench-components.kire")] = tplComponents;
    kire.$sources[kire.resolve("components/user.kire")] = userComponent;
    
    // Compile bundled template using the instance that has elements/directives loaded
    const bundledTpl = await kire.compileFn(tpl, "bundled.kire", Object.keys(data));

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
    console.timeEnd("💎 Kire (Elements)");

    // Kire Components
    console.time("🧩 Kire (Components)");
    for (let i = 0; i < iterations; i++) {
        await consumeStream(await kire.view("bench-components.kire", data));
    }
    console.timeEnd("🧩 Kire (Components)");

    // Kire Bundled
    console.time("🔥 Kire (Bundled)");
    for (let i = 0; i < iterations; i++) {
        await consumeStream(await kire.run(bundledTpl as any, data));
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
