import path from "node:path";
import { KireNode } from "@kirejs/node";
import { Wired } from "@kirejs/wire";
import { Elysia } from "elysia";
import { Kire } from "kire";

const app = new Elysia();
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

	// register server components
	await kire.wired("components/*.ts");

	// Middleware to set Wired Context
	app.derive(async (context) => {
		const session = context.cookie.session;
		if(!session.value) {
			session.value = crypto.randomUUID();
		}
		
		// Use session ID + IP for secure identifier
		const ip = context.server?.requestIP(context.request)?.address || "127.0.0.1";
		const wireKey = Wired.keystore(session.value, ip);

		return {
			user: { id: session.value, name: "Guest" },
			wireKey
		};
	});

	// Main Route
	app.get("/", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		
		// Pass the wireKey as $wireToken so initial render checksum matches server expectations
		return await kire.view("views.index", {
			$wireToken: context.wireKey,
			user: context.user
		});
	});

    app.get("/chat", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await kire.view("views.chat", {
            $wireToken: context.wireKey,
            user: context.user
        });
    });

    app.get("/search", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await kire.view("views.search", {
            $wireToken: context.wireKey,
            user: context.user
        });
    });

	// Wired Endpoint
	app.post(Wired.options.route, async (context) => {
		// 1. Basic Payload Validation
		if (Wired.validate(context.body)) {
			
			// 2. Process the request
			const result = await Wired.payload(context.wireKey, context.body as any);

			context.set.status = result.code;
			return result.data;
		} else {
			context.set.status = 400;
			return Wired.invalid;
		}
	});

	app.listen(3000);
	console.log(`Check it out at http://localhost:3000`);
})();
