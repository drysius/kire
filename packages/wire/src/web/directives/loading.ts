import { directive } from "../core/registry";
import { toggleBooleanState } from "../utils/shared";

directive('loading', (el, dir, component) => {
    // Initial state check - usually hidden unless .remove
    // We assume default state is NOT loading
    toggleBooleanState(el, dir, false, el.style.display);

    window.addEventListener('wire:loading', (e: any) => {
        if (e.detail.id !== component.id) return;
        
        let isLoading = false;
        const targetAttr = el.getAttribute('wire:target');

        if (targetAttr) {
            const targets = targetAttr.split(',').map(t => t.trim());
            // Check if any of the targets are active
            isLoading = targets.some(t => (component as any).activeRequests.has(t));
        } else {
            // Global loading (no target specified)
            isLoading = e.detail.anyLoading;
        }

        toggleBooleanState(el, dir, isLoading, el.style.display);
    });
});
