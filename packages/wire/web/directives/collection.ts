import { Kirewire } from "../kirewire";

function pathParts(path: string): string[] {
    return String(path || "")
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean);
}

function readPathValue(source: any, path: string): any {
    if (!source) return undefined;
    const parts = pathParts(path);
    if (parts.length === 0) return source;

    let current = source;
    for (let i = 0; i < parts.length; i++) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[parts[i]!];
    }
    return current;
}

function isEmptyValue(value: any): boolean {
    if (Array.isArray(value)) return value.length === 0;
    if (value && typeof value === "object") return Object.keys(value).length === 0;
    return !value;
}

function selectorValue(value: string) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function findCollectionTarget(scope: ParentNode, name: string): HTMLElement | null {
    const selector = `[wire\\:collection="${selectorValue(name)}"]`;

    if (scope instanceof HTMLElement && scope.matches(selector)) return scope;

    const direct = scope.querySelector(selector) as HTMLElement | null;
    if (direct) return direct;

    const nodes = scope instanceof HTMLElement ? scope.querySelectorAll("*") : document.querySelectorAll("*");
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as HTMLElement;
        if (!node || typeof node.getAttribute !== "function") continue;
        if (node.getAttribute("wire:collection") === name) return node;
    }

    return null;
}

Kirewire.directive("collection", ({ el, expression, modifiers, componentId, wire, cleanup }) => {
    if (!modifiers.includes("empty")) return;

    const targetName = String(expression || "").trim();
    if (!targetName) return;

    const initialDisplay = el.style.display;

    const setVisible = (visible: boolean) => {
        if (visible) {
            if (initialDisplay) el.style.display = initialDisplay;
            else el.style.removeProperty("display");
            return;
        }
        el.style.display = "none";
    };

    const evaluate = (incomingState?: any) => {
        const proxy = wire.components.get(componentId) as any;
        const proxyTarget =
            proxy && proxy.__target && typeof proxy.__target === "object"
                ? (proxy.__target as Record<string, any>)
                : undefined;

        const state = incomingState && typeof incomingState === "object"
            ? incomingState
            : wire.getComponentState(el);

        const fromProxy = readPathValue(proxyTarget, targetName);
        const fromState = readPathValue(state, targetName);
        const resolved = fromProxy !== undefined ? fromProxy : fromState;

        if (resolved !== undefined) {
            setVisible(isEmptyValue(resolved));
            return;
        }

        const scope = (el.closest("[wire\\:id], [wire-id]") as HTMLElement | null) || document;
        const target = findCollectionTarget(scope, targetName);
        if (!target || target === el) {
            setVisible(true);
            return;
        }

        if (typeof HTMLTemplateElement !== "undefined" && target instanceof HTMLTemplateElement) {
            setVisible(true);
            return;
        }

        const hasChildren = target.children.length > 0;
        const hasText = String(target.textContent || "").trim().length > 0;
        setVisible(!(hasChildren || hasText));
    };

    const offUpdate = wire.$on("component:update", (data: any) => {
        if (data?.id !== componentId) return;
        evaluate(data?.state);
    });

    const offCollection = wire.$on("collection:update", (data: any) => {
        if (data?.componentId !== componentId) return;
        evaluate();
    });

    cleanup(offUpdate);
    cleanup(offCollection);

    evaluate();
});
