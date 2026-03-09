import { Kirewire } from "../kirewire";

Kirewire.directive("intersect", ({ el, expression, modifiers, cleanup, wire }) => {
    if (typeof IntersectionObserver === "undefined") return;

    const once = modifiers.includes("once");
    const action = (expression || "$refresh").trim();
    if (!action) return;

    let inFlight = false;
    let observer: IntersectionObserver | null = null;

    const trigger = async () => {
        if (inFlight) return;
        inFlight = true;
        try {
            await wire.call(el, action);
            if (once && observer) observer.disconnect();
        } finally {
            inFlight = false;
        }
    };

    observer = new IntersectionObserver((entries) => {
        for (let i = 0; i < entries.length; i++) {
            if (entries[i]?.isIntersecting) {
                void trigger();
                break;
            }
        }
    });

    observer.observe(el);
    cleanup(() => observer?.disconnect());
});

