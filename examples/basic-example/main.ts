import { Elysia } from "elysia";
import { KireNode } from "@kirejs/node";
import path from "path";
import { Kire } from "kire";

const app = new Elysia();

// Initialize Kire
const kire = new Kire({
    production: process.env.NODE_ENV == "production"
});

void (async () => {
    // allow to use view system
    kire.plugin(KireNode);

    // add views namespace for .kire files
    kire.namespace('views', path.join(process.cwd(), 'views'));
    kire.namespace('{extension}', path.join(process.cwd(), 'extensions', '{extension}'));
    
    // Main Route
    app.get("/", async ({ set }) => {
        set.headers['Content-Type'] = 'text/html';
        return await kire.view('views.index');
    });

    app.get("/extensions/:extension/*", async ({ set, params }) => {
        set.headers['Content-Type'] = 'text/html';
        return await kire.view('{extension}.' + params['*'], { extension:params.extension });
    });

    app.listen(3000);
    console.log(`Check it out at http://localhost:3000`);
})()