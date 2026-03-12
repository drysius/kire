import { Kirewire } from "../kirewire";

function parseTargets(raw: string): string[] {
    return String(raw || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => normalizeAction(item));
}

function normalizeAction(value: string): string {
    const source = String(value || "").trim();
    if (!source) return "";

    if (source.startsWith("$set")) return "$set";
    const match = source.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (match?.[1]) return match[1];
    return source;
}

Kirewire.directive("loading", ({ el, expression, modifiers, wire, cleanup }) => {
    const componentId = wire.getComponentId(el);
    if (!componentId) return;

    const targetExpression = el.getAttribute("wire:target") || "";
    const targets = parseTargets(targetExpression);
    const removeMode = modifiers.includes("remove");
    const classMode = modifiers.includes("class");
    const attrMode = modifiers.includes("attr");

    const className = String(expression || "").trim() || "wire-loading";
    const attrName = String(expression || "").trim() || "disabled";
    const initialDisplay = el.style.display;

    const setVisible = (visible: boolean) => {
        if (visible) {
            if (initialDisplay) el.style.display = initialDisplay;
            else el.style.removeProperty("display");
            return;
        }
        el.style.display = "none";
    };

    const applyState = (isLoading: boolean) => {
        if (classMode) {
            if (removeMode) {
                if (isLoading) el.classList.remove(className);
                else el.classList.add(className);
            } else if (isLoading) {
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
            return;
        }

        if (attrMode) {
            if (removeMode) {
                if (isLoading) el.removeAttribute(attrName);
                else el.setAttribute(attrName, "true");
            } else if (isLoading) {
                el.setAttribute(attrName, "true");
            } else {
                el.removeAttribute(attrName);
            }
            return;
        }

        const shouldShow = removeMode ? !isLoading : isLoading;
        setVisible(shouldShow);
    };

    // Default behavior keeps loading indicators hidden until a call starts.
    applyState(false);

    const matchesCall = (data: any) => {
        if (!data || data.id !== componentId) return false;
        if (targets.length === 0) return true;

        const method = normalizeAction(String(data.method || ""));
        const setTarget = method === "$set" ? String(data?.params?.[0] || "").trim() : "";

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i]!;
            if (!target) continue;
            if (target === method || (setTarget && target === setTarget)) return true;
        }
        return false;
    };

    let pending = 0;

    const unbindCall = wire.$on("component:call", (data) => {
        if (!matchesCall(data)) return;
        pending += 1;
        applyState(pending > 0);
    });

    const onEnd = (data: any) => {
        if (!data || data.id !== componentId) return;
        if (pending <= 0) return;

        // Prefer exact match using method metadata. Fallback keeps compatibility
        // with legacy "component:finished" events that only include component id.
        const hasMethodMeta = typeof data?.method === "string" || Array.isArray(data?.params);
        if (!hasMethodMeta || matchesCall(data)) {
            pending = Math.max(0, pending - 1);
            applyState(pending > 0);
        }
    };

    const unbindFinished = wire.$on("component:finished", onEnd);
    const unbindError = wire.$on("component:error", onEnd);

    cleanup(unbindCall);
    cleanup(unbindFinished);
    cleanup(unbindError);
});
