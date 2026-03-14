import { Readable } from "node:stream";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Koa from "koa";
import Router from "koa-router";
import { setHttpCallback } from "@citizenfx/http-wrapper";
import { Component, FiveMAdapter, Kirewire } from "../../packages/wire/src/index";

declare global {
    function onNet(eventName: string, handler: (...args: any[]) => void): void;
    function emitNet(eventName: string, target: string | number, payload: any): void;
    function TriggerClientEvent(eventName: string, target: string | number, payload: any): void;
    function GetCurrentResourceName(): string;
    function GetResourcePath(resourceName: string): string;

    // FiveM sets this inside net event handlers.
    // eslint-disable-next-line no-var
    var source: string | number | undefined;
}

const ROUTE_BASE = "/fivem-example";
const WIRE_ROUTE = "/_wire";
const PAGE_ID_DEFAULT = "fivem-example-page";
const COUNTER_COMPONENT_ID = "counter-demo";
const RESOURCE_NAME = typeof GetCurrentResourceName === "function"
    ? String(GetCurrentResourceName() || "fivem-example")
    : "fivem-example";
const RESOURCE_ROOT = typeof GetResourcePath === "function"
    ? String(GetResourcePath(RESOURCE_NAME) || process.cwd())
    : process.cwd();
const LOCAL_KIREWIRE_CLIENT = path.join(RESOURCE_ROOT, "client", "kirewire.js");

class DemoCounter extends Component {
    public count = 0;

    public async increment() {
        this.count += 1;
    }

    public async decrement() {
        this.count -= 1;
    }

    public async reset() {
        this.count = 0;
    }

    render() {
        return `
            <div class="panel">
                <h1>KireWire FiveM (Koa)</h1>
                <p class="count">Count: <strong>${this.count}</strong></p>

                <div class="actions">
                    <button type="button" wire:click="decrement">-</button>
                    <button type="button" wire:click="increment">+</button>
                    <button type="button" wire:click="reset">Reset</button>
                </div>
            </div>
        ` as any;
    }
}

const wire = new Kirewire({ secret: "fivem-example-secret" });
const adapter = new FiveMAdapter({
    route: WIRE_ROUTE,
    tempDir: path.join(RESOURCE_ROOT, ".kirewire_uploads"),
    resolveIdentity: (sourceId) => {
        const id = String(sourceId || "").trim();
        return {
            userId: id || "guest",
            sessionId: id || "guest",
        };
    },
    emit: (packet) => {
        const target = String(packet.sourceId || packet.userId || "").trim();
        if (!target) return;
        const payload = {
            event: packet.event,
            payload: packet.data,
        };
        emitToClient(packet.channel, target, payload);
    },
});
adapter.install(wire, {} as any);

async function ensureDemoComponent(userId: string, pageId: string) {
    const safeUserId = String(userId || "guest").trim() || "guest";
    const safePageId = String(pageId || PAGE_ID_DEFAULT).trim() || PAGE_ID_DEFAULT;
    const page = wire.sessions.getPage(safeUserId, safePageId);

    let instance = page.components.get(COUNTER_COMPONENT_ID) as DemoCounter | undefined;
    if (instance) return instance;

    instance = new DemoCounter();
    (instance as any).$id = COUNTER_COMPONENT_ID;
    (instance as any).$wire_instance = wire;
    await instance.mount();

    page.components.set(COUNTER_COMPONENT_ID, instance as any);
    return instance;
}

