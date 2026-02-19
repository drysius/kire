import { registerWireHandler } from "../core/directives";

registerWireHandler("navigate", (el, { modifiers }, { Alpine }) => {
    if (el.tagName !== "A") return;

    const navigateTo = async (url: string) => {
        try {
            window.dispatchEvent(new CustomEvent("wire:navigate:start", { detail: { url } }));
            const response = await fetch(url, { headers: { "X-Wire-Navigate": "true" } });
            if (!response.ok) { window.location.href = url; return; }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            document.title = doc.title;
            document.body.innerHTML = doc.body.innerHTML;
            window.history.pushState({}, "", url);
            Alpine.initTree(document.body);

            if (!modifiers.includes("preserve-scroll")) window.scrollTo(0, 0);
            window.dispatchEvent(new CustomEvent("wire:navigate:end", { detail: { url } }));
            window.dispatchEvent(new CustomEvent("wire:navigated"));
        } catch (error) {
            window.location.href = url;
        }
    };

    el.addEventListener("click", (event) => {
        const href = el.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || el.getAttribute("target") === "_blank") return;
        const urlObj = new URL(href, window.location.href);
        if (urlObj.origin !== window.location.origin) return;

        event.preventDefault();
        navigateTo(href);
    });

    if (modifiers.includes("hover")) {
        el.addEventListener("mouseenter", () => fetch(el.getAttribute("href")!, { priority: 'low' }), { once: true });
    }
});
