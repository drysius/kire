import { Kirewire } from "../kirewire";

Kirewire.directive('loading', ({ el, modifiers, wire, cleanup }) => {
    let originalDisplay = el.style.display;
    if (!modifiers.includes('class') && !modifiers.includes('attr')) {
        el.style.display = 'none';
    }

    const show = () => {
        if (modifiers.includes('class')) {
            el.classList.add(modifiers[modifiers.indexOf('class') + 1] || 'wire-loading');
        } else if (modifiers.includes('attr')) {
            el.setAttribute(modifiers[modifiers.indexOf('attr') + 1] || 'disabled', 'true');
        } else {
            el.style.display = originalDisplay;
        }
    };

    const hide = () => {
        if (modifiers.includes('class')) {
            el.classList.remove(modifiers[modifiers.indexOf('class') + 1] || 'wire-loading');
        } else if (modifiers.includes('attr')) {
            el.removeAttribute(modifiers[modifiers.indexOf('attr') + 1] || 'disabled');
        } else {
            el.style.display = 'none';
        }
    };

    const unbindCall = wire.$on('component:call', (data) => {
        const componentId = wire.getComponentId(el);
        if (data.id === componentId) {
            show();
        }
    });

    const maybeHide = (data: any) => {
        const componentId = wire.getComponentId(el);
        if (data.id === componentId) {
            hide();
        }
    };

    const unbindUpdate = wire.$on('component:update', maybeHide);
    const unbindFinished = wire.$on('component:finished', maybeHide);
    const unbindError = wire.$on('component:error', maybeHide);

    cleanup(unbindCall);
    cleanup(unbindUpdate);
    cleanup(unbindFinished);
    cleanup(unbindError);
});
