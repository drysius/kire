import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { wirePlugin, HttpAdapter, SocketAdapter } from "./lib/wire";
import { KireMarkdown } from "@kirejs/markdown";
import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { Kire } from "kire";
import {
    docsPages,
    docsNav,
    docsNavGroups,
    getDocNeighbors,
    packageNav,
    packageNavGroups,
    searchDocs,
    type NavItem,
} from "./lib/docs-index";

type WireRoute = {
    path: string;
    view: string;
    title: string;
};

const useSocket = process.argv.includes("--socket");
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const wireDistDir = path.resolve(appRoot, "../packages/wire/dist");

const wireRoutes: WireRoute[] = [
    { path: "/kirewire", view: "pages.index", title: "Dashboard" },
    { path: "/kirewire/features", view: "pages.features", title: "Feature Tour" },
    { path: "/kirewire/todo", view: "pages.todo", title: "Todo List" },
    { path: "/kirewire/chat", view: "pages.chat", title: "Chat + Events" },
    { path: "/kirewire/users", view: "pages.users", title: "Users + Pagination" },
    { path: "/kirewire/search", view: "pages.search", title: "Search + Filters" },
    { path: "/kirewire/infinity", view: "pages.infinity", title: "Infinite Scroll" },
    { path: "/kirewire/upload", view: "pages.upload", title: "File Upload" },
    { path: "/kirewire/collection", view: "pages.collection", title: "Collections" },
    { path: "/kirewire/stream", view: "pages.stream", title: "Streaming" },
    { path: "/kirewire/shared-components", view: "pages.shared-components", title: "Shared State" },
    { path: "/kirewire/lazy", view: "pages.lazy", title: "Lazy Loading" },
    { path: "/kirewire/toast", view: "pages.toast", title: "Toasts" },
    { path: "/kirewire/textarea", view: "pages.textarea", title: "Textarea" },
    { path: "/kirewire/stress", view: "pages.stress", title: "Stress Poll" },
    { path: "/kirewire/battle-tank", view: "pages.battle-tank", title: "Battle Tank" },
];

const wireNav: NavItem[] = wireRoutes.map((route) => ({
    id: route.path.replace(/\W+/g, "-"),
    title: route.title,
    href: route.path,
    section: "KireWire Playground",
}));

const docsMarkdownCache = new Map<string, string>();

function stripFrontmatter(source: string): string {
    const normalized = String(source || "").replace(/^\uFEFF/, "");
    const match = normalized.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    if (!match) return normalized;
    return normalized.slice(match[0].length);
}

function resolveDocsMarkdownPath(relativeFile: string): string {
    return path.resolve(path.join(appRoot, "views"), relativeFile);
}

function readDocsMarkdown(relativeFile: string): string {
    const key = String(relativeFile || "").trim();
    if (!key) return "";

    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && docsMarkdownCache.has(key)) {
        return docsMarkdownCache.get(key) || "";
    }

    try {
        const absolutePath = resolveDocsMarkdownPath(key);
        const source = fs.readFileSync(absolutePath, "utf8");
        const stripped = stripFrontmatter(source);
        if (isProduction) docsMarkdownCache.set(key, stripped);
        return stripped;
    } catch {
        return "";
    }
}

const legacyWireRouteMap: Record<string, string> = {
    "/features": "/kirewire/features",
    "/todo": "/kirewire/todo",
    "/chat": "/kirewire/chat",
    "/users": "/kirewire/users",
    "/search": "/kirewire/search",
    "/infinity": "/kirewire/infinity",
    "/upload": "/kirewire/upload",
    "/collection": "/kirewire/collection",
    "/stream": "/kirewire/stream",
    "/shared-components": "/kirewire/shared-components",
    "/lazy": "/kirewire/lazy",
    "/toast": "/kirewire/toast",
    "/textarea": "/kirewire/textarea",
    "/stress": "/kirewire/stress",
    "/battle-tank": "/kirewire/battle-tank",
    "/sse": "/kirewire/shared-components",
};

function redirect(context: any, to: string, status = 302) {
    context.set.status = status;
    context.set.headers["Location"] = to;
    return "";
}

function parseCookieValue(cookieHeader: string, key: string): string {
    const source = String(cookieHeader || "");
    if (!source) return "";
    const chunks = source.split(";");
    for (let i = 0; i < chunks.length; i++) {
        const part = chunks[i]!.trim();
        if (!part) continue;
        const eq = part.indexOf("=");
        if (eq <= 0) continue;
        const name = part.slice(0, eq).trim();
        if (name !== key) continue;
        const raw = part.slice(eq + 1);
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }
    return "";
}

