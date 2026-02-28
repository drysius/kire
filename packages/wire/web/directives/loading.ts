import { Kirewire } from "../kirewire";

Kirewire.directive('loading', ({ el, modifiers, wire }) => {
    let originalDisplay = el.style.display;
    if (!modifiers.includes('class') && !modifiers.includes('attr')) {
        el.style.display = 'none';
    }

    wire.$on('component:call', (data) => {
        const componentId = wire.getComponentId(el);
        if (data.id === componentId) {
            if (modifiers.includes('class')) {
                el.classList.add(modifiers[modifiers.indexOf('class') + 1] || 'wire-loading');
            } else if (modifiers.includes('attr')) {
                el.setAttribute(modifiers[modifiers.indexOf('attr') + 1] || 'disabled', 'true');
            } else {
                el.style.display = originalDisplay;
            }
        }
    });

    wire.$on('component:update', (data) => {
        const componentId = wire.getComponentId(el);
        if (data.id === componentId) {
            if (modifiers.includes('class')) {
                el.classList.remove(modifiers[modifiers.indexOf('class') + 1] || 'wire-loading');
            } else if (modifiers.includes('attr')) {
                el.removeAttribute(modifiers[modifiers.indexOf('attr') + 1] || 'disabled');
            } else {
                el.style.display = 'none';
            }
        }
    });
});
