type ModelElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function getStateValue(state: any, expression: string): any {
    if (!expression) return undefined;

    const parts = expression.split(".").map((part) => part.trim()).filter(Boolean);
    if (parts.length === 0) return undefined;

    let current = state;
    for (const part of parts) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[part];
    }
    return current;
}

function getModelExpression(el: ModelElement): string | null {
    const attrName = el
        .getAttributeNames()
        .find((name) => name === "wire:model" || name.startsWith("wire:model."));

    if (!attrName) return null;
    return (el.getAttribute(attrName) || "").trim();
}

function setModelElementValue(el: ModelElement, value: any) {
    if (el instanceof HTMLInputElement) {
        if (el.type === "file") return;

        if (el.type === "checkbox") {
            if (Array.isArray(value)) {
                const normalized = value.map((item) => String(item));
                el.checked = normalized.includes(el.value);
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
        const selected = new Set(value.map((item) => String(item)));
        for (const option of Array.from(el.options)) {
            option.selected = selected.has(option.value);
        }
        return;
    }

    const normalized = value == null ? "" : String(value);
    if ((el as any).value !== normalized) {
        (el as any).value = normalized;
    }
}

export function syncModelElements(root: HTMLElement, state: Record<string, any>) {
    const elements: ModelElement[] = [];

    if (
        root instanceof HTMLInputElement ||
        root instanceof HTMLTextAreaElement ||
        root instanceof HTMLSelectElement
    ) {
        elements.push(root);
    }

    elements.push(
        ...Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")),
    );

    for (const el of elements) {
        const expression = getModelExpression(el);
        if (!expression) continue;

        const nextValue = getStateValue(state, expression);
        if (nextValue === undefined) continue;

        setModelElementValue(el, nextValue);
    }
}

