
import { directive } from "../core/registry";

directive("transition", (el, dir) => {
    const transitionName = dir.value || 'match-element';
    el.style.viewTransitionName = transitionName;
});

export async function transitionDomMutation(el: HTMLElement, callback: () => void | Promise<void>) {
    // Check if View Transitions API is supported
    if (!(document as any).startViewTransition) {
        await callback();
        return;
    }

    // Check if any element inside (or the root) has a view-transition-name
    // We check for the directive attribute or the inline style
    const hasTransition = el.style.viewTransitionName || el.querySelector('[style*="view-transition-name"]');

    if (!hasTransition) {
        await callback();
        return;
    }

    const transition = (document as any).startViewTransition(async () => {
        await callback();
    });

    await transition.finished;
}
