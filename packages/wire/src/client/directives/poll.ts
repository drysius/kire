import { directive } from "../core/registry";

directive('poll', (el, dir, component) => {
    let duration = 2000;
    const durationMod = dir.modifiers.find((m: string) => m.endsWith('ms'));
    if (durationMod) duration = parseInt(durationMod);
    if (duration < 100) duration = 100; // Safety

    const interval = setInterval(() => {
        if (!document.body.contains(el)) {
            clearInterval(interval);
            return;
        }
        if (component.el.hasAttribute('wire:loading-state')) return;
        component.call(dir.value || '$refresh');
    }, duration);
});