async function renderCounterRoot(userId: string, pageId: string) {
    const instance = await ensureDemoComponent(userId, pageId);
    const state = instance.getPublicState();
    const stateAttr = JSON.stringify(state).replace(/'/g, "&#39;");
    const inner = String(await instance.render());

    return `<div wire:id="${COUNTER_COMPONENT_ID}" wire:state='${stateAttr}'>${inner}</div>`;
}

function buildHtmlPage(pageId: string, rootHtml: string) {
    const scriptConfig = {
        pageId,
        url: WIRE_ROUTE,
        uploadUrl: `${WIRE_ROUTE}/upload`,
        transport: "fivem",
        busDelay: 40,
    };

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="kirewire:page-id" content="${escapeHtmlAttr(pageId)}" />
    <meta name="kirewire:url" content="${WIRE_ROUTE}" />
    <meta name="kirewire:upload-url" content="${WIRE_ROUTE}/upload" />
    <meta name="kirewire:transport" content="fivem" />
    <meta name="kirewire:bus-delay" content="40" />
    <title>KireWire FiveM Example</title>
    <style>
        :root {
            color-scheme: dark;
        }
        html,
        body {
            width: 100%;
            min-height: 100%;
            background: transparent !important;
            background-color: transparent !important;
        }
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", Tahoma, sans-serif;
            display: grid;
            place-items: center;
            color: #e9f1ff;
            overflow: hidden;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity .12s ease;
        }
        body.nui-visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }
        body.nui-hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }
        #kirewire-nui-root {
            pointer-events: auto;
        }
        .panel {
            width: min(92vw, 500px);
            border: 1px solid rgba(153, 175, 214, 0.24);
            background: rgba(11, 15, 26, 0.72);
            border-radius: 16px;
            padding: 22px;
            box-shadow: 0 22px 80px rgba(0, 0, 0, 0.35);
            pointer-events: auto;
        }
        h1 {
            margin: 0 0 10px;
            font-size: 1.15rem;
            letter-spacing: 0.02em;
        }
        .count {
            margin: 0;
            color: rgba(235, 242, 255, 0.88);
        }
        .actions {
            margin-top: 16px;
            display: flex;
            gap: 10px;
        }
        button {
            border: 0;
            border-radius: 10px;
            padding: 10px 14px;
            font-weight: 700;
            cursor: pointer;
            background: #1d293e;
            color: #f4f8ff;
            transition: transform .08s ease, background-color .18s ease;
        }
        button:hover {
            background: #273a5d;
        }
        button:active {
            transform: translateY(1px);
        }
    </style>
    <script type="module" src="${WIRE_ROUTE}/kirewire.js"></script>
    <script type="module">
        window.__WIRE_INITIAL_CONFIG__ = Object.assign({}, window.__WIRE_INITIAL_CONFIG__ || {}, ${JSON.stringify(scriptConfig)});
        let attempts = 0;
        const start = () => {
            if (window.Kirewire && window.Alpine) {
                if (window.Kirewire.configure) {
                    window.Kirewire.configure(window.__WIRE_INITIAL_CONFIG__);
                }
                window.Kirewire.start(window.Alpine);
                return;
            }
            attempts += 1;
            setTimeout(start, Math.min(220, 20 + attempts * 8));
        };
        start();
    </script>
</head>
<body class="nui-hidden">
    <div id="kirewire-nui-root">${rootHtml}</div>
    <script>
        (() => {
            const setVisible = (visible) => {
                const isVisible = Boolean(visible);
                document.body.classList.toggle("nui-visible", isVisible);
                document.body.classList.toggle("nui-hidden", !isVisible);
            };

            window.addEventListener("message", (event) => {
                const data = event && event.data;
                if (!data || typeof data !== "object") return;
                if (data.__kirewire_ui !== true) return;
                setVisible(Boolean(data.visible));
            });

            setVisible(false);
        })();
    </script>
