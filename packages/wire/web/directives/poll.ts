import { Kirewire } from "../kirewire";

Kirewire.directive('poll', ({ el, expression, modifiers, cleanup, wire }) => {
    let interval = 2000;
    const msMod = modifiers.find(m => m.endsWith('ms'));
    if (msMod) interval = parseInt(msMod);

    const timer = setInterval(() => {
        if (!document.body.contains(el)) {
            clearInterval(timer);
            return;
        }
        const meta = wire.getMetadata(el);
        if (meta) {
            wire.call(el, expression || '$refresh');
        }
    }, interval);

    cleanup(() => clearInterval(timer));
});
