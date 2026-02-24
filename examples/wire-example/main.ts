import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { wirePlugin } from "@kirejs/wire";
import { Elysia } from "elysia";
import { Kire } from "kire";

const useSocket = process.argv.includes("--socket");
console.log(useSocket)
// Initialize Kire
const kire = new Kire({
	root:path.join(process.cwd(), 'views'),
	production: process.env.NODE_ENV === "production",
});

const app = new Elysia({
	serve: {
		maxRequestBodySize: 10000 * 600 * 1024 * 1024, // 600MB
	},
}).derive(() => ({ wireKey: "", user: {}, kire: kire.fork() }));

void (async () => {
	// register server components from glob pattern
	kire.plugin(wirePlugin, {
		route: "/_wire",
		secret: "change-me-in-production",
		bus_delay:10,
	});

	// add views namespace for .kire files
	kire.namespace("views", path.join(process.cwd(), "views"));
	kire.namespace("layouts", path.join(process.cwd(), "views/layouts"));
	kire.namespace("components", path.join(process.cwd(), "views/components"));
	kire.namespace("pages", path.join(process.cwd(), "views/pages"));

	// register server components
	await kire.wireRegister("components/*.ts");

	// Middleware to set Wired Context
	app.derive({ as: "global" }, async (context) => {
		const session = context.cookie.session;
		if (!session.value) {
			session.value = randomUUID();
			session.path = "/";
			session.httpOnly = true;
		}

		// Build a stable per-user key used by wire checksum/hydration.
		const ip = context.server?.requestIP(context.request)?.address || "127.0.0.1";
		const wireKey = createHash("sha256")
			.update(`${session.value}:${ip}`)
			.digest("hex");
		context.kire.wireKey(wireKey);

		console.log(`[Middleware] Path: ${context.request.url} | Session: ${session.value} | IP: ${ip} | WireKey: ${wireKey}`);

		const url = new URL(context.request.url);
		const isActive = (path: string) => {
			if (path === "/") return url.pathname === "/";
			return url.pathname.startsWith(path);
		};
		context.kire.$global("isActive", isActive);
		context.kire.$global('request', context);
		context.kire.$global('$wireToken', wireKey);
		context.kire.$global('sharedTransport', useSocket ? "socket" : "sse");
		return {
			user: { id: session.value, name: "Guest" },
		};
	});

	// Routes
	const routes = ["/", "/chat", "/search", "/infinity", "/toast", "/upload", "/todo", "/users", "/stream", "/shared-components", "/lazy", "/features", "/stress", "/textarea"];
    
    for (const route of routes) {
        const viewName = route === "/" ? "pages.index" : `pages.${route.slice(1)}`;
        app.get(route, async (context) => {
            context.set.headers["Content-Type"] = "text/html";
            
            return await context.kire.view(viewName, {
                user: context.user,
            });
        });
    }

	// Unified Wired Handler
    const wireRoute = kire.$kire["~wire"].options.route;

	app.all(`${wireRoute}*`, async (context) => {
        const res = await context.kire.wireRequest({
            url: context.request.url,
            query: context.query,
            body: context.body,
        });

        const status = res.status || 200;
        const headers = (res.headers || {}) as Record<string, string>;

        // SSE/stream responses should bypass Elysia's default body writer to avoid controller state races.
        if (res.result instanceof ReadableStream || String(headers["Content-Type"] || "").includes("text/event-stream")) {
            return new Response(res.result as any, { status, headers });
        }

        if (res.headers) {
            Object.entries(res.headers).forEach(([k, v]) => {
                context.set.headers[k] = v;
            });
        }
        context.set.status = status;
        return res.result;
	});

	app.listen(3000);
	console.log(`Check it out at http://localhost:3000 (${useSocket ? "socket mode" : "http+sse mode"})`);
})();
