import { registerWireHandler } from "../core/directives";

const offlineSubscribers = new Set<() => void>();
let offlineListenersBound = false;

function ensureOfflineListeners() {
    if (offlineListenersBound) return;
    offlineListenersBound = true;
    const notify = () => {
        for (const run of offlineSubscribers) run();
    };
    window.addEventListener("online", notify);
    window.addEventListener("offline", notify);
}

registerWireHandler("offline", (el, { modifiers }) => {
    let originalDisplay = el.style.display === 'none' ? '' : el.style.display;
    if (!modifiers.includes("class") && !modifiers.includes("attr")) {
        el.style.display = 'none';
    }

    const update = () => {
        if (!document.body.contains(el)) {
            offlineSubscribers.delete(update);
            return;
        }
        const isOffline = !navigator.onLine;
        if (modifiers.includes("class")) {
            const classList = el.getAttribute("wire:offline.class")?.split(" ") || [];
            if (isOffline) el.classList.add(...classList);
            else el.classList.remove(...classList);
        } else {
            el.style.display = isOffline ? originalDisplay : 'none';
        }
    };
    ensureOfflineListeners();
    offlineSubscribers.add(update);
    update();
});
