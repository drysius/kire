export function setupNavigate(Alpine: any) {
    // Export all wire:navigate variations for use in other files
    const wireNavigateSelectors = [
        '[wire\:navigate]',
        '[wire\:navigate\.hover]',
        '[wire\:navigate\.preserve-scroll]',
        '[wire\:navigate\.preserve-scroll\.hover]',
        '[wire\:navigate\.hover\.preserve-scroll]',
    ];

    // Attribute to Alpine directive mapping
    const attributeMap: Record<string, string> = {
        'wire:navigate': 'x-navigate',
        'wire:navigate.hover': 'x-navigate.hover',
        'wire:navigate.preserve-scroll': 'x-navigate.preserve-scroll',
        'wire:navigate.preserve-scroll.hover': 'x-navigate.preserve-scroll.hover',
        'wire:navigate.hover.preserve-scroll': 'x-navigate.hover.preserve-scroll',
    };

    // Register all selectors with Alpine
    wireNavigateSelectors.forEach(selector => {
        Alpine.addInitSelector(() => selector);
    });

    Alpine.interceptInit(
        Alpine.skipDuringClone((el: HTMLElement) => {
            // Find which wire:navigate attribute this element has
            for (const [wireAttr, alpineDirective] of Object.entries(attributeMap)) {
                if (el.hasAttribute(wireAttr)) {
                    Alpine.bind(el, { [alpineDirective]: true });
                    break;
                }
            }
        })
    );

    document.addEventListener('alpine:navigating', () => {
        // Before navigating away, we'll inscribe the latest state of each component
        // in their HTML so that upon return, they will have the latest state...
        const Kirewire = (window as any).Kirewire;
        if (Kirewire && Kirewire.all) {
             Kirewire.all().forEach((component: any) => {
                component.inscribeSnapshotAndEffectsOnElement();
            });
        }
    });
}