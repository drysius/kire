import { directive } from "../core/registry";
import { getValueFromElement } from "../core/value";

directive('model', (el, dir, component) => {
    const prop = dir.value;
    const isFile = el instanceof HTMLInputElement && el.type === 'file';
    const isDefer = dir.modifiers.includes('defer');
    const eventType = (dir.modifiers.includes('lazy') || el.tagName === 'SELECT' || isFile) ? 'change' : 'input';
    
    let debounce = 150;
    const debounceMod = dir.modifiers.find((m: string) => m.startsWith('debounce'));
    if (debounceMod) {
        const parts = dir.name.split('.');
        const next = parts[parts.indexOf('debounce') + 1];
        if (next && next.endsWith('ms')) debounce = parseInt(next);
    }
    if (eventType === 'change') debounce = 0;

    let timeout: any;
    el.addEventListener(eventType, async () => {
        if (isFile) {
            const input = el as HTMLInputElement;
            let val: any = null;

            if (input.files && input.files.length > 0) {
                // Pass raw File objects. The HttpAdapter will handle FormData conversion.
                val = input.multiple ? Array.from(input.files) : input.files[0];
            }
            
            if (isDefer) {
                component.deferUpdate({ [prop]: val });
            } else {
                component.update({ [prop]: val });
            }
            return;
        }

        const val = getValueFromElement(el);
        
        if (isDefer) {
            component.deferUpdate({ [prop]: val });
            return;
        }

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            component.update({ [prop]: val });
        }, debounce);
    });
    
    // Initial Sync
});
