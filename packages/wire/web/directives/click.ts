import { Kirewire } from "../kirewire";
import { bus } from "../utils/message-bus";

Kirewire.directive('click', ({ el, expression, cleanup, wire }) => {
    const handler = (e: MouseEvent) => {
        e.preventDefault();
        wire.call(el, expression);
    };
    el.addEventListener('click', handler);
    cleanup(() => el.removeEventListener('click', handler));
});
