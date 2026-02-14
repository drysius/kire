import { Kire } from "../core/src/kire";
import { Edge } from "edge.js";

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

    const edge = new Edge();

    const users = Array.from({ length: 500 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0,
        isAdmin: i % 10 === 0
    }));

    const data = { users };

    const bkire = new Kire();
    const kire = new Kire({
        production: true,
        files: {
            "bench.kire": tpl
        },
        bundled: {
            "bundled.kire": await bkire.compileFn(tpl, "bundled.kire", Object.keys(data))
        }
    });
    const iterations = 5000;

    console.log(`\n--- BENCHMARK: KIRE vs EDGE.JS ---`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Items per loop: ${data.users.length}\n`);

    // Warmup
    await kire.render(tpl, data);
    await kire.view("bench.kire", data);
    await edge.renderRaw(tpl, data);

    // Kire Standard
    console.time("🚀 Kire (Standard)");
    for (let i = 0; i < iterations; i++) {
        await kire.render(tpl, data);
    }
    console.timeEnd("🚀 Kire (Standard)");

    // Virtual File
    console.time("⚡ Kire (Virtual File)");
    for (let i = 0; i < iterations; i++) {
        await kire.view("bench.kire", data);
    }
    console.timeEnd("⚡ Kire (Virtual File)");

    // Kire Bundled
    console.time("⚡ Kire (Bundled)");
    for (let i = 0; i < iterations; i++) {
        await kire.view("bundled.kire", data);
    }
    console.timeEnd("⚡ Kire (Bundled)");

    // Edge
    console.time("📦 Edge.js");
    for (let i = 0; i < iterations; i++) {
        await edge.renderRaw(tpl, data);
    }
    console.timeEnd("📦 Edge.js");

    console.log("\n----------------------------------\n");
}

runBenchmark().catch(console.error);
