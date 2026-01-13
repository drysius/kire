import { readdirSync } from "node:fs";
import path from "node:path";
import { KireNode } from "@kirejs/node";
import { Kirewire } from "@kirejs/wire";
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
	// allow to use kirewire
	kire.plugin(Kirewire, {
		route: "/_wire", // Custom route
	});

	// add views namespace for .kire files
	kire.namespace("views", path.join(process.cwd(), "views"));

	// register server components
	await Promise.all(
		readdirSync("./components").map(async (i) => {
			if(i.endsWith(".ts")) {
				kire.wire(
					i.replace(".ts", ""),
					await import(`./components/${i}`).then((i) => i.default),
				);
			}
		}),
	);

	// Middleware to set Kirewire Context (Simulating app.use)
	app.derive(async (context) => {
		const session = context.cookie.session;
		if(!session.value) {
			session.value = crypto.randomUUID();
		}
		// Attach the identifier to the context (acting as 'req')
		Kirewire.context(context, session.value);
		return {
			user: { id: session.value, name: "Guest" } // Example user object
		};
	});

	// Main Route
	app.get("/", async (context) => {
		context.set.headers["Content-Type"] = "text/html";
		
		// Pass the session ID as $wireToken for security in initial render
		return await kire.view("views.index", {
			$wireToken: context.cookie.session.value,
			$csrfToken: "mock-csrf-token-" + context.cookie.session.value, // Mock CSRF
			user: context.user
		});
	});

	// Kirewire Endpoint using the simplified API
	app.post(Kirewire.options.route, async (context) => {
		// 1. Basic Payload Validation
		if (Kirewire.trust(context.body)) {
			
			// 2. Process the request
			// context already has the identifier attached via the derive middleware above.
			const result = await Kirewire.process(context, {
				user: context.user
			});

			context.set.status = result.code;
			return result.data;
		} else {
			context.set.status = Kirewire.errors.invalid_request.code;
			return Kirewire.errors.invalid_request;
		}
	});

	app.listen(3000);
	console.log(`Check it out at http://localhost:3000`);
})();
