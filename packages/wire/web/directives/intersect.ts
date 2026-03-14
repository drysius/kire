import { Kirewire } from "../kirewire";

type IntersectEdge = "top" | "bottom" | "left" | "right" | null;

function parseDurationToken(token: string): number | null {
    const match = String(token || "").trim().toLowerCase().match(/^(\d+)(ms|s|m)?$/);
    if (!match) return null;

    const value = Number(match[1] || 0);
    if (!Number.isFinite(value) || value < 0) return null;

    const unit = match[2] || "ms";
    if (unit === "s") return value * 1000;
    if (unit === "m") return value * 60_000;
    return value;
}

function parseTimedModifier(modifiers: string[], key: "throttle" | "debounce"): number {
    const index = modifiers.indexOf(key);
    if (index === -1) return 0;

    const parsed = parseDurationToken(modifiers[index + 1] || "");
    if (parsed !== null) return parsed;
    return 150;
}

function resolveEdge(modifiers: string[]): IntersectEdge {
    for (let i = 0; i < modifiers.length; i++) {
        const token = modifiers[i];
        if (token === "top") return "top";
        if (token === "bottom" || token === "down") return "bottom";
        if (token === "left") return "left";
        if (token === "right") return "right";
    }
    return null;
}

function matchesEdge(entry: IntersectionObserverEntry, edge: IntersectEdge) {
    if (!edge) return true;
    if (!entry.rootBounds) return true;

    const root = entry.rootBounds;
    const rect = entry.intersectionRect;
    const epsilon = 1;

    if (edge === "top") return rect.top <= root.top + epsilon;
    if (edge === "bottom") return rect.bottom >= root.bottom - epsilon;
    if (edge === "left") return rect.left <= root.left + epsilon;
    return rect.right >= root.right - epsilon;
}

Kirewire.directive("intersect", ({ el, expression, modifiers, cleanup, wire }) => {
    if (typeof IntersectionObserver === "undefined") return;

    const once = modifiers.includes("once");
    const edge = resolveEdge(modifiers);
    const throttleMs = parseTimedModifier(modifiers, "throttle");
    const debounceMs = parseTimedModifier(modifiers, "debounce");
    const action = (expression || "$refresh").trim();
    if (!action) return;

    let inFlight = false;
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let throttledUntil = 0;

    const cancel = () => {
        if (cancelled) return;
        cancelled = true;
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        observer?.disconnect();
        observer = null;
    };

    const ensureConnected = () => {
        if (cancelled) return false;
        if (!document.body || !document.body.contains(el)) {
            cancel();
            return false;
        }
        return true;
    };

    const trigger = async () => {
        if (!ensureConnected() || inFlight) return;
        inFlight = true;
        try {
            await wire.call(el, action);
            if (once && observer) observer.disconnect();
        } finally {
            inFlight = false;
        }
    };

    const scheduleTrigger = () => {
        if (!ensureConnected()) return;

        const now = Date.now();
        if (throttleMs > 0) {
            if (now < throttledUntil) return;
            throttledUntil = now + throttleMs;
        }

        if (debounceMs > 0) {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                void trigger();
            }, debounceMs);
            return;
        }

        void trigger();
    };

    observer = new IntersectionObserver((entries) => {
        if (!ensureConnected()) return;

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry?.isIntersecting) continue;
            if (!matchesEdge(entry, edge)) continue;

            scheduleTrigger();
            if (once) {
                break;
            }
        }
    });

    observer.observe(el);
    cleanup(cancel);
});
