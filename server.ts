import { join } from "node:path";
import { Kire } from "kire";
import { KireNode } from "@kirejs/node";
import { Wired } from "@kirejs/wire";

// Use the existing wire-example for views and components
const exampleDir = join(process.cwd(), "examples", "wire-example");
const viewsDir = join(exampleDir, "views");
// Using absolute path for components to ensure they are found
const componentsPattern = join(exampleDir, "components", "*.ts");

console.log(`Loading views from: ${viewsDir}`);
console.log(`Loading components from: ${componentsPattern}`);

// Initialize Kire
const kire = new Kire({
	production: process.env.NODE_ENV === "production",
});

// Configure Plugins
kire.plugin(KireNode);
kire.plugin(Wired.plugin, {
	route: "/_wired",
	adapter: "http",
	secret: "dev-secret-key", // In production, use a real secret
	expire: "2h",
});

// Register Namespace for views
kire.namespace("views", viewsDir);

// Register Components
// We use the 'wired' method added by the plugin to discover components
await (kire as any).wired(componentsPattern);

// Start Server
Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		// --- Context Setup (Session/User) ---
		// In a real app, you would get this from cookies/session
		const sessionValue = "demo-session-id";
		const ip = "127.0.0.1";
		
		// Generate the wireKey (CSRF/State protection)
		const wireKey = Wired.keystore(sessionValue, ip);
		
		const user = { id: sessionValue, name: "Guest User" };
		
		// Common data passed to all views
		const contextData = {
			$wireToken: wireKey,
			user
		};

		// Helper to render views
		const renderView = async (viewName: string) => {
			try {
				const html = await kire.view(viewName, contextData);
				return new Response(html, { 
					headers: { "Content-Type": "text/html" } 
				});
			} catch (e) {
				console.error(e);
				return new Response(kire.renderError(e), { 
					status: 500, 
					headers: { "Content-Type": "text/html" } 
				});
			}
		};

		// --- Routes ---

		// Home
		if (url.pathname === "/") {
			return renderView("views.index");
		}

		// Example Pages
		if (url.pathname === "/chat") return renderView("views.chat");
		if (url.pathname === "/search") return renderView("views.search");
		if (url.pathname === "/infinity") return renderView("views.infinity");
		if (url.pathname === "/toast") return renderView("views.toast-page");
		if (url.pathname === "/form") return renderView("views.form");

		// Wired Endpoint (Component Actions/Updates)
		if (url.pathname === "/_wired" && req.method === "POST") {
			try {
				const body = await req.json();
				
				if (Wired.validate(body)) {
					const result = await Wired.payload(wireKey, body, { 
						req,
						// You can pass other context here (e.g. database connection)
					});
					return Response.json(result.data, { status: result.code });
				} else {
					return Response.json(Wired.invalid, { status: 400 });
				}
			} catch (e) {
				console.error("Wired Error:", e);
				return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
			}
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log("Server running on http://localhost:3000");
