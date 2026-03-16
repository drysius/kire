export type Listener = (...args: any[]) => any;

/**
 * High-performance, lightweight event controller.
 * Optimized for hot paths by using simple arrays and minimizing allocations.
 */
export class EventController {
	private _listeners: Record<string, Listener[]> = Object.create(null);

	/**
	 * Subscribe to one or more events.
	 * Supports multiple events separated by comma.
	 */
	public on(event: string, callback: Listener): () => void {
		const names = event.includes(",") ? event.split(",") : [event];
		const unsubs: Array<() => void> = [];

		for (let i = 0; i < names.length; i++) {
			const name = names[i].trim();
			if (!this._listeners[name]) {
				this._listeners[name] = [];
			}
			const list = this._listeners[name];
			list.push(callback);
			unsubs.push(() => {
				const idx = list.indexOf(callback);
				if (idx !== -1) list.splice(idx, 1);
			});
		}

		return () => {
			for (let i = 0; i < unsubs.length; i++) unsubs[i]();
		};
	}

	/**
	 * Emit an event to all subscribers.
	 * Runs listeners in parallel using Promise.all to avoid deadlocks.
	 */
	public async emit(event: string, data?: any): Promise<void> {
		const list = this._listeners[event];
		if (!list || list.length === 0) return;

		const promises: Array<Promise<any>> = [];
		for (let i = 0; i < list.length; i++) {
			const res = list[i](data);
			if (res instanceof Promise) promises.push(res);
		}

		if (promises.length > 0) await Promise.all(promises);
	}

	/**
	 * Emit an event synchronously.
	 */
	public emitSync(event: string, data?: any): void {
		const list = this._listeners[event];
		if (!list) return;

		for (let i = 0; i < list.length; i++) {
			list[i](data);
		}
	}

	/**
	 * Remove all listeners for a specific event or all events.
	 */
	public clear(event?: string): void {
		if (event) {
			delete this._listeners[event];
		} else {
			this._listeners = Object.create(null);
		}
	}
}
