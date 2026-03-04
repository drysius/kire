import { Kirewire } from "../kirewire";

type ModelElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function getEventType(el: ModelElement): string {
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) return "change";
    if (el instanceof HTMLSelectElement) return "change";
    return "input";
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

    const eventType = getEventType(el);
    const handler = () => {
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

    el.addEventListener(eventType, handler);
    cleanup(() => el.removeEventListener(eventType, handler));

    const off = wire.on("component:update", (data) => {
        if (data?.id !== componentId) return;
        const next = readStateByPath(data?.state, expression);
        if (next === undefined) return;
        syncElementValue(el, next);
    });
    cleanup(off);
});
