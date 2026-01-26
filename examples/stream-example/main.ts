import { Kire } from "kire";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

const kire = new Kire({
    stream: true,
    production: false,
    resolver: async (path) => {
        return await readFile(path, "utf-8");
    }
});

kire.namespace("~", join(process.cwd(), "views"));

console.log("Starting server on http://localhost:3000");

// Bun.serve natively handles ReadableStream in Response body
export default {
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
        // kire.view returns a ReadableStream because stream: true
        const stream = await kire.view("~/index", {
            data1: "Fresh info from DB",
            data2: "Analytics processed"
        });

        return new Response(stream as ReadableStream, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
        });
    }

    return new Response("Not Found", { status: 404 });
  },
};
