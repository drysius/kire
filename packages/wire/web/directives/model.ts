import { Kirewire } from "../kirewire";

type ModelElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isTextLikeModelElement(el: ModelElement): boolean {
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLSelectElement) return false;
    if (!(el instanceof HTMLInputElement)) return false;

    const type = String(el.type || "text").toLowerCase();
    if (type === "checkbox" || type === "radio" || type === "file") return false;
    return true;
}

function isElementActive(el: ModelElement): boolean {
    if (typeof document === "undefined") return false;
    return document.activeElement === el;
}

function getEventType(el: ModelElement, modifiers: string[]): string {
    if ((modifiers.includes("blur") || modifiers.includes("lazy")) && isTextLikeModelElement(el)) {
        return "blur";
    }
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) return "change";
    if (el instanceof HTMLSelectElement) return "change";
    return "input";
}

function parseDebounce(modifiers: string[]): number {
    const index = modifiers.indexOf("debounce");
    if (index === -1) return 0;

    const next = String(modifiers[index + 1] || "").trim().toLowerCase();
    if (!next) return 150;

    const match = next.match(/^(\d+)(ms|s)?$/);
    if (!match) return 150;

    const value = Number(match[1] || 0);
    if (!Number.isFinite(value) || value < 0) return 150;

    const unit = match[2] || "ms";
    if (unit === "s") return value * 1000;
    return value;
}

function readInputValue(el: ModelElement): any {
    if (el instanceof HTMLInputElement) {
        if (el.type === "checkbox") return el.checked;
        if (el.type === "radio") return el.checked ? el.value : undefined;
    }

    if (el instanceof HTMLSelectElement && el.multiple) {
        const values: string[] = [];
        for (let i = 0; i < el.options.length; i++) {
            const option = el.options[i]!;
            if (option.selected) values.push(option.value);
        }
        return values;
    }

    return (el as any).value;
}

function readStateByPath(state: any, path: string): any {
    if (!state || !path) return undefined;
    const parts = path.split(".").map((part) => part.trim()).filter(Boolean);
    let current = state;

    for (let i = 0; i < parts.length; i++) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[parts[i]!];
    }

    return current;
}

function syncElementValue(el: ModelElement, value: any) {
    if (el instanceof HTMLInputElement) {
        if (el.type === "checkbox") {
            if (Array.isArray(value)) {
                const set = new Set(value.map((entry) => String(entry)));
                el.checked = set.has(el.value);
            } else {
                el.checked = !!value;
            }
            return;
        }

        if (el.type === "radio") {
            el.checked = String(value ?? "") === el.value;
            return;
        }
    }

    if (el instanceof HTMLSelectElement && el.multiple && Array.isArray(value)) {
        const selected = new Set(value.map((entry) => String(entry)));
        for (let i = 0; i < el.options.length; i++) {
            const option = el.options[i]!;
            option.selected = selected.has(option.value);
        }
        return;
    }

    const normalized = value == null ? "" : String(value);
    if ((el as any).value !== normalized) {
        (el as any).value = normalized;
    }
}

Kirewire.directive("model", ({ el, expression, modifiers, cleanup, wire, componentId }) => {
    if (el instanceof HTMLInputElement && el.type === "file") return;

    const isModelElement =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (!isModelElement) return;

    const eventType = getEventType(el, modifiers);
    const debounceMs = parseDebounce(modifiers);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const commit = () => {
        const value = readInputValue(el);
        if (value === undefined && el instanceof HTMLInputElement && el.type === "radio") {
            return;
        }

        if (modifiers.includes("defer")) {
            wire.defer(componentId, expression, value);
        } else {
            wire.call(el, "$set", [expression, value]);
        }
    };

    const handler = () => {
        if (debounceMs <= 0) {
            commit();
            return;
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            commit();
        }, debounceMs);
    };

    el.addEventListener(eventType, handler);
    cleanup(() => {
        el.removeEventListener(eventType, handler);
        if (debounceTimer) clearTimeout(debounceTimer);
    });

    const off = wire.on("component:update", (data) => {
        if (data?.id !== componentId) return;
        const next = readStateByPath(data?.state, expression);
        if (next === undefined) return;

        // Avoid clobbering in-progress typing/caret position on focused text fields.
        if (isTextLikeModelElement(el) && isElementActive(el)) return;

        syncElementValue(el, next);
    });
    cleanup(off);
});
