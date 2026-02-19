import path from "node:path";
import { wirePlugin } from "@kirejs/wire";
import { Elysia } from "elysia";
import { Kire } from "kire";

// Initialize Kire
const kire = new Kire({
	production: process.env.NODE_ENV === "production",
});

const app = new Elysia({
	serve: {
		maxRequestBodySize: 10000 * 600 * 1024 * 1024, // 600MB
	},
}).derive(() => ({ wireKey: "", user: {}, kire: kire.fork() }));

void (async () => {
	// allow to use wired
	kire.plugin(wirePlugin, {
		route: "/_wire",
		secret: "change-me-in-production",
		expire: "2h",
	});

	// add views namespace for .kire files
	kire.namespace("views", path.join(process.cwd(), "views"));
	kire.namespace("layouts", path.join(process.cwd(), "views/layouts"));
	kire.namespace("components", path.join(process.cwd(), "views/components"));
	kire.namespace("pages", path.join(process.cwd(), "views/pages"));

	// register server components
	await kire.wired("components/*.ts");

	// Middleware to set Wired Context
	app.derive({ as: "global" }, async (context) => {
		const session = context.cookie.session;
		if (!session.value) {
			session.value = crypto.randomUUID();
			session.path = "/";
			session.httpOnly = true;
		}

		// Use session ID + IP for secure identifier
		const ip = context.server?.requestIP(context.request)?.address || "127.0.0.1";
		const wireKey = kire.wireKeystore(session.value as string, ip);

		console.log(`[Middleware] Path: ${context.request.url} | Session: ${session.value} | IP: ${ip} | WireKey: ${wireKey}`);

		const url = new URL(context.request.url);
		const isActive = (path: string) => {
			if (path === "/") return url.pathname === "/";
			return url.pathname.startsWith(path);
		};
		context.kire.$global("isActive", isActive);
		context.kire.$global('request', context);
		context.kire.$global('$wireToken', wireKey);
		return {
			user: { id: session.value, name: "Guest" },
		};
	});

	// Routes
	const routes = ["/", "/chat", "/search", "/infinity", "/toast", "/upload", "/todo", "/users", "/stream", "/lazy", "/features", "/stress", "/textarea"];
    
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
		const url = new URL(context.request.url);
        const res = await context.kire.wireRequest({
            path: url.pathname,
            method: context.request.method,
            query: context.query,
            body: context.body,
            token: context.wireKey,
            locals: { wireToken: context.wireKey }
        });

        if (res.code === "not_wired") {
            context.set.status = 404;
            return "Not Found";
        }

        if (res.headers) {
            Object.entries(res.headers).forEach(([k, v]) => {
                context.set.headers[k] = v;
            });
        }
        context.set.status = res.status || 200;
        return res.body;
	});

	app.listen(3000);
	console.log(`Check it out at http://localhost:3000`);
})();
