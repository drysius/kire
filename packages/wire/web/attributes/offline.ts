import { registerWireHandler } from "../core/directives";

registerWireHandler("offline", (el, { modifiers }) => {
    let originalDisplay = el.style.display === 'none' ? '' : el.style.display;
    if (!modifiers.includes("class") && !modifiers.includes("attr")) {
        el.style.display = 'none';
    }

    const update = () => {
        const isOffline = !navigator.onLine;
        if (modifiers.includes("class")) {
            const classList = el.getAttribute("wire:offline.class")?.split(" ") || [];
            if (isOffline) el.classList.add(...classList);
            else el.classList.remove(...classList);
        } else {
            el.style.display = isOffline ? originalDisplay : 'none';
        }
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
});
