import { clearComponents } from "../store";
import { registerWireHandler } from "../core/directives";

let popstateBound = false;

function normalizeUrl(input: string) {
    return new URL(input, window.location.href).toString();
}

async function navigateTo(
    url: string,
    Alpine: any,
    options: { preserveScroll?: boolean; historyMode?: "push" | "replace" } = {}
) {
    const target = normalizeUrl(url);
    try {
        window.dispatchEvent(new CustomEvent("wire:navigate:start", { detail: { url: target } }));
        const response = await fetch(target, { headers: { "X-Wire-Navigate": "true" } });
        if (!response.ok) {
            window.location.href = target;
            return;
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        clearComponents();
        document.title = doc.title;
        document.body.innerHTML = doc.body.innerHTML;
        if (options.historyMode === "replace") {
            window.history.replaceState({}, "", target);
        } else {
            window.history.pushState({}, "", target);
        }
        Alpine.initTree(document.body);

        if (!options.preserveScroll) window.scrollTo(0, 0);
        window.dispatchEvent(new CustomEvent("wire:navigate:end", { detail: { url: target } }));
        window.dispatchEvent(new CustomEvent("wire:navigated", { detail: { url: target } }));
    } catch {
        window.location.href = target;
    }
}

registerWireHandler("navigate", (el, { modifiers }, { Alpine }) => {
    if (el.tagName !== "A") return;
    if ((el as any).__wire_navigate_bound) return;
    (el as any).__wire_navigate_bound = true;

    if (!popstateBound) {
        popstateBound = true;
        window.addEventListener("popstate", () => {
            navigateTo(window.location.href, Alpine, {
                preserveScroll: true,
                historyMode: "replace"
            });
        });
    }

    const preserveScroll = modifiers.includes("preserve-scroll");

    el.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const href = el.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || el.getAttribute("target") === "_blank") return;
        const urlObj = new URL(href, window.location.href);
        if (urlObj.origin !== window.location.origin) return;

        event.preventDefault();
        navigateTo(urlObj.toString(), Alpine, { preserveScroll, historyMode: "push" });
    });

    if (modifiers.includes("hover")) {
        el.addEventListener("mouseenter", () => {
            const href = el.getAttribute("href");
            if (!href) return;
            fetch(new URL(href, window.location.href).toString()).catch(() => {});
        }, { once: true });
    }
});
