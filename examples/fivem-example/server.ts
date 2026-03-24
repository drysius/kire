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
    (instance as any).$wire_scope_id = safeUserId;
    (instance as any).$wire_page_id = safePageId;
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
        .debug-hint {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 50;
            border: 1px solid rgba(153, 175, 214, 0.3);
            background: rgba(11, 15, 26, 0.82);
            color: rgba(228, 237, 255, 0.9);
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 12px;
            letter-spacing: 0.02em;
            pointer-events: none;
        }
        .debug-menu {
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 60;
            width: min(92vw, 320px);
            border: 1px solid rgba(153, 175, 214, 0.35);
            background: rgba(9, 13, 22, 0.92);
            border-radius: 14px;
            padding: 14px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
            pointer-events: auto;
        }
        .debug-menu[hidden] {
            display: none !important;
        }
        .debug-title {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .debug-subtitle {
            margin: 6px 0 0;
            color: rgba(228, 237, 255, 0.72);
            font-size: 12px;
        }
        .debug-status {
            margin-top: 12px;
            font-size: 12px;
            color: #b9caf1;
            min-height: 18px;
        }
        .debug-status.error {
            color: #ffb0b0;
        }
        .debug-badges {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .debug-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 4px 8px;
            font-size: 11px;
            background: #24334f;
            color: #ebf2ff;
        }
        .debug-badge.ok {
            background: #1f4733;
            color: #c9f2db;
        }
        .debug-actions {
            margin-top: 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .debug-actions button {
            width: 100%;
            padding: 8px 10px;
            font-size: 12px;
            border-radius: 8px;
        }
        .debug-close {
            grid-column: 1 / -1;
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
    <div class="debug-hint">M: abrir UI | H: menu debug</div>
    <aside id="kirewire-debug-menu" class="debug-menu" hidden>
        <h2 class="debug-title">KireWire Debug Menu</h2>
        <p class="debug-subtitle">Pressione <strong>H</strong> para abrir/fechar</p>
        <div id="kirewire-debug-status" class="debug-status">Menu pronto para teste.</div>
        <div class="debug-badges">
            <span id="kirewire-runtime-badge" class="debug-badge">runtime: checking...</span>
            <span id="kirewire-component-badge" class="debug-badge">component: checking...</span>
        </div>
        <div class="debug-actions">
            <button type="button" data-kirewire-action="increment">+ Increment</button>
            <button type="button" data-kirewire-action="decrement">- Decrement</button>
            <button type="button" data-kirewire-action="reset">Reset</button>
            <button type="button" data-kirewire-action="probe">Probe</button>
            <button type="button" class="debug-close" data-kirewire-action="close-menu">Fechar Menu (H)</button>
        </div>
    </aside>
    <script>
        (() => {
            const debugMenu = document.getElementById("kirewire-debug-menu");
            const debugStatus = document.getElementById("kirewire-debug-status");
            const runtimeBadge = document.getElementById("kirewire-runtime-badge");
            const componentBadge = document.getElementById("kirewire-component-badge");
            const componentSelector = '[wire\\\\:id="${COUNTER_COMPONENT_ID}"], [wire-id="${COUNTER_COMPONENT_ID}"]';
            let menuVisible = false;
            let uiVisible = false;

            const setVisible = (visible) => {
                uiVisible = Boolean(visible);
                document.body.classList.toggle("nui-visible", uiVisible);
                document.body.classList.toggle("nui-hidden", !uiVisible);
                if (!uiVisible) setMenuVisible(false);
            };

            const setStatus = (message, isError = false) => {
                if (!debugStatus) return;
                debugStatus.textContent = String(message || "");
                debugStatus.classList.toggle("error", Boolean(isError));
            };

            const findCounterRoot = () => {
                return document.querySelector(componentSelector);
            };

            const updateDiagnostics = () => {
                const hasRuntime = Boolean(window.Kirewire && typeof window.Kirewire.call === "function");
                const hasComponent = Boolean(findCounterRoot());

                if (runtimeBadge) {
                    runtimeBadge.textContent = hasRuntime ? "runtime: ok" : "runtime: missing";
                    runtimeBadge.classList.toggle("ok", hasRuntime);
                }

                if (componentBadge) {
                    componentBadge.textContent = hasComponent ? "component: ok" : "component: missing";
                    componentBadge.classList.toggle("ok", hasComponent);
                }
            };

            const setMenuVisible = (visible) => {
                menuVisible = Boolean(visible);
                if (debugMenu) debugMenu.hidden = !menuVisible;
                updateDiagnostics();
            };

            const callWireMethod = async (method) => {
                if (!uiVisible) {
                    setStatus("Abra a UI com M antes de testar.", true);
                    return;
                }

                const root = findCounterRoot();
                const runtime = window.Kirewire;
                if (!root || !runtime || typeof runtime.call !== "function") {
                    setStatus("Runtime/componente indisponivel.", true);
                    updateDiagnostics();
                    return;
                }

                try {
                    await runtime.call(root, method, []);
                    setStatus("Acao executada: " + method);
                } catch (error) {
                    const message = error && error.message ? error.message : String(error || "erro desconhecido");
                    setStatus("Falha na acao " + method + ": " + message, true);
                }

                updateDiagnostics();
            };

            const isTypingTarget = (target) => {
                if (!target || !(target instanceof Element)) return false;
                if (target instanceof HTMLInputElement) return true;
                if (target instanceof HTMLTextAreaElement) return true;
                if (target instanceof HTMLSelectElement) return true;
                return Boolean(target.closest("[contenteditable=''], [contenteditable='true']"));
            };

            window.addEventListener("message", (event) => {
                const data = event && event.data;
                if (!data || typeof data !== "object") return;
                if (data.__kirewire_ui === true) {
                    setVisible(Boolean(data.visible));
                    return;
                }
                if (data.__kirewire_menu === true) {
                    setMenuVisible(Boolean(data.visible));
                    return;
                }
                if (data.__kirewire_menu_toggle === true) {
                    setMenuVisible(!menuVisible);
                }
            });

            document.addEventListener("click", (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                const button = target.closest("[data-kirewire-action]");
                if (!(button instanceof HTMLElement)) return;

                const action = String(button.getAttribute("data-kirewire-action") || "").trim();
                if (!action) return;

                if (action === "close-menu") {
                    setMenuVisible(false);
                    setStatus("Menu fechado.");
                    return;
                }

                if (action === "probe") {
                    updateDiagnostics();
                    setStatus("Probe executado.");
                    return;
                }

                void callWireMethod(action);
            });

            window.addEventListener("keydown", (event) => {
                if (event.repeat) return;
                if (isTypingTarget(event.target)) return;

                const key = String(event.key || "").toLowerCase();
                if (key !== "h") return;

                event.preventDefault();
                setMenuVisible(!menuVisible);
                setStatus(menuVisible ? "Menu aberto." : "Menu fechado.");
            });

            setVisible(false);
            updateDiagnostics();
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
