export function serializeEvent(e?: Event): any {
    if (!e) return { error: 'No event' };
    
    const target = e.target as any;
    const base = {
        type: e.type,
        value: target?.value, 
        checked: target?.checked,
    };
    
    // Duck typing check for KeyboardEvent properties
    if ('key' in e) {
        const ke = e as KeyboardEvent;
        return { 
            ...base, 
            key: ke.key, 
            code: ke.code, 
            altKey: ke.altKey, 
            ctrlKey: ke.ctrlKey, 
            shiftKey: ke.shiftKey 
        };
    }
    
    return base;
}
