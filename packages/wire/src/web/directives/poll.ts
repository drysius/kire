import { directive } from "../core/registry";
import { extractDuration } from "../utils/shared";

directive('poll', (el, dir, component) => {
    let duration = extractDuration(dir.modifiers, 2000);
    // Safety check
    if (duration < 100) duration = 100;

    const action = dir.value || '$refresh';
    
    const isKeepAlive = dir.modifiers.includes('keep-alive');
    const isVisibleOnly = dir.modifiers.includes('visible');

    let interval: Timer | undefined;

    const pollFn = () => {
        // Stop conditions
        if (!document.body.contains(el)) {
            clearInterval(interval);
            return;
        }

        // Pause conditions
        if (!navigator.onLine) return; // Don't poll if offline

        if (document.hidden && !isKeepAlive) {
            // Throttle: only 5% chance to run if backgrounded and not keep-alive
            if (Math.random() > 0.05) return;
        }

        if (isVisibleOnly) {
            const rect = el.getBoundingClientRect();
            const isVisible = (
                rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
                rect.bottom > 0 &&
                rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
                rect.right > 0
            );
            if (!isVisible) return;
        }

        // Check if component is already loading to avoid pile-up
        if (component.el.hasAttribute('wire:loading-state')) return;

        component.call(action);
    };

    interval = setInterval(pollFn, duration);
});
