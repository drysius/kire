import { Kirewire } from "../kirewire";

Kirewire.directive('dirty', ({ el, modifiers, wire, cleanup }) => {
    const componentId = wire.getComponentId(el);
    if (!componentId) return;

    let originalDisplay = el.style.display;
    
    // Hide by default unless class or attr modifier is used
    if (!modifiers.includes('class') && !modifiers.includes('attr')) {
        el.style.display = 'none';
    }

    const off = wire.$on('component:dirty', (data) => {
        if (data.id === componentId) {
            const isDirty = data.isDirty;
            if (modifiers.includes('class')) {
                const className = modifiers[modifiers.indexOf('class') + 1] || 'wire-dirty';
                isDirty ? el.classList.add(className) : el.classList.remove(className);
            } else if (modifiers.includes('attr')) {
                const attrName = modifiers[modifiers.indexOf('attr') + 1] || 'disabled';
                isDirty ? el.setAttribute(attrName, 'true') : el.removeAttribute(attrName);
            } else {
                el.style.display = isDirty ? originalDisplay : 'none';
            }
        }
    });

    cleanup(off);
});
