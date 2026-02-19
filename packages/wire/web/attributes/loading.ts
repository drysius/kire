import { registerWireHandler } from "../core/directives";

registerWireHandler("loading", (el, { modifiers }, { cleanup, Alpine }) => {
    // @ts-expect-error Alpine internal
    const component = el._x_dataStack?.find((d: any) => d.__isLoading !== undefined);
    if (!component) return;

    let originalDisplay = el.style.display === 'none' ? '' : el.style.display;
    if (!modifiers.includes("remove") && !modifiers.includes("class") && !modifiers.includes("attr")) {
        el.style.display = 'none';
    }

    const toggle = (loading: boolean) => {
        const isRemove = modifiers.includes("remove");
        const isActive = isRemove ? !loading : loading;

        if (modifiers.includes("class")) {
            const classList = el.getAttribute("wire:loading.class")?.split(" ") || [];
            if (isActive) el.classList.add(...classList);
            else el.classList.remove(...classList);
        } else if (modifiers.includes("attr")) {
            const attrName = el.getAttribute("wire:loading.attr");
            if (attrName) {
                if (isActive) el.setAttribute(attrName, "true");
                else el.removeAttribute(attrName);
            }
        } else {
            el.style.display = isActive ? originalDisplay : 'none';
        }
    };

    Alpine.effect(() => toggle(component.__isLoading));
});
