import { Kire } from "kire";
import { join } from "node:path";

const kire = new Kire({
    stream: true,
    production: false,
});

kire.namespace("~", join(process.cwd(), "views"));

console.log("Starting server on http://localhost:3000");

// Bun.serve natively handles ReadableStream in Response body
export default {
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
        try {
            // kire.view returns a ReadableStream because stream: true
            const stream = kire.view("~/index", {
                data1: "Fresh info from DB",
                data2: "Analytics processed"
            });

            return new Response(stream as ReadableStream, {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            });
        } catch (e) {
            console.error("GET - / failed", e);
            return new Response(kire.renderError(e), {
                headers: { "Content-Type": "text/html; charset=utf-8" }
            });
        }
    }

    return new Response("Not Found", { status: 404 });
  },
};