// Initialize Kire
const kire = new Kire({
    root: path.join(appRoot, "views"),
    production: process.env.NODE_ENV === "production",
});

const app = new Elysia({
    serve: {
        maxRequestBodySize: 10000 * 600 * 1024 * 1024, // 600MB
    },
})
    .use(staticPlugin({
        assets: wireDistDir,
        prefix: "/dist",
    }))
    .derive(() => ({ wireKey: "", user: {}, kire: kire.fork() }));

void (async () => {
    const wire = new wirePlugin({
        secret: "change-me-in-production",
        bus_delay: 10,
        adapter: useSocket ? new SocketAdapter() : new HttpAdapter({ route: "/_wire" }),
    });

    const socketClientsByUser = new Map<string, Set<any>>();
    const addSocketClient = (userId: string, ws: any) => {
        let bucket = socketClientsByUser.get(userId);
        if (!bucket) {
            bucket = new Set<any>();
            socketClientsByUser.set(userId, bucket);
        }
        bucket.add(ws);
    };
    const removeSocketClient = (userId: string, ws: any) => {
        const bucket = socketClientsByUser.get(userId);
        if (!bucket) return;
        bucket.delete(ws);
        if (bucket.size === 0) socketClientsByUser.delete(userId);
    };

    kire.plugin(KireMarkdown);
    kire.plugin(wire);

    kire.namespace("views", path.join(appRoot, "views"));
    kire.namespace("layouts", path.join(appRoot, "views/layouts"));
    kire.namespace("components", path.join(appRoot, "views/components"));
    kire.namespace("pages", path.join(appRoot, "views/pages"));

    await (kire as any).$wire.wireRegister("components/*.ts", appRoot);

    if (useSocket) {
        const wireEngine = (kire as any).$wire;
        wireEngine.on("socket:push", (packet: any) => {
            const userId = String(packet?.userId || "").trim();
            if (!userId) return;
            const clients = socketClientsByUser.get(userId);
            if (!clients || clients.size === 0) return;

            const raw = JSON.stringify({
                event: String(packet?.event || ""),
                payload: packet?.data,
            });

            for (const ws of clients) {
                try {
                    ws.send(raw);
                } catch {}
            }
        });

        app.ws("/_wire/socket", {
            open(ws: any) {
                const request = ws.data?.request as Request | undefined;
                const url = request ? new URL(request.url) : new URL("http://localhost/_wire/socket");
                const cookieHeader = request?.headers.get("cookie") || "";
                const userId = parseCookieValue(cookieHeader, "session") || "guest";
                const pageId = String(url.searchParams.get("pageId") || "default-page");

                ws.data = ws.data || {};
                ws.data.kirewire = { userId, pageId };
                addSocketClient(userId, ws);
            },
            message(ws: any, message: any) {
                const wireEngine = (kire as any).$wire;
                const adapter = wireEngine?.options?.adapter;
                if (!adapter || typeof adapter.onMessage !== "function") return;

                let parsed: any;
                try {
                    parsed = typeof message === "string" ? JSON.parse(message) : message;
                } catch {
                    ws.send(JSON.stringify({
                        event: "response",
                        payload: { error: "Invalid JSON payload." },
                    }));
                    return;
                }

                const userId = String(ws.data?.kirewire?.userId || "guest");
                void adapter.onMessage(String(ws.id || ""), userId, userId, parsed);
            },
            close(ws: any) {
                const userId = String(ws.data?.kirewire?.userId || "");
                if (userId) removeSocketClient(userId, ws);
            },
        });
    }

    app.derive({ as: "global" }, async (context) => {
        const session = context.cookie.session;
        if (!session.value) {
            session.value = randomUUID();
            session.path = "/";
            session.httpOnly = true;
        }

        let ip = context.server?.requestIP(context.request)?.address || "127.0.0.1";
        if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";

        const wireKey = createHash("sha256")
            .update(`${session.value}:${ip}`)
            .digest("hex");

        const url = new URL(context.request.url);
        const pageId = createHash("md5").update(url.pathname).digest("hex");
        const docsQuery = String(url.searchParams.get("q") || "").trim();

        const isActive = (targetPath: string) => {
            if (targetPath === "/") return url.pathname === "/";
            return url.pathname === targetPath || url.pathname.startsWith(`${targetPath}/`);
        };

        const user = { id: session.value, name: "Guest" };
        context.kire.$global("isActive", isActive);
        context.kire.$global("request", context);
        context.kire.$global("wireKey", wireKey);
        context.kire.$global("pageId", pageId);
        context.kire.$global("user", user);
        context.kire.$global("sharedTransport", useSocket ? "socket" : "sse");
        context.kire.$global("docsNav", docsNav);
        context.kire.$global("docsNavGroups", docsNavGroups);
        context.kire.$global("packageNav", packageNav);
        context.kire.$global("packageNavGroups", packageNavGroups);
        context.kire.$global("wireNav", wireNav);
        context.kire.$global("docsQuery", docsQuery);
        context.kire.$global("currentPath", url.pathname);
        context.kire.$global("$docsMarkdown", (relativeFile: string) => readDocsMarkdown(relativeFile));

        return {
            user,
            wireKey,
            pageId,
        };
    });

    // Documentation routes
    app.get("/", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-home", {
            title: "Kire Documentation",
            featuredDocs: docsPages.filter((item) => item.section !== "Packages").slice(0, 4),
            featuredPackages: docsPages.filter((item) => item.section === "Packages").slice(0, 4),
            wireHighlights: wireNav.slice(0, 6),
        });
    });

    app.get("/docs", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-home", {
            title: "Kire Documentation",
            featuredDocs: docsPages.filter((item) => item.section !== "Packages").slice(0, 6),
            featuredPackages: docsPages.filter((item) => item.section === "Packages").slice(0, 6),
            wireHighlights: wireNav.slice(0, 6),
        });
    });

    app.get("/docs/packages", async (context) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-packages", {
            title: "Packages - Kire Docs",
            packages: docsPages.filter((item) => item.section === "Packages"),
        });
    });

    app.get("/docs/search", async (context) => {
        const query = String(context.query?.q || "").trim();
        const results = searchDocs(query);

        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-search", {
            title: query ? `Search: ${query} - Kire Docs` : "Search - Kire Docs",
            query,
            results,
        });
    });

    app.get("/llms.txt", async (context) => {
        context.set.headers["Content-Type"] = "text/plain; charset=utf-8";
        return Bun.file(path.join(appRoot, "llms.txt"));
    });

    for (let i = 0; i < docsPages.length; i++) {
        const page = docsPages[i]!;
        app.get(page.href, async (context) => {
            context.set.headers["Content-Type"] = "text/html";
            const neighbors = getDocNeighbors(page.href);
            const related = docsPages
                .filter((item) => item.section === page.section && item.id !== page.id)
                .slice(0, 4);

            return await context.kire.view("pages.docs-article", {
                title: `${page.title} - Kire Docs`,
                article: page,
                related,
                previousDoc: neighbors.previous,
                nextDoc: neighbors.next,
            });
        });
    }

    // KireWire playground routes
    for (let i = 0; i < wireRoutes.length; i++) {
        const route = wireRoutes[i]!;
        app.get(route.path, async (context) => {
            context.set.headers["Content-Type"] = "text/html";
            return await context.kire.view(route.view, {
                title: `${route.title} - KireWire`,
                user: context.user,
            });
        });
    }

    // Legacy wire routes -> /kirewire/*
    for (const [legacy, target] of Object.entries(legacyWireRouteMap)) {
        app.get(legacy, (context) => redirect(context, target, 302));
    }

    // Unified wire handler
    app.all(`/_wire*`, async (context) => {
        const wireEngine = (context.kire as any).$wire || (context.kire as any).wire;
        if (!wireEngine?.options?.adapter) {
            context.set.status = 500;
            return { error: "Wire adapter is not configured for this request." };
        }

        const res = await wireEngine.options.adapter.handleRequest({
            method: context.request.method,
            url: context.request.url,
            query: context.query,
            body: context.body,
            userId: context.user.id,
            sessionId: context.wireKey,
            signal: context.request.signal,
        }, context.user.id, context.wireKey);

        const status = res.status || 200;
        const headers = (res.headers || {}) as Record<string, string>;

        if (res.result instanceof ReadableStream || String(headers["Content-Type"] || "").includes("text/event-stream")) {
            return new Response(res.result as any, { status, headers });
        }

        if (res.headers) {
            Object.entries(res.headers).forEach(([k, v]) => {
                context.set.headers[k] = v as any;
            });
        }
        context.set.status = status;
        return res.result;
    });

    app.listen(3000);
    console.log(`[docs] serving wire assets from ${wireDistDir}`);
    console.log(`Check it out at http://localhost:3000 (${useSocket ? "socket mode" : "http+sse mode"})`);
})();

