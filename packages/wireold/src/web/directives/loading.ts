import { on } from "../core/hooks";
import { directive } from "../core/registry";
import { toggleBooleanState } from "../utils/shared";

directive("loading", (el, dir, component) => {
    // Capture initial display style once. 
    let originalDisplay = el.style.display;
    if (originalDisplay === 'none') {
        originalDisplay = ''; // Let it fall back to CSS default
    }

    const update = (anyLoading: boolean, activeTargets: string[]) => {
        let isLoading = false;
        const targetAttr = el.getAttribute("wire:target");

        if (targetAttr) {
            const targets = targetAttr.split(",").map((t) => t.trim());
            isLoading = targets.some((t) => activeTargets.includes(t));
        } else {
            isLoading = anyLoading;
        }

        toggleBooleanState(el, dir, isLoading, originalDisplay);
    };

	// Initial state check
    const activeTargets = Array.from(component.activeRequests.keys());
    update(component.activeRequests.size > 0, activeTargets);

    // Listen to internal hook
	const cleanup = on("loading", ({ component: c, loading, target, anyLoading }) => {
		if (c.id !== component.id) return;
        
        const currentActiveTargets = Array.from(component.activeRequests.keys());
		update(anyLoading, currentActiveTargets);
	});
    
    // Auto-cleanup when directive removed handled by registry/lifecycle usually, 
    // but here we can't easily hook into directive removal without Alpine's cleanup param.
    // Assuming component cleanup handles it or Alpine's cleanup function is passed.
});