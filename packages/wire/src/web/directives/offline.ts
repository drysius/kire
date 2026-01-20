import { directive } from "../core/registry";

directive('offline', (el, dir, component) => {
    const update = () => {
        if (dir.modifiers.includes('class')) {
            const classes = dir.value.split(' ');
            if (!navigator.onLine) el.classList.add(...classes);
            else el.classList.remove(...classes);
        } else if (dir.modifiers.includes('attr')) {
            if (!navigator.onLine) el.setAttribute(dir.value, 'true');
            else el.removeAttribute(dir.value);
        } else {
             // Default: show if offline
             el.style.display = !navigator.onLine ? '' : 'none';
        }
    };

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    
    // Initial check
    update();
});
