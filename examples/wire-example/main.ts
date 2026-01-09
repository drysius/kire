import { Elysia } from "elysia";
import { Kirewire } from "@kirejs/wire";
import { KireNode } from "@kirejs/node";
import { Elysiawire } from "../../packages/wire/src/server/adapters/elysia";
import path from "path";
import { Kire } from "kire";
import { readdirSync } from "fs";

const app = new Elysia();
// Initialize Kire
const kire = new Kire({
    production: process.env.NODE_ENV == "production"
});

void (async () => {
    // allow to use view system
    kire.plugin(KireNode);
    // allow to use kirewire
    kire.plugin(Kirewire, {
        route: '/_wire', // Custom route
    });

    // add views namespace for .kire files
    kire.namespace('views', path.join(process.cwd(), 'views'));

    // register server components
    await Promise.all(readdirSync('./components').map(async i => {
        kire.wire(i.replace('.ts', ''), await import('./components/' + i).then(i => i.default))
    }));

    // Add Wire Middleware
    Elysiawire(app);

    // Main Route
    app.get("/", async ({ set }) => {
        set.headers['Content-Type'] = 'text/html';
        return await kire.view('views.index');
    });

    app.listen(3000);
    console.log(`Check it out at http://localhost:3000`);
})()