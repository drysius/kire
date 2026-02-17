import path from "node:path";
import { Wired } from "@kirejs/wire";
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
}).derive(() => ({ wireKey: "", user: {}, kire:kire.fork() }));
void (async () => {
	// allow to use wired
	kire.plugin(Wired.plugin, {
		route: "/_wired",
		adapter: "http",
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
		const ip =
			context.server?.requestIP(context.request)?.address || "127.0.0.1";
		const wireKey = Wired.keystore(session.value as string, ip);

		console.log(`[Middleware] Path: ${context.request.url} | Session: ${session.value} | IP: ${ip} | WireKey: ${wireKey}`);

		const url = new URL(context.request.url);
		const isActive = (path: string) => {
			if (path === "/") return url.pathname === "/";
			return url.pathname.startsWith(path);
		};
		context.kire.$global("isActive", isActive);
		context.kire.$global('request', context);
		return {
			user: { id: session.value, name: "Guest" },
			wireKey,
		};
	});

	// Main Route
	app.get("/", async (context) => {
		context.set.headers["Content-Type"] = "text/html";

		// Pass the wireKey as $wireToken so initial render checksum matches server expectations
		return await context.kire.view("pages.index", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/chat", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.chat", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/search", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.search", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/infinity", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.infinity", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/toast", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.toast", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/upload", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.upload", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/todo", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.todo", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/users", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.users", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/stream", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.stream", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/lazy", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await context.kire.view("pages.lazy", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

    app.get("/features", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.features", {
            $wireToken: context.wireKey,
            user: context.user,
        });
    });

    app.get("/stress", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.stress", {
            $wireToken: context.wireKey,
            user: context.user,
        });
    });

	app.get("/textarea", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.textarea", {
            $wireToken: context.wireKey,
            user: context.user,
        });
    });

	// Unified Wired Handler
	app.all(`${Wired.options.route}*`, async (context) => {
		const url = new URL(context.request.url);
        const res = await context.kire.WireRequest({
            path: url.pathname,
            method: context.request.method,
            query: context.query,
            body: context.body,
            token: context.wireKey
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
