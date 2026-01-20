import { directive } from "../core/registry";
import { parseAction } from "../core/parser";

directive('keydown', (el, dir, component) => {
    el.addEventListener('keydown', (e) => {
        // Modifiers: enter, escape, etc.
        const modifiers = dir.modifiers;
        
        // If specific keys are requested, check them
        // Simple mapping for common keys
        const keyMap: Record<string, string> = {
            'enter': 'Enter',
            'escape': 'Escape',
            'esc': 'Escape',
            'tab': 'Tab',
            'space': ' ',
            'arrow-right': 'ArrowRight',
            'arrow-left': 'ArrowLeft',
            'arrow-up': 'ArrowUp',
            'arrow-down': 'ArrowDown',
        };

        const keyModifiers = modifiers.filter((m: string) => Object.keys(keyMap).includes(m) || m === 'shift' || m === 'ctrl' || m === 'meta' || m === 'alt');
        
        if (keyModifiers.length > 0) {
            const matches = keyModifiers.every((m: string) => {
                if (m === 'shift') return e.shiftKey;
                if (m === 'ctrl') return e.ctrlKey;
                if (m === 'meta') return e.metaKey;
                if (m === 'alt') return e.altKey;
                return e.key === keyMap[m] || e.key.toLowerCase() === m;
            });
            if (!matches) return;
        }

        if (modifiers.includes('prevent')) e.preventDefault();
        if (modifiers.includes('stop')) e.stopPropagation();

        const { method, params } = parseAction(dir.value);
        component.call(method, params);
    });
});
