import { Kire } from "kire";
import { wirePlugin } from "@kirejs/wire";
import { Counter } from "./components/counter";
import { join } from "node:path";

/**
 * Robust Server for Wire v2 Example using wireRequest and sessions.
 */

// 1. Initialize Kire with Wire Plugin
const kire = new Kire({
    root: join(import.meta.dir, "views"),
    production: false,
    async: true
});

kire.plugin(wirePlugin, {
    secret: "minha-chave-secreta-super-segura",
    route: "/_wire"
});

// 2. Register Components
kire.wireRegister("counter", Counter);

console.log("\n-----------------------------------------");
console.log("🚀 Kire Wire v2 (Robust API) running at:");
console.log("👉 http://localhost:3000");
console.log("-----------------------------------------\n");

// 3. Start Bun Server
Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        // Serve Client Runtime
        if (url.pathname === "/wire.js") {
            const clientPath = join(import.meta.dir, "../../packages/wire/dist/client/wire.js");
            return new Response(Bun.file(clientPath));
        }

        // --- MIDDLEWARE SIMULATION ---
        // For each request, we fork Kire and set a unique session key
        // In a real app, use req.headers['session-id'] or cookies
        const sessionID = "user-session-123"; 
        const fork = kire.fork().wireKey(sessionID);

        // Handle Wire Requests (Unified Handler)
        if (url.pathname.startsWith(kire.$wire.route)) {
            const body = req.method === "POST" ? await req.json() : {};
            const response = await fork.wireRequest({
                url: req.url,
                body: body,
                query: Object.fromEntries(url.searchParams)
            });

            return new Response(JSON.stringify(response.result), {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Render Home Page
        if (url.pathname === "/") {
            const html = await fork.view("page");
            return new Response(html, {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            });
        }

        return new Response("Not Found", { status: 404 });
    }
});
