import { Kirewire } from "../kirewire";
import { morphDom } from "../utils/morph";

type NavigateOptions = {
    replace?: boolean;
    force?: boolean;
    reason?: string;
    fromPopstate?: boolean;
    restoreScroll?: { x: number; y: number } | null;
};

type NavigateState = {
    __kirewireNavigate: true;
    url: string;
    scrollX: number;
    scrollY: number;
};

const CONFIG_META_NAMES = [
    "kirewire:page-id",
    "kirewire:url",
    "kirewire:upload-url",
    "kirewire:preview-url",
    "kirewire:transport",
    "kirewire:bus-delay",
];

const NAVIGATE_PROGRESS_ID = "kirewire-navigate-progress";
const NAVIGATE_BOOT_KEY = "__kirewire_navigate_booted";
const NAVIGATE_SCRIPT_CACHE_KEY = "__kirewire_navigate_script_cache";
const NAVIGATE_HEADER = "X-Kirewire-Navigate";

let activeNavigationId = 0;
let activeController: AbortController | null = null;
let progressTimer: any = null;
let scrollPersistTimer: any = null;

function getScriptCache(): Set<string> {
    const globalObj = window as any;
    if (!(globalObj[NAVIGATE_SCRIPT_CACHE_KEY] instanceof Set)) {
        globalObj[NAVIGATE_SCRIPT_CACHE_KEY] = new Set<string>();
    }
    return globalObj[NAVIGATE_SCRIPT_CACHE_KEY] as Set<string>;
}

function normalizeScriptKey(script: HTMLScriptElement, baseUrl: string = window.location.href): string {
    const type = String(script.getAttribute("type") || "text/javascript").trim().toLowerCase();
    const src = String(script.getAttribute("src") || "").trim();
    if (src) {
        return `src:${new URL(src, baseUrl).toString()}|type:${type}`;
    }
    const content = String(script.textContent || "").trim();
    return `inline:${type}:${content}`;
}

function isExecutableScript(script: HTMLScriptElement) {
    if (script.hasAttribute("data-kirewire-skip")) return false;
    const type = String(script.getAttribute("type") || "text/javascript").trim().toLowerCase();
    return (
        type === "" ||
        type === "text/javascript" ||
        type === "application/javascript" ||
        type === "module"
    );
}

function cloneExecutableScript(script: HTMLScriptElement) {
    const next = document.createElement("script");
    const attrs = script.getAttributeNames();
    for (let i = 0; i < attrs.length; i++) {
        const name = attrs[i]!;
        const value = script.getAttribute(name);
        if (value === null) continue;
        next.setAttribute(name, value);
    }
    // Preserve browser execution semantics for dynamically injected scripts.
    next.async = script.async;
    next.textContent = script.textContent || "";
    return next;
}

function collectExecutableScripts(root: ParentNode = document): HTMLScriptElement[] {
    const nodes = root.querySelectorAll("script");
    const scripts: HTMLScriptElement[] = [];
    for (let i = 0; i < nodes.length; i++) {
        const script = nodes[i] as HTMLScriptElement;
        if (!isExecutableScript(script)) continue;
        scripts.push(script);
    }
    return scripts;
}

function shouldCacheScript(_script: HTMLScriptElement) {
    return _script.hasAttribute("src")
        || _script.hasAttribute("data-kirewire-once")
        || _script.hasAttribute("data-navigate-once");
}

function seedExecutedScripts(root: ParentNode = document, baseUrl: string = window.location.href) {
    const cache = getScriptCache();
    const scripts = collectExecutableScripts(root);
    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i]!;
        if (!shouldCacheScript(script)) continue;
        const key = normalizeScriptKey(script, baseUrl);
        if (!key) continue;
        cache.add(key);
    }
}

