let listeners: Record<string, Function[]> = {}

export function listen(event: string, callback: Function) {
    listeners[event] = [...(listeners[event] || []), callback]
}

export function emit(event: string, ...props: any[]) {
    (listeners[event] || []).forEach(handle => handle(...props))
}