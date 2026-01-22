import { directive } from "../core/registry";
import { toggleBooleanState } from "../utils/shared";

directive('offline', (el, dir, component) => {
    const update = () => {
        const isOffline = !navigator.onLine;
        toggleBooleanState(el, dir, isOffline, el.style.display);
    };

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    
    // Initial check
    update();
});