</body>
</html>`;
}

function escapeHtmlAttr(value: string) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function emitToClient(eventName: string, target: string, payload: any) {
    if (typeof emitNet === "function") {
        emitNet(eventName, target, payload);
        return;
    }
    if (typeof TriggerClientEvent === "function") {
        TriggerClientEvent(eventName, target, payload);
    }
}

function resolveHttpUserId(ctx: Koa.Context) {
    const queryUserId = String(ctx.query.userId || "").trim();
    if (queryUserId) return queryUserId;

    const headerUserId = String(
        ctx.get("x-cfx-source") ||
        ctx.get("x-citizenfx-source") ||
        ctx.get("x-source") ||
        "",
    ).trim();

    return headerUserId || "guest";
}

function resolvePageId(payload: any): string {
    const batch = Array.isArray(payload?.batch) ? payload.batch : [];
    const candidate = String(
        payload?.pageId ||
        batch[0]?.pageId ||
        PAGE_ID_DEFAULT,
    ).trim();
    return candidate || PAGE_ID_DEFAULT;
}

function parseRequestBody(ctx: Koa.Context) {
    const method = String(ctx.method || "GET").toUpperCase();
    if (method === "GET" || method === "HEAD") {
        return undefined;
    }

    const request = ctx.req as any;
    const rawBody = typeof request?.rawBody === "string" ? request.rawBody : "";
    if (!rawBody) return undefined;

    const contentType = String(ctx.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(rawBody);
        } catch {
            return undefined;
        }
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
        const search = new URLSearchParams(rawBody);
        const out: Record<string, string> = {};
        for (const [key, value] of search.entries()) {
            out[key] = value;
        }
        return out;
    }

    return rawBody;
}

function applyAdapterResult(ctx: Koa.Context, result: any) {
    ctx.status = Number(result?.status || 200);

    const headers = result?.headers;
    if (headers && typeof headers === "object") {
        const entries = Object.entries(headers);
        for (let i = 0; i < entries.length; i++) {
            const [name, value] = entries[i]!;
            if (value === undefined || value === null) continue;
            ctx.set(name, String(value));
        }
    }

    const payload = result?.result;
    if (payload === undefined || payload === null) {
        ctx.body = "";
        return;
    }

    if (typeof (Readable as any).fromWeb === "function" && payload instanceof ReadableStream) {
        ctx.body = (Readable as any).fromWeb(payload);
        return;
    }

    ctx.body = payload;
}

const app = new Koa();
const router = new Router();

async function renderExamplePage(ctx: Koa.Context) {
    const userId = resolveHttpUserId(ctx);
    const pageId = String(ctx.query.pageId || PAGE_ID_DEFAULT).trim() || PAGE_ID_DEFAULT;
    const rootHtml = await renderCounterRoot(userId, pageId);

    ctx.status = 200;
    ctx.type = "text/html; charset=utf-8";
    ctx.body = buildHtmlPage(pageId, rootHtml);
}

router.get(["/", "/index.html", ROUTE_BASE, `${ROUTE_BASE}/`], renderExamplePage);

router.get(`${WIRE_ROUTE}/kirewire.js`, (ctx) => {
    if (!existsSync(LOCAL_KIREWIRE_CLIENT)) {
        ctx.status = 500;
        ctx.type = "application/json; charset=utf-8";
        ctx.body = {
            error: "Local wire client not found.",
            expected: LOCAL_KIREWIRE_CLIENT,
        };
        return;
    }

    ctx.status = 200;
    ctx.type = "text/javascript; charset=utf-8";
    ctx.set("Cache-Control", "no-store");
    ctx.body = readFileSync(LOCAL_KIREWIRE_CLIENT, "utf8");
});

router.all(/^\/_wire(?:\/.*)?$/, async (ctx) => {
    const userId = resolveHttpUserId(ctx);
    const sessionId = userId;
    const pageId = String(ctx.query.pageId || PAGE_ID_DEFAULT).trim() || PAGE_ID_DEFAULT;
    await ensureDemoComponent(userId, pageId);

    const url = `${ctx.protocol}://${ctx.host}${ctx.originalUrl}`;
    const result = await adapter.handleRequest({
        method: String(ctx.method || "GET").toUpperCase(),
        url,
        body: parseRequestBody(ctx),
    }, userId, sessionId);

    applyAdapterResult(ctx, result);
});

app.use(async (ctx, next) => {
    ctx.set("Cache-Control", "no-store");
    await next();
});
app.use(router.routes());
app.use(router.allowedMethods());
app.use((ctx) => {
    ctx.status = 404;
    ctx.type = "application/json; charset=utf-8";
    ctx.body = {
        error: "Route not found.",
        path: ctx.path,
    };
});

setHttpCallback(app.callback());

onNet(adapter.getInboundEventName(), async (packet: any) => {
    const sourceId = String(globalThis.source || "").trim();
    if (!sourceId) return;

    const payload = packet?.payload || {};
    const pageId = resolvePageId(payload);

    await ensureDemoComponent(sourceId, pageId);
    await adapter.onNetMessage(sourceId, packet);
});

console.log("[Kirewire][FiveM Example] Koa + router ready.");
console.log(`[Kirewire][FiveM Example] HTTP route: ${ROUTE_BASE}/`);
console.log(
    `[Kirewire][FiveM Example] Net events: ${adapter.getInboundEventName()} -> ${adapter.getOutboundEventName()}`,
);
