export function getValueFromElement(el: HTMLElement): any {
    if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
            return el.checked;
        }
        if (el.type === 'radio') {
            // Se for radio, precisamos ver se está checked.
            // O evento 'change' só dispara no selecionado, então ok.
            return el.checked ? el.value : null; 
        }
        if (el.type === 'number' || el.type === 'range') {
            return el.value === '' ? null : Number(el.value);
        }
        return el.value;
    }

    if (el instanceof HTMLSelectElement) {
        if (el.multiple) {
            return Array.from(el.options)
                .filter(opt => opt.selected)
                .map(opt => opt.value);
        }
        return el.value;
    }

    if (el instanceof HTMLTextAreaElement) {
        return el.value;
    }

    return undefined;
}