function hydrateScripts(sourceRoot: ParentNode = document.body, baseUrl: string = window.location.href) {
    const cache = getScriptCache();
    const scripts = collectExecutableScripts(sourceRoot);

    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i]!;
        const cacheable = shouldCacheScript(script);
        const key = cacheable ? normalizeScriptKey(script, baseUrl) : "";

        const forceReload = script.hasAttribute("data-kirewire-reload");
        if (cacheable && !key) continue;
        if (cacheable && !forceReload && cache.has(key)) continue;

        if (cacheable && !forceReload) cache.add(key);

        const next = cloneExecutableScript(script);
        const src = next.getAttribute("src");
        if (src) {
            next.setAttribute("src", new URL(src, baseUrl).toString());
        }
        const mount = document.body || document.documentElement;
        mount.appendChild(next);
        if (!src) {
            next.remove();
        } else if (forceReload) {
            next.addEventListener("load", () => next.remove(), { once: true });
            next.addEventListener("error", () => next.remove(), { once: true });
        }
    }
}

function createState(url: string, scrollX: number, scrollY: number): NavigateState {
    return {
        __kirewireNavigate: true,
        url,
        scrollX,
        scrollY,
    };
}

function readState(value: any): NavigateState | null {
    if (!value || value.__kirewireNavigate !== true) return null;
    return {
        __kirewireNavigate: true,
        url: String(value.url || window.location.href),
        scrollX: Number(value.scrollX || 0),
        scrollY: Number(value.scrollY || 0),
    };
}

function ensureHistoryState() {
    const current = readState(window.history.state);
    if (!current) {
        window.history.replaceState(
            createState(window.location.href, window.scrollX, window.scrollY),
            "",
            window.location.href,
        );
        return;
    }

    if (current.url !== window.location.href) {
        window.history.replaceState(
            createState(window.location.href, window.scrollX, window.scrollY),
            "",
            window.location.href,
        );
    }
}

function persistCurrentScrollPosition() {
    const current = readState(window.history.state);
    const state = current || createState(window.location.href, 0, 0);
    state.scrollX = window.scrollX;
    state.scrollY = window.scrollY;
    state.url = window.location.href;
    window.history.replaceState(state, "", window.location.href);
}

function parseNavigateModifiers(anchor: HTMLAnchorElement): { replace: boolean } {
    const attrs = anchor.getAttributeNames();
    let replace = false;

    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i]!;
        if (!attr.startsWith("wire:navigate")) continue;
        const parts = attr.split(".");
        for (let j = 1; j < parts.length; j++) {
            if (parts[j] === "replace") replace = true;
        }
    }

    return { replace };
}

function isNavigateAnchor(anchor: HTMLAnchorElement): boolean {
    const attrs = anchor.getAttributeNames();
    for (let i = 0; i < attrs.length; i++) {
        if (attrs[i]!.startsWith("wire:navigate")) return true;
    }
    return false;
}

function isSamePageHashNavigation(targetUrl: URL): boolean {
    return (
        targetUrl.origin === window.location.origin &&
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash !== ""
    );
}

function shouldHandleNavigateClick(event: MouseEvent, anchor: HTMLAnchorElement, targetUrl: URL): boolean {
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;
    if (targetUrl.origin !== window.location.origin) return false;
    if (isSamePageHashNavigation(targetUrl)) return false;
    return true;
}

function getNavigateProgressElement() {
    let el = document.getElementById(NAVIGATE_PROGRESS_ID) as HTMLDivElement | null;
    if (el) return el;

    el = document.createElement("div");
    el.id = NAVIGATE_PROGRESS_ID;
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.left = "0";
    el.style.top = "0";
    el.style.height = "3px";
    el.style.width = "0%";
    el.style.opacity = "0";
    el.style.zIndex = "2147483647";
    el.style.pointerEvents = "none";
    el.style.background = "linear-gradient(90deg, #14b8a6 0%, #22d3ee 100%)";
    el.style.boxShadow = "0 0 12px rgba(20, 184, 166, 0.6)";
    el.style.transition = "width 160ms linear, opacity 180ms ease";
    document.body.appendChild(el);
    return el;
}

