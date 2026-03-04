import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { wirePlugin, HttpAdapter, SocketAdapter } from "@kirejs/wire";
import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { Kire } from "kire";

const useSocket = process.argv.includes("--socket");
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const wireDistDir = path.resolve(appRoot, "../packages/wire/dist");

// Initialize Kire
const kire = new Kire({
	root: path.join(appRoot, "views"),
	production: process.env.NODE_ENV === "production",
});

const app = new Elysia({
	serve: {
		maxRequestBodySize: 10000 * 600 * 1024 * 1024, // 600MB
	},
})
.use(staticPlugin({
    assets: wireDistDir,
    prefix: "/dist"
}))
.derive(() => ({ wireKey: "", user: {}, kire: kire.fork() }));

void (async () => {
	// register server components from glob pattern
	const wire = new wirePlugin({
		secret: "change-me-in-production",
		bus_delay: 10,
		adapter: useSocket ? new SocketAdapter() : new HttpAdapter({ route: "/_wire" })
	});

	kire.plugin(wire);

	// add views namespace for .kire files
	kire.namespace("views", path.join(appRoot, "views"));
	kire.namespace("layouts", path.join(appRoot, "views/layouts"));
	kire.namespace("components", path.join(appRoot, "views/components"));
	kire.namespace("pages", path.join(appRoot, "views/pages"));

	// register server components using the new $wire instance
	await (kire as any).$wire.wireRegister("components/*.ts", appRoot);

	// Middleware to set Wired Context
	app.derive({ as: "global" }, async (context) => {
		const session = context.cookie.session;
		if (!session.value) {
			session.value = randomUUID();
			session.path = "/";
			session.httpOnly = true;
		}

		// Build a stable per-user key used by wire checksum/hydration.
		let ip = context.server?.requestIP(context.request)?.address || "127.0.0.1";
        if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1"; // Standardize loopback

		const wireKey = createHash("sha256")
			.update(`${session.value}:${ip}`)
			.digest("hex");

		const url = new URL(context.request.url);
        const pageId = createHash("md5").update(url.pathname).digest("hex");

		const isActive = (path: string) => {
			if (path === "/") return url.pathname === "/";
			return url.pathname.startsWith(path);
		};
        
        const user = { id: session.value, name: "Guest" };
		context.kire.$global("isActive", isActive);
		context.kire.$global('request', context);
		context.kire.$global('wireKey', wireKey);
        context.kire.$global('pageId', pageId);
        context.kire.$global('user', user);
		context.kire.$global('sharedTransport', useSocket ? "socket" : "sse");

		return {
			user,
            wireKey: wireKey,
            pageId: pageId
		};
	});

	// Routes
	const routes = ["/", "/chat", "/search", "/infinity", "/toast", "/upload", "/todo", "/users", "/stream", "/shared-components", "/lazy", "/features", "/stress", "/textarea", "/battle-tank"];
    
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
	app.all(`/_wire*`, async (context) => {
        const wireEngine = (context.kire as any).$wire || (context.kire as any).wire;
        if (!wireEngine?.options?.adapter) {
            context.set.status = 500;
            return { error: "Wire adapter is not configured for this request." };
        }

        const res = await wireEngine.options.adapter.handleRequest({
            method: context.request.method,
            url: context.request.url,
            query: context.query,
            body: context.body,
            userId: context.user.id,
            sessionId: context.wireKey,
            signal: context.request.signal
        }, context.user.id, context.wireKey);

        const status = res.status || 200;
        const headers = (res.headers || {}) as Record<string, string>;

        // SSE/stream responses should bypass Elysia's default body writer to avoid controller state races.
        if (res.result instanceof ReadableStream || String(headers["Content-Type"] || "").includes("text/event-stream")) {
            return new Response(res.result as any, { status, headers });
        }

        if (res.headers) {
            Object.entries(res.headers).forEach(([k, v]) => {
                context.set.headers[k] = v as any;
            });
        }
        context.set.status = status;
        return res.result;
	});


	app.listen(3000);
	console.log(`[docs] serving wire assets from ${wireDistDir}`);
	console.log(`Check it out at http://localhost:3000 (${useSocket ? "socket mode" : "http+sse mode"})`);
})();
