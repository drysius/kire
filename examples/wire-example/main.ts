import path from "node:path";
import { KireNode } from "@kirejs/node";
import { Wired } from "@kirejs/wire";
import { Elysia } from "elysia";
import { Kire } from "kire";

const app = new Elysia({
	serve: {
		maxRequestBodySize: 600 * 1024 * 1024, // 600MB
	},
}).derive(() => ({ wireKey: "", user: {} }));
// Initialize Kire
const kire = new Kire({
	production: process.env.NODE_ENV === "production",
});

void (async () => {
	// allow to use view system
	kire.plugin(KireNode);
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
		kire.$global("isActive", isActive);
		kire.$global('request', context);
		return {
			user: { id: session.value, name: "Guest" },
			wireKey,
		};
	});

	// Main Route
	app.get("/", async (context) => {
		context.set.headers["Content-Type"] = "text/html";

		// Pass the wireKey as $wireToken so initial render checksum matches server expectations
		return await kire.view("pages.index", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/chat", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.chat", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/search", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.search", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/infinity", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.infinity", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/toast", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.toast", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/upload", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.upload", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/todo", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.todo", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/users", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.users", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/stream", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.todo", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	app.get("/lazy/:test", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		return await kire.view("pages.lazy", {
			$wireToken: context.wireKey,
			user: context.user,
		});
	});

	// Wired Endpoint
	app.post(Wired.options.route, async (context) => {
		console.log(`[POST] ${Wired.options.route} - Incoming Request`);
		try {
			// Debug logs
			// console.log("Headers:", context.request.headers);
			// console.log("Body Type:", typeof context.body);
			// if (typeof context.body === 'object') {
			//     console.log("Body Keys:", Object.keys(context.body || {}));
			//     if ((context.body as any)._wired_payload) {
			//         console.log("Multipart Payload found");
			//     }
			// }

			// 1. Basic Payload Validation
			const isValid = Wired.validate(context.body);
			if (isValid) {
				// 2. Process the request
				console.log("Validation passed. Processing payload...");
				const result = await Wired.payload(
					context.wireKey,
					context.body as any,
				);

				console.log("Payload processed. Code:", result.code);
				context.set.status = result.code;
				return result.data;
			} else {
				console.warn("Validation failed for body:", context.body);
				context.set.status = 400;
				return Wired.invalid;
			}
		} catch (e) {
			console.error("[Server Error] Exception in /_wired handler:", e);
			context.set.status = 500;
			return { error: "Internal Server Error" };
		}
	});

	app.listen(3000);
	console.log(`Check it out at http://localhost:3000`);
})();