function startProgress() {
    const el = getNavigateProgressElement();
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
    el.style.opacity = "1";
    el.style.width = "0%";
    requestAnimationFrame(() => {
        el.style.width = "18%";
    });

    progressTimer = setInterval(() => {
        const raw = Number.parseFloat(el.style.width || "0");
        const current = Number.isFinite(raw) ? raw : 0;
        const next = Math.min(90, current + Math.max(1.5, (90 - current) * 0.18));
        el.style.width = `${next}%`;
    }, 140);
}

function finishProgress() {
    const el = getNavigateProgressElement();
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
    el.style.width = "100%";
    setTimeout(() => {
        el.style.opacity = "0";
        el.style.width = "0%";
    }, 170);
}

function extractMetaContent(doc: Document, name: string): string | undefined {
    const node = doc.querySelector(`meta[name="${name}"]`);
    const value = node?.getAttribute("content");
    return value === null || value === undefined || value === "" ? undefined : value;
}

function extractConfigFromDocument(doc: Document) {
    const busDelayRaw = extractMetaContent(doc, "kirewire:bus-delay");
    const parsedBusDelay = busDelayRaw === undefined ? undefined : Number(busDelayRaw);

    return {
        pageId: extractMetaContent(doc, "kirewire:page-id"),
        url: extractMetaContent(doc, "kirewire:url"),
        uploadUrl: extractMetaContent(doc, "kirewire:upload-url"),
        previewUrl: extractMetaContent(doc, "kirewire:preview-url"),
        transport: extractMetaContent(doc, "kirewire:transport"),
        busDelay: Number.isFinite(parsedBusDelay) ? parsedBusDelay : undefined,
    };
}

function syncConfigMetaTags(doc: Document) {
    const head = document.head;
    if (!head) return;

    for (let i = 0; i < CONFIG_META_NAMES.length; i++) {
        const name = CONFIG_META_NAMES[i]!;
        const selector = `meta[name="${name}"]`;
        const incoming = doc.querySelector(selector);
        const current = head.querySelector(selector);

        if (incoming && current) {
            current.setAttribute("content", incoming.getAttribute("content") || "");
            continue;
        }
        if (!incoming && current) {
            current.remove();
            continue;
        }
        if (incoming && !current) {
            head.appendChild(incoming.cloneNode(true));
        }
    }
}

function applyDocument(doc: Document, targetHref: string) {
    if (doc.title) {
        document.title = doc.title;
    }

    syncConfigMetaTags(doc);

    const nextBody = doc.body;
    if (!nextBody) return;

    Kirewire.cleanupTree(document.body);
    Kirewire.resetClientState();

    const Alpine = (window as any).Alpine;
    if (document.body && nextBody) {
        morphDom(document.body, nextBody);
    } else {
        document.body.replaceWith(nextBody);
    }

    if (Alpine && typeof Alpine.initTree === "function") {
        Alpine.initTree(document.body);
    }
    Kirewire.hydrateTree(document.body);

    hydrateScripts(nextBody, targetHref);

    document.dispatchEvent(new CustomEvent("kirewire:navigated", {
        detail: { url: window.location.href },
    }));
}

function normalizeUrl(input: string): URL {
    return new URL(input, window.location.href);
}

