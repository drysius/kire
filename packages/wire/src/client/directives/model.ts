import { directive } from "../core/registry";
import { getValueFromElement } from "../core/value";

directive('model', (el, dir, component) => {
    const prop = dir.value;
    const eventType = (dir.modifiers.includes('lazy') || el.tagName === 'SELECT') ? 'change' : 'input';
    
    let debounce = 150;
    const debounceMod = dir.modifiers.find((m: string) => m.startsWith('debounce'));
    if (debounceMod) {
        const parts = dir.name.split('.');
        const next = parts[parts.indexOf('debounce') + 1];
        if (next && next.endsWith('ms')) debounce = parseInt(next);
    }
    if (eventType === 'change') debounce = 0;

    let timeout: any;
    el.addEventListener(eventType, () => {
        const val = getValueFromElement(el);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            component.update({ [prop]: val });
        }, debounce);
    });
    
    // Initial Sync
    // We only set if DOM is empty/default to respect server state on hydration
    // But for model, we usually want to sync server -> client on load if client is empty?
    // Or if server rendered value="" attribute, it's already there.
});
