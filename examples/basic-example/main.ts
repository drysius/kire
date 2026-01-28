import path from "node:path";
import { KireNode } from "@kirejs/node";
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

    
    // Dynamic namespace with variable
    kire.namespace("views", path.join(process.cwd(), "themes", "{theme}"));
	kire.namespace("extensions",path.join(process.cwd(), "extensions", "{extension}", 'views'));

    // Set default theme via prop (or $global)
    kire.$global('theme', 'phoenix');

	// Main Route
	app.get("/", async ({ set }) => {
		set.headers["Content-Type"] = "text/html";
        // Renders themes/phoenix/index.kire because theme is 'phoenix'
		return await kire.view("views.index");
	});

    // Override theme via locals
	app.get("/custom", async ({ set }) => {
		set.headers["Content-Type"] = "text/html";
		return await kire.view("views.index", { theme: 'phoenix' });
	});

	app.get("/extensions/:extension", async ({ set, params }) => {
		set.headers["Content-Type"] = "text/html";
		kire.$prop('extension', params.extension)
		return await kire.view(`extensions.index`);
	});

    // Custom Error Handling Example
    app.get("/error", async ({ set }) => {
        set.headers["Content-Type"] = "text/html";
        
        // Override renderError to throw, so we can handle it manually here
        const originalRenderError = kire.renderError;
        kire.renderError = (e) => { throw e; };

        try {
            // This path doesn't exist in the theme, so it might fail logic or file load
            // But we want to trigger the test-error logic.
            // Let's point to the file directly to avoid theme confusion for this specific error test
            return await kire.render("<?js throw new Error('Simulated Error') ?>", {}, undefined, "simulated-error.kire");
        } catch (e: any) {
            kire.renderError = originalRenderError;
            console.log("Caught KireError in Main:", e);
            
            // Use the new helper to render the standard HTML error page
            // We can check if it's a KireError
            if (e instanceof kire.$error) {
                 return (kire.$error as any).html(e);
            }
            return (kire.$error as any).html(e);
        }
    });

    app.get("/error-require", async ({ set }) => {
        set.headers["Content-Type"] = "text/html";
        
        const originalRenderError = kire.renderError;
        kire.renderError = (e) => { throw e; };

        try {
            return await kire.view("views.error-parent");
        } catch (e: any) {
            kire.renderError = originalRenderError;
            console.log("Caught KireError in Main (Require):", e);
            return await kire.view("views.kire-error-page", { error: e });
        }
    });

	app.listen(3000);
	console.log(`Check it out at http://localhost:3000`);
})();
