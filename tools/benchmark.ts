import { Kire } from "../core/src/kire";
import { Edge } from "edge.js";

async function runBenchmark() {
    const kire = new Kire({ production: true });
    const edge = new Edge();

    const users = Array.from({ length: 500 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0,
        isAdmin: i % 10 === 0
    }));

    const data = { users };

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

    const iterations = 5000;

    console.log(`\n--- BENCHMARK: KIRE vs EDGE.JS ---`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Items per loop: ${data.users.length}\n`);

    // Warmup
    await kire.render(tpl, data);
    await edge.renderRaw(tpl, data);

    // Kire
    console.time("🚀 Kire");
    for (let i = 0; i < iterations; i++) {
        await kire.render(tpl, data);
    }
    console.timeEnd("🚀 Kire");

    // Edge
    console.time("📦 Edge.js");
    for (let i = 0; i < iterations; i++) {
        await edge.renderRaw(tpl, data);
    }
    console.timeEnd("📦 Edge.js");

    console.log("\n----------------------------------\n");
}

runBenchmark().catch(console.error);