async function navigateTo(rawUrl: string, options: NavigateOptions = {}) {
    const targetUrl = normalizeUrl(rawUrl);

    if (targetUrl.origin !== window.location.origin) {
        window.location.href = targetUrl.toString();
        return;
    }

    const targetHref = targetUrl.toString();
    if (!options.force && targetHref === window.location.href) return;

    const navigationId = ++activeNavigationId;
    if (activeController) {
        try { activeController.abort(); } catch {}
        activeController = null;
    }

    const controller = new AbortController();
    activeController = controller;

    if (!options.fromPopstate) {
        persistCurrentScrollPosition();
    }

    Kirewire.beginNavigation();
    startProgress();
    document.dispatchEvent(new CustomEvent("kirewire:navigate:start", {
        detail: {
            from: window.location.href,
            to: targetHref,
            reason: options.reason || "navigate",
        },
    }));

    try {
        const response = await fetch(targetHref, {
            method: "GET",
            headers: {
                Accept: "text/html,application/xhtml+xml",
                [NAVIGATE_HEADER]: "1",
            },
            credentials: "same-origin",
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Navigation request failed (${response.status})`);
        }

        const html = await response.text();
        if (navigationId !== activeNavigationId) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const nextConfig = extractConfigFromDocument(doc);
        Kirewire.configure(nextConfig);
        applyDocument(doc, targetHref);

        const state = createState(targetHref, 0, 0);
        if (!options.fromPopstate) {
            if (options.replace) window.history.replaceState(state, "", targetHref);
            else window.history.pushState(state, "", targetHref);
        }

        if (options.restoreScroll) {
            window.scrollTo(options.restoreScroll.x, options.restoreScroll.y);
        } else if (targetUrl.hash) {
            const id = targetUrl.hash.slice(1);
            const anchor = id ? document.getElementById(id) : null;
            if (anchor) anchor.scrollIntoView();
            else window.scrollTo(0, 0);
        } else {
            window.scrollTo(0, 0);
        }
    } catch (error: any) {
        if (error?.name === "AbortError") {
            document.dispatchEvent(new CustomEvent("kirewire:navigate:abort", {
                detail: { to: targetHref, reason: options.reason || "navigate" },
            }));
            return;
        }
        document.dispatchEvent(new CustomEvent("kirewire:navigate:error", {
            detail: {
                to: targetHref,
                reason: options.reason || "navigate",
                message: String(error?.message || error || "Navigation failed"),
            },
        }));
        window.location.href = targetHref;
    } finally {
        if (navigationId === activeNavigationId) {
            activeController = null;
            finishProgress();
            Kirewire.endNavigation();
            document.dispatchEvent(new CustomEvent("kirewire:navigate:finish", {
                detail: { to: targetHref, reason: options.reason || "navigate" },
            }));
        }
    }
}

function onDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!isNavigateAnchor(anchor)) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    const targetUrl = normalizeUrl(href);
    if (!shouldHandleNavigateClick(event, anchor, targetUrl)) return;

    event.preventDefault();

    const modifiers = parseNavigateModifiers(anchor);
    void navigateTo(targetUrl.toString(), {
        replace: modifiers.replace,
        reason: "link",
    });
}

function onPopState(event: PopStateEvent) {
    const state = readState(event.state);
    void navigateTo(window.location.href, {
        replace: true,
        force: true,
        reason: "popstate",
        fromPopstate: true,
        restoreScroll: state ? { x: state.scrollX, y: state.scrollY } : null,
    });
}

function setupScrollPersistence() {
    window.addEventListener("scroll", () => {
        if (scrollPersistTimer) clearTimeout(scrollPersistTimer);
        scrollPersistTimer = setTimeout(() => {
            persistCurrentScrollPosition();
        }, 120);
    }, { passive: true });

    window.addEventListener("pagehide", () => {
        persistCurrentScrollPosition();
    });
}

function bootNavigate() {
    const globalObj = window as any;
    if (globalObj[NAVIGATE_BOOT_KEY]) return;
    globalObj[NAVIGATE_BOOT_KEY] = true;

    ensureHistoryState();
    seedExecutedScripts(document.body || document);
    setupScrollPersistence();

    document.addEventListener("click", onDocumentClick);
    window.addEventListener("popstate", onPopState);

    window.KirewireNavigate = {
        navigateTo: (url: string, options?: { replace?: boolean; force?: boolean; reason?: string }) =>
            navigateTo(url, options || {}),
        refreshCurrentPage: (options?: { replace?: boolean; force?: boolean; reason?: string }) =>
            navigateTo(window.location.href, {
                replace: options?.replace ?? true,
                force: options?.force ?? true,
                reason: options?.reason || "refresh",
            }),
    };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
    bootNavigate();
}
