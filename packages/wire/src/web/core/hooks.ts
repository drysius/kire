type ListenerCallback = (...args: any[]) => any;
type Unsubscribe = () => void;

let listeners: Record<string, ListenerCallback[]> = {};

export function on(name: string, callback: ListenerCallback): Unsubscribe {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(callback);
    return () => {
        listeners[name] = listeners[name].filter(i => i !== callback);
    };
}

export function trigger(name: string, ...params: any[]) {
    let callbacks = listeners[name] || [];
    let finishers: Function[] = [];

    for (let i = 0; i < callbacks.length; i++) {
        let finisher = callbacks[i](...params);
        if (typeof finisher === 'function') finishers.push(finisher);
    }

    return (result?: any) => {
        return runFinishers(finishers, result);
    };
}

export async function triggerAsync(name: string, ...params: any[]) {
    let callbacks = listeners[name] || [];
    let finishers: Function[] = [];

    for (let i = 0; i < callbacks.length; i++) {
        let finisher = await callbacks[i](...params);
        if (typeof finisher === 'function') finishers.push(finisher);
    }

    return (result?: any) => {
        return runFinishers(finishers, result);
    };
}

function runFinishers(finishers: Function[], result: any) {
    let latest = result;
    for (let i = 0; i < finishers.length; i++) {
        let iResult = finishers[i](latest);
        if (iResult !== undefined) {
            latest = iResult;
        }
    }
    return latest;
}
