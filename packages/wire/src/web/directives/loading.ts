import { directive } from "../core/registry";

directive('loading', (el, dir, component) => {
    window.addEventListener('wire:loading', (e: any) => {
        if (e.detail.id !== component.id) return;
        
        const loading = e.detail.loading;
        const target = e.detail.target;

        // wire:target check
        const targetAttr = el.getAttribute('wire:target');
        if (targetAttr && target) {
            const targets = targetAttr.split(',').map(t => t.trim());
            if (!targets.includes(target)) return;
        }

        if (dir.modifiers.includes('class')) {
            const classes = dir.value.split(' ');
            if (loading) el.classList.add(...classes);
            else el.classList.remove(...classes);
        } else if (dir.modifiers.includes('attr')) {
            if (loading) el.setAttribute(dir.value, 'true');
            else el.removeAttribute(dir.value);
        } else if (dir.modifiers.includes('remove')) {
            el.style.display = loading ? 'none' : '';
        } else {
            el.style.display = loading ? 'inline-block' : 'none';
        }
    });
});
