import { registerWireHandler } from "../core/directives";

registerWireHandler("dirty", (el, { modifiers }, { Alpine }) => {
    // @ts-expect-error Alpine internal
    const component = el._x_dataStack?.find((d: any) => d.__pendingUpdates !== undefined);
    if (!component) return;

    let originalDisplay = el.style.display === 'none' ? '' : el.style.display;
    if (!modifiers.includes("class") && !modifiers.includes("attr")) {
        el.style.display = 'none';
    }

    Alpine.effect(() => {
        const isDirty = Object.keys(component.__pendingUpdates || {}).length > 0;
        if (modifiers.includes("class")) {
            const classList = el.getAttribute("wire:dirty.class")?.split(" ") || [];
            if (isDirty) el.classList.add(...classList);
            else el.classList.remove(...classList);
        } else {
            el.style.display = isDirty ? originalDisplay : 'none';
        }
    });
});
