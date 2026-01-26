type ListenerCallback = (...args: any[]) => any;
type Unsubscribe = () => void;

const listeners: Record<string, ListenerCallback[]> = {};

export function on(name: string, callback: ListenerCallback): Unsubscribe {
	if (!listeners[name]) listeners[name] = [];
	listeners[name]!.push(callback);
	return () => {
		listeners[name] = listeners[name]!.filter((i) => i !== callback);
	};
}

export function trigger(name: string, ...params: any[]) {
	const callbacks = listeners[name] || [];
	const finishers: Function[] = [];

	for (let i = 0; i < callbacks.length; i++) {
		const finisher = callbacks[i]!(...params);
		if (typeof finisher === "function") finishers.push(finisher);
	}

	return (result?: any) => {
		return runFinishers(finishers, result);
	};
}

export async function triggerAsync(name: string, ...params: any[]) {
	const callbacks = listeners[name] || [];
	const finishers: Function[] = [];

	for (let i = 0; i < callbacks.length; i++) {
		const finisher = await callbacks[i]!(...params);
		if (typeof finisher === "function") finishers.push(finisher);
	}

	return (result?: any) => {
		return runFinishers(finishers, result);
	};
}

function runFinishers(finishers: Function[], result: any) {
	let latest = result;
	for (let i = 0; i < finishers.length; i++) {
		const iResult = finishers[i]!(latest);
		if (iResult !== undefined) {
			latest = iResult;
		}
	}
	return latest;
}
