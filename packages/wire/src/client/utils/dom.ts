import { safeSelector } from "./selector";

export function findWireAttribute(target: HTMLElement, eventType: string): { el: HTMLElement, attribute: string, modifiers: string[] } | null {
    const attributePrefix = `wire:${eventType}`;
    let el: HTMLElement | null = target;
    let matchedAttribute: string | null = null;

    while (el && el !== document.body) {
        const attrs = el.getAttributeNames();
        matchedAttribute = attrs.find(a => a === attributePrefix || a.startsWith(attributePrefix + '.'));
        if (matchedAttribute) break;
        el = el.parentElement;
    }

    if (!el || !matchedAttribute) return null;

    const modifiers = matchedAttribute.split('.').slice(1);
    return { el, attribute: matchedAttribute, modifiers };
}

export function findComponentRoot(el: HTMLElement): HTMLElement | null {
    try {
        const root = el.closest(safeSelector('wire:id'));
        if (root) return root as HTMLElement;
    } catch (e) {}

    // Manual traversal fallback
    let current: HTMLElement | null = el;
    while (current && current !== document.body) {
        if (current.hasAttribute('wire:id')) return current;
        current = current.parentElement;
    }
    return null;
}

export function updateDom(id: string, html: string, newSnapshot?: string) {
    let el: HTMLElement | null = null;
    try {
        el = document.querySelector(safeSelector('wire:id', id));
    } catch (e) {
        const all = document.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            if (all[i].getAttribute('wire:id') === id) {
                el = all[i] as HTMLElement;
                break;
            }
        }
    }

    if (el) {
        const activeElement = document.activeElement as HTMLElement;
        let selectionStart: number | null = null;
        let selectionEnd: number | null = null;
        let activeId: string | null = null;

        if (activeElement && el.contains(activeElement)) {
            if (activeElement.hasAttribute('wire:model')) {
                activeId = 'wire:model=' + activeElement.getAttribute('wire:model');
            } else if (activeElement.id) {
                activeId = 'id=' + activeElement.id;
            } else if (activeElement.getAttribute('name')) {
                activeId = 'name=' + activeElement.getAttribute('name');
            }

            if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
                selectionStart = activeElement.selectionStart;
                selectionEnd = activeElement.selectionEnd;
            }
        }

        el.innerHTML = html;
        if (newSnapshot) {
            el.setAttribute('wire:snapshot', newSnapshot);
        }

        if (activeId) {
            let newActive: HTMLElement | null = null;
            if (activeId.startsWith('wire:model=')) {
                newActive = el.querySelector(safeSelector('wire:model', activeId.substring(11)));
            } else if (activeId.startsWith('id=')) {
                newActive = el.querySelector(`#${activeId.substring(3)}`);
            } else if (activeId.startsWith('name=')) {
                newActive = el.querySelector(`[name="${activeId.substring(5)}"]`);
            }

            if (newActive) {
                newActive.focus();
                if (newActive instanceof HTMLInputElement || newActive instanceof HTMLTextAreaElement) {
                    if (selectionStart !== null) newActive.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }
    } else {
        console.warn('KireWire: Component with ID ' + id + ' not found in DOM.');
    }
}

export function setLoadingState(componentId: string, loading: boolean) {
    let root: HTMLElement | null = null;
    try {
        root = document.querySelector(safeSelector('wire:id', componentId));
    } catch(e) {
         const all = document.querySelectorAll('*');
         for (let i = 0; i < all.length; i++) {
             if (all[i].getAttribute('wire:id') === componentId) {
                 root = all[i] as HTMLElement;
                 break;
             }
         }
    }

    if (!root) return;

    let loadingEls: NodeListOf<Element> | HTMLElement[] = [];
    try {
        const selectors = [
            safeSelector('wire:loading'),
            safeSelector('wire:loading.class'),
            safeSelector('wire:loading.attr'),
            safeSelector('wire:loading.remove')
        ].join(', ');
        loadingEls = root.querySelectorAll(selectors);
    } catch (e) {
        const all = root.querySelectorAll('*');
        const manualEls: HTMLElement[] = [];
        for (let i = 0; i < all.length; i++) {
            const el = all[i] as HTMLElement;
            if (el.hasAttribute('wire:loading') || 
                el.hasAttribute('wire:loading.class') || 
                el.hasAttribute('wire:loading.attr') || 
                el.hasAttribute('wire:loading.remove')) {
                manualEls.push(el);
            }
        }
        loadingEls = manualEls;
    }
    
    loadingEls.forEach((el) => {
        const element = el as HTMLElement;
        
        const classAttr = element.getAttribute('wire:loading.class');
        if (classAttr) {
            const classes = classAttr.split(' ');
            if (loading) element.classList.add(...classes);
            else element.classList.remove(...classes);
        }

        const attrAttr = element.getAttribute('wire:loading.attr');
        if (attrAttr) {
            if (loading) element.setAttribute(attrAttr, 'true');
            else element.removeAttribute(attrAttr);
        }

        if (element.hasAttribute('wire:loading')) {
             if (loading) {
                 element.style.display = element.dataset.wireDisplay || 'inline-block';
             } else {
                 element.dataset.wireDisplay = element.style.display === 'none' ? '' : element.style.display;
                 element.style.display = 'none';
             }
        }
        
        if (element.hasAttribute('wire:loading.remove')) {
             if (loading) {
                 element.dataset.wireDisplay = element.style.display === 'none' ? '' : element.style.display;
                 element.style.display = 'none';
             } else {
                 element.style.display = element.dataset.wireDisplay || 'inline-block';
             }
        }
    });
}