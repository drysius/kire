import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { wirePlugin, HttpAdapter, SocketAdapter } from "./lib/wire";
import { KireMarkdown } from "@kirejs/markdown";
import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { Kire } from "../core/src/index.ts";
import {
    createDocsMarkdownReader,
    parseCookieValue,
    redirect,
} from "./lib/server-utils";
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

type DocsContext = any;
type KireEngine = any;
type WireEngine = any;
type SocketClient = any;
type WireAdapterResponse = {
    status?: number;
    headers?: Record<string, string>;
    result?: unknown;
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_SOCKET = process.argv.includes("--socket");
const APP_ROOT = path.dirname(fileURLToPath(import.meta.url));
const VIEWS_ROOT = path.join(APP_ROOT, "views");
const DOCS_PUBLIC_DIR = path.join(APP_ROOT, "public");
const WIRE_DIST_DIR = path.resolve(APP_ROOT, "../packages/wire/dist");
const KIRE_BROWSER_ENTRY = path.resolve(APP_ROOT, "../core/src/browser.ts");
const KIRE_BROWSER_DIST_DIR = path.join(APP_ROOT, ".generated/kire-browser");
const KIRE_BROWSER_FILE = path.join(KIRE_BROWSER_DIST_DIR, "browser.js");
const KIRE_BROWSER_MAP_FILE = `${KIRE_BROWSER_FILE}.map`;

const WIRE_ROUTES: WireRoute[] = [
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

const WIRE_NAV: NavItem[] = WIRE_ROUTES.map((route) => ({
    id: route.path.replace(/\W+/g, "-"),
    title: route.title,
    href: route.path,
    section: "KireWire Playground",
}));

const LEGACY_WIRE_ROUTE_MAP: Record<string, string> = {
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

const DOCS_NON_PACKAGES = docsPages.filter((item) => item.section !== "Packages");
const DOCS_PACKAGES = docsPages.filter((item) => item.section === "Packages");
const readDocsMarkdown = createDocsMarkdownReader({
    viewsRoot: VIEWS_ROOT,
    production: IS_PRODUCTION,
});

const kire = createKireEngine();
const app = createApp(kire);

void bootstrap();

async function bootstrap() {
    await ensureKireBrowserRuntime();

    const wire = new wirePlugin({
        secret: "change-me-in-production",
        bus_delay: 10,
        autoclean: true,
        adapter: USE_SOCKET ? new SocketAdapter() : new HttpAdapter({ route: "/_wire" }),
    });

    const wireEngine = await setupKire(kire, wire);
    if (USE_SOCKET) registerSocketBridge(app, wireEngine);

    registerGlobalContext(app);
    registerGlobalErrorHandler(app);
    registerBrowserRuntimeRoutes(app);
    registerDocumentationRoutes(app);
    registerWirePlaygroundRoutes(app);
    registerLegacyWireRedirects(app);
    registerUnifiedWireHandler(app);

    app.listen(3000);
    console.log(`[docs] serving wire assets from ${WIRE_DIST_DIR}`);
    console.log(`[docs] serving kire/browser runtime from ${KIRE_BROWSER_DIST_DIR}`);
    console.log(`Check it out at http://localhost:3000 (${USE_SOCKET ? "socket mode" : "http+sse mode"})`);
}

async function ensureKireBrowserRuntime() {
    mkdirSync(KIRE_BROWSER_DIST_DIR, { recursive: true });

    const shouldBuild =
        !IS_PRODUCTION || !(await Bun.file(KIRE_BROWSER_FILE).exists());

    if (!shouldBuild) return;

    console.log(`[docs] building kire/browser runtime from ${KIRE_BROWSER_ENTRY}`);

    const result = await Bun.build({
        entrypoints: [KIRE_BROWSER_ENTRY],
        outdir: KIRE_BROWSER_DIST_DIR,
        target: "browser",
        format: "esm",
        minify: IS_PRODUCTION,
        sourcemap: "external",
    });

    if (!result.success) {
        const details = result.logs
            .map((entry) => entry.message || String(entry))
            .join("\n");
        throw new Error(
            `Failed to build kire/browser runtime.${details ? `\n${details}` : ""}`,
        );
    }

    const bundleSource = await Bun.file(KIRE_BROWSER_FILE).text();
    if (
        /from\s*["']node:/.test(bundleSource) ||
        /import\(\s*["']node:/.test(bundleSource)
    ) {
        throw new Error("Built kire/browser bundle still references node:* modules.");
    }
}

function createKireEngine(): KireEngine {
    return new Kire({
        root: VIEWS_ROOT,
        production: IS_PRODUCTION,
    });
}

function createApp(engine: KireEngine) {
    return new Elysia({
        serve: {
            maxRequestBodySize: 10000 * 600 * 1024 * 1024,
        },
    })
        .use(staticPlugin({
            assets: DOCS_PUBLIC_DIR,
            prefix: "/docs-assets",
        }))
        .use(staticPlugin({
            assets: WIRE_DIST_DIR,
            prefix: "/dist",
        }))
        .derive(() => ({ wireKey: "", user: {}, kire: engine.fork() }));
}

async function setupKire(engine: KireEngine, wire: any): Promise<WireEngine> {
    engine.plugin(KireMarkdown);
    engine.plugin(wire);

    engine.namespace("views", VIEWS_ROOT);
    engine.namespace("layouts", path.join(VIEWS_ROOT, "layouts"));
    engine.namespace("components", path.join(VIEWS_ROOT, "components"));
    engine.namespace("pages", path.join(VIEWS_ROOT, "pages"));

    const wireEngine = getWireEngine(engine);
    await wireEngine.wireRegister("components/*.ts", APP_ROOT);

    return wireEngine;
}

function getWireEngine(engine: KireEngine): WireEngine {
    return engine?.$wire || engine?.wire;
}

function registerSocketBridge(server: any, wireEngine: WireEngine) {
    const socketHub = createSocketHub();

    wireEngine.on("socket:push", (packet: any) => {
        const userId = String(packet?.userId || "").trim();
        const sessionId = String(packet?.sessionId || "").trim();
        if (!userId && !sessionId) return;

        socketHub.broadcast({ userId, sessionId }, {
            event: String(packet?.event || ""),
            payload: packet?.data,
        });
    });

    server.ws("/_wire/socket", {
        open(ws: SocketClient) {
            const request = ws.data?.request as Request | undefined;
            const url = request ? new URL(request.url) : new URL("http://localhost/_wire/socket");
            const cookieHeader = request?.headers.get("cookie") || "";
            const userId = parseCookieValue(cookieHeader, "session") || "guest";
            const sessionId = String(url.searchParams.get("sessionId") || userId);
            const pageId = String(url.searchParams.get("pageId") || "default-page");

            ws.data = ws.data || {};
            ws.data.kirewire = { userId, sessionId, pageId };
            socketHub.add(userId, sessionId, ws);
        },
        message(ws: SocketClient, message: any) {
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
            const sessionId = String(ws.data?.kirewire?.sessionId || userId);
            void adapter.onMessage(String(ws.id || ""), userId, sessionId, parsed);
        },
        close(ws: SocketClient) {
            const userId = String(ws.data?.kirewire?.userId || "");
            const sessionId = String(ws.data?.kirewire?.sessionId || userId);
            if (userId || sessionId) socketHub.remove(userId, sessionId, ws);
        },
    });
}

function createSocketHub() {
    const clientsByKey = new Map<string, Set<SocketClient>>();

    return {
        add(userId: string, sessionId: string, ws: SocketClient) {
            const keys = [
                String(sessionId || "").trim(),
                String(userId || "").trim(),
            ].filter(Boolean);

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]!;
                let bucket = clientsByKey.get(key);
                if (!bucket) {
                    bucket = new Set<SocketClient>();
                    clientsByKey.set(key, bucket);
                }
                bucket.add(ws);
            }
        },
        remove(userId: string, sessionId: string, ws: SocketClient) {
            const keys = [
                String(sessionId || "").trim(),
                String(userId || "").trim(),
            ].filter(Boolean);

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]!;
                const bucket = clientsByKey.get(key);
                if (!bucket) continue;
                bucket.delete(ws);
                if (bucket.size === 0) clientsByKey.delete(key);
            }
        },
        broadcast(
            target: { userId?: string; sessionId?: string },
            packet: { event: string; payload: unknown },
        ) {
            const sessionKey = String(target?.sessionId || "").trim();
            const userKey = String(target?.userId || "").trim();
            const bucket =
                (sessionKey ? clientsByKey.get(sessionKey) : undefined) ||
                (userKey ? clientsByKey.get(userKey) : undefined);
            if (!bucket || bucket.size === 0) return;

            const raw = JSON.stringify(packet);
            for (const ws of bucket) {
                try {
                    ws.send(raw);
                } catch {}
            }
        },
    };
}

function registerGlobalContext(server: any) {
    server.derive({ as: "global" }, async (context: DocsContext) => {
        const sessionId = ensureSession(context);
        const ip = resolveRequestIp(context);
        const wireKey = createHash("sha256").update(`${sessionId}:${ip}`).digest("hex");

        const url = new URL(context.request.url);
        const pageId = createHash("md5").update(url.pathname).digest("hex");
        const docsQuery = String(url.searchParams.get("q") || "").trim();
        const sharedTransport = USE_SOCKET ? "socket" : "sse";
        const user = { id: sessionId, name: "Guest" };

        setKireGlobals(context, {
            wireKey,
            pageId,
            user,
            docsQuery,
            currentPath: url.pathname,
            sharedTransport,
        });

        return {
            user,
            wireKey,
            pageId,
            sharedTransport,
            docsNav,
            docsNavGroups,
            packageNav,
            packageNavGroups,
            wireNav: WIRE_NAV,
        };
    });
}

function registerGlobalErrorHandler(server: any) {
    server.onError((context: any) => {
        const status = resolveErrorStatusCode(context);
        const request = context?.request as Request | undefined;

        if (request && shouldRenderErrorHtml(request) && context?.kire) {
            return renderKireErrorResponse(context, context.error, status);
        }

        context.set.status = status;
        context.set.headers["Content-Type"] = "application/json";
        return {
            error: extractErrorMessage(context.error) || "Internal server error.",
        };
    });
}

function ensureSession(context: DocsContext): string {
    const session = context.cookie.session;
    if (!session.value) {
        session.value = randomUUID();
        session.path = "/";
        session.httpOnly = true;
    }
    return String(session.value);
}

function resolveRequestIp(context: DocsContext): string {
    let ip = context.server?.requestIP(context.request)?.address || "127.0.0.1";
    if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";
    return ip;
}

function setKireGlobals(
    context: DocsContext,
    payload: {
        wireKey: string;
        pageId: string;
        user: { id: string; name: string };
        docsQuery: string;
        currentPath: string;
        sharedTransport: string;
    },
) {
    const isActive = (targetPath: string) => {
        if (targetPath === "/") return payload.currentPath === "/";
        return payload.currentPath === targetPath || payload.currentPath.startsWith(`${targetPath}/`);
    };

    const globals: Array<[string, unknown]> = [
        ["isActive", isActive],
        ["request", context],
        ["Date", Date],
        ["wireKey", payload.wireKey],
        ["pageId", payload.pageId],
        ["user", payload.user],
        ["sharedTransport", payload.sharedTransport],
        ["docsNav", docsNav],
        ["docsNavGroups", docsNavGroups],
        ["packageNav", packageNav],
        ["packageNavGroups", packageNavGroups],
        ["wireNav", WIRE_NAV],
        ["docsQuery", payload.docsQuery],
        ["currentPath", payload.currentPath],
        ["$docsMarkdown", (relativeFile: string) => readDocsMarkdown(relativeFile)],
    ];

    for (const [key, value] of globals) {
        context.kire.$global(key, value);
    }
}

function registerDocumentationRoutes(server: any) {
    server.get("/", async (context: DocsContext) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-home", {
            title: "Kire Documentation",
            featuredDocs: DOCS_NON_PACKAGES.slice(0, 4),
            featuredPackages: DOCS_PACKAGES.slice(0, 4),
            wireHighlights: WIRE_NAV.slice(0, 6),
        });
    });

    server.get("/docs", async (context: DocsContext) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-home", {
            title: "Kire Documentation",
            featuredDocs: DOCS_NON_PACKAGES.slice(0, 6),
            featuredPackages: DOCS_PACKAGES.slice(0, 6),
            wireHighlights: WIRE_NAV.slice(0, 6),
        });
    });

    server.get("/docs/packages", async (context: DocsContext) => {
        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-packages", {
            title: "Packages - Kire Docs",
            packages: DOCS_PACKAGES,
        });
    });

    server.get("/docs/search", async (context: DocsContext) => {
        const query = String(context.query?.q || "").trim();

        context.set.headers["Content-Type"] = "text/html";
        return await context.kire.view("pages.docs-search", {
            title: query ? `Search: ${query} - Kire Docs` : "Search - Kire Docs",
            query,
            results: searchDocs(query),
        });
    });

    server.get("/llms.txt", async (context: DocsContext) => {
        context.set.headers["Content-Type"] = "text/plain; charset=utf-8";
        return Bun.file(path.join(APP_ROOT, "llms.txt"));
    });

    for (const page of docsPages) {
        server.get(page.href, async (context: DocsContext) => {
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
}

function registerBrowserRuntimeRoutes(server: any) {
    server.get("/assets/kire-browser.js", async (context: DocsContext) => {
        if (!(await Bun.file(KIRE_BROWSER_FILE).exists())) {
            await ensureKireBrowserRuntime();
        }

        context.set.headers["Content-Type"] =
            "application/javascript; charset=utf-8";
        return Bun.file(KIRE_BROWSER_FILE);
    });

    server.get("/assets/kire-browser.js.map", async (context: DocsContext) => {
        if (!(await Bun.file(KIRE_BROWSER_MAP_FILE).exists())) {
            await ensureKireBrowserRuntime();
        }

        context.set.headers["Content-Type"] = "application/json; charset=utf-8";
        return Bun.file(KIRE_BROWSER_MAP_FILE);
    });
}

function registerWirePlaygroundRoutes(server: any) {
    for (const route of WIRE_ROUTES) {
        server.get(route.path, async (context: DocsContext) => {
            context.set.headers["Content-Type"] = "text/html";
            return await context.kire.view(route.view, {
                title: `${route.title} - KireWire`,
                user: context.user,
            });
        });
    }
}

function registerLegacyWireRedirects(server: any) {
    for (const [legacy, target] of Object.entries(LEGACY_WIRE_ROUTE_MAP)) {
        server.get(legacy, (context: DocsContext) => redirect(context, target, 302));
    }
}

function registerUnifiedWireHandler(server: any) {
    server.all("/_wire*", async (context: DocsContext) => {
        const wireEngine = getWireEngine(context.kire);
        const adapter = wireEngine?.options?.adapter;
        if (!adapter) {
            return respondWireError(context, "Wire adapter is not configured for this request.", 500);
        }

        try {
            const response = await adapter.handleRequest({
                method: context.request.method,
                url: context.request.url,
                query: context.query,
                body: context.body,
                userId: context.user.id,
                sessionId: context.wireKey,
                signal: context.request.signal,
            }, context.user.id, context.wireKey) as WireAdapterResponse;

            const status = response.status || 200;
            const headers = (response.headers || {}) as Record<string, string>;
            const contentType = String(headers["Content-Type"] || "");

            if (
                response.result instanceof ReadableStream ||
                contentType.includes("text/event-stream")
            ) {
                return new Response(response.result as any, { status, headers });
            }

            if (response.headers) {
                for (const [key, value] of Object.entries(response.headers)) {
                    context.set.headers[key] = value as any;
                }
            }

            if (status >= 500 && shouldRenderErrorHtml(context.request)) {
                const errorMessage = extractErrorMessage(response.result) || `Wire request failed with status ${status}.`;
                return renderKireErrorResponse(context, new Error(errorMessage), status);
            }

            context.set.status = status;
            return response.result;
        } catch (error) {
            return respondWireError(context, error, 500);
        }
    });
}

function respondWireError(context: DocsContext, error: unknown, status: number) {
    if (shouldRenderErrorHtml(context.request)) {
        return renderKireErrorResponse(context, error, status);
    }

    context.set.status = status;
    context.set.headers["Content-Type"] = "application/json";
    return {
        error: extractErrorMessage(error) || "Internal server error.",
    };
}

function renderKireErrorResponse(
    context: DocsContext,
    error: unknown,
    status = 500,
) {
    const normalized =
        error instanceof Error
            ? error
            : new Error(extractErrorMessage(error) || "Internal server error.");

    context.set.status = status;
    context.set.headers["Content-Type"] = "text/html; charset=utf-8";
    const engine = context?.kire || kire;
    return engine.renderError(normalized, context);
}

function shouldRenderErrorHtml(request: Request): boolean {
    const accept = String(request.headers.get("accept") || "").toLowerCase();
    const destination = String(request.headers.get("sec-fetch-dest") || "").toLowerCase();

    return destination === "document" || accept.includes("text/html");
}

function extractErrorMessage(value: unknown): string {
    if (!value) return "";
    if (value instanceof Error) return String(value.message || value.toString() || "");
    if (typeof value === "string") return value;
    if (typeof value === "object" && "error" in (value as Record<string, unknown>)) {
        const nested = (value as Record<string, unknown>).error;
        if (typeof nested === "string") return nested;
    }
    return String(value);
}

function resolveErrorStatusCode(context: any): number {
    const fromSet = Number(context?.set?.status);
    if (Number.isFinite(fromSet) && fromSet >= 400) return fromSet;

    const code = String(context?.code || "").toUpperCase();
    if (code === "NOT_FOUND") return 404;
    if (code === "PARSE") return 400;
    if (code === "VALIDATION") return 422;

    return 500;
}
