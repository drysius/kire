
import { directive } from "../core/registry";

directive("current", (el, dir) => {
    const expression = dir.value;
    const modifiers = dir.modifiers;
    const options = {
        exact: modifiers.includes("exact"),
        strict: modifiers.includes("strict"),
    };

    if (!el.hasAttribute("href")) return;

    const href = el.getAttribute("href")!;
    const hrefUrl = new URL(href, window.location.href);
    const classes = expression.split(" ").filter(Boolean);

    const update = () => {
        const currentUrl = new URL(window.location.href);
        if (pathMatches(hrefUrl, currentUrl, options)) {
            if (classes.length) el.classList.add(...classes);
            el.setAttribute("data-current", "");
            el.setAttribute("aria-current", "page");
        } else {
            if (classes.length) el.classList.remove(...classes);
            el.removeAttribute("data-current");
            el.removeAttribute("aria-current");
        }
    };

    update();

    // Listen for navigation events
    window.addEventListener("popstate", update);
    window.addEventListener("kirewire:navigated", update);
});

function pathMatches(hrefUrl: URL, currentUrl: URL, options: { exact: boolean; strict: boolean }) {
    if (hrefUrl.hostname !== currentUrl.hostname) return false;

    let hrefPath = options.strict ? hrefUrl.pathname : hrefUrl.pathname.replace(/\/+$/, "");
    let currentPath = options.strict ? currentUrl.pathname : currentUrl.pathname.replace(/\/+$/, "");

    if (options.exact) {
        return hrefPath === currentPath;
    }

    // Default: Check if current path starts with href path (active parent)
    // But handle segment boundaries
    if (currentPath === hrefPath) return true;
    
    return currentPath.startsWith(hrefPath + "/");
}
