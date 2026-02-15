//import { Kire } from "../core/src/kire";
import { Kire } from "../core/dist/index.js";
import { Edge } from "edge.js";
import { Eta } from "eta";
import ejs from "ejs";

async function runBenchmark() {
    const users = Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0,
        isAdmin: i % 10 === 0
    }));

    const data = { users };

    // --- KIRE SETUP ---
    const kire = new Kire({ production: true });
    const kireTpl = `
<div class="container">
    <h1>Users List</h1>
    <ul>
        @for(user of users)
            <li class="{{ user.active ? 'active' : '' }}">
                {{ user.name }} ({{ user.email }})
                @if(user.isAdmin)
                    <span class="badge">Admin</span>
                @endif
            </li>
        @endfor
    </ul>
</div>`.trim();
    
    const kireCompiled = await kire.compile(kireTpl, "bench.kire");

    // --- EDGE SETUP ---
    const edge = new Edge({ cache: true });
    const edgeTpl = `
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
</div>`.trim();

    // --- ETA SETUP ---
    const eta = new Eta({ cache: true });
    const etaTpl = `
<div class="container">
    <h1>Users List</h1>
    <ul>
        <% it.users.forEach(function(user){ %>
            <li class="<%= user.active ? 'active' : '' %>">
                <%= user.name %> (<%= user.email %>)
                <% if(user.isAdmin) { %>
                    <span class="badge">Admin</span>
                <% } %>
            </li>
        <% }) %>
    </ul>
</div>`.trim();

    // --- EJS SETUP ---
    const ejsTpl = `
<div class="container">
    <h1>Users List</h1>
    <ul>
        <% users.forEach(function(user){ %>
            <li class="<%= user.active ? 'active' : '' %>">
                <%= user.name %> (<%= user.email %>)
                <% if(user.isAdmin) { %>
                    <span class="badge">Admin</span>
                <% } %>
            </li>
        <% }) %>
    </ul>
</div>`.trim();
    const ejsOpts = { cache: true, filename: 'bench.ejs' };
    // Pre-compile EJS
    const ejsCompiled = ejs.compile(ejsTpl, ejsOpts);

    const iterations = 5000;

    console.log(`\n--- BENCHMARK: KIRE vs OTHERS ---`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Users per loop: ${users.length}\n`);

    // Warmup
    console.log("Warming up...");
    await kire.run(kireCompiled, data);
    await edge.renderRaw(edgeTpl, data);
    await eta.renderString(etaTpl, data);
    await ejsCompiled(data);

    // Kire (Pre-compiled)
    console.time("🚀 Kire (Pre-compiled)");
    for (let i = 0; i < iterations; i++) {
        await kire.run(kireCompiled, data);
    }
    console.timeEnd("🚀 Kire (Pre-compiled)");

    // Eta
    console.time("⚡ Eta");
    for (let i = 0; i < iterations; i++) {
        eta.renderString(etaTpl, data);
    }
    console.timeEnd("⚡ Eta");

    // EJS
    console.time("📦 EJS (Pre-compiled)");
    for (let i = 0; i < iterations; i++) {
        ejsCompiled(data);
    }
    console.timeEnd("📦 EJS (Pre-compiled)");

    // Edge
    console.time("🌊 Edge.js");
    for (let i = 0; i < iterations; i++) {
        await edge.renderRaw(edgeTpl, data);
    }
    console.timeEnd("🌊 Edge.js");

    console.log("\n----------------------------------\n");
}

runBenchmark().catch(console.error);
