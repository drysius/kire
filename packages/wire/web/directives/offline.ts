import { Kirewire } from "../kirewire";

Kirewire.directive('offline', ({ el, modifiers, cleanup }) => {
    let originalDisplay = el.style.display;
    
    const updateStatus = () => {
        const isOffline = !navigator.onLine;
        if (modifiers.includes('class')) {
            const className = modifiers[modifiers.indexOf('class') + 1] || 'wire-offline';
            isOffline ? el.classList.add(className) : el.classList.remove(className);
        } else if (modifiers.includes('attr')) {
            const attrName = modifiers[modifiers.indexOf('attr') + 1] || 'disabled';
            isOffline ? el.setAttribute(attrName, 'true') : el.removeAttribute(attrName);
        } else {
            el.style.display = isOffline ? originalDisplay : 'none';
        }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    cleanup(() => {
        window.removeEventListener('online', updateStatus);
        window.removeEventListener('offline', updateStatus);
    });

    updateStatus();
});
