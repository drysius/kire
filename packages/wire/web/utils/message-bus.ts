export interface WirePayload {
	id: string;
	method: string;
	params: any[];
	pageId: string;
}

function isDebugEnabled(): boolean {
	return typeof window !== "undefined" && !!(window as any).__KIREWIRE_DEBUG__;
}

function debugLog(...args: any[]) {
	if (!isDebugEnabled()) return;
	console.log(...args);
}

function debugError(...args: any[]) {
	if (!isDebugEnabled()) return;
	console.error(...args);
}

export class MessageBus {
	private queue: Array<{
		payload: WirePayload;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}> = [];
	private timer: any = null;
	private inFlight = false;
	private readonly flushTimeoutMs = 15000;
	private activeCancel: ((reason?: any) => void) | null = null;

	constructor(private delay: number = 10) {}

	public setDelay(ms: number) {
		this.delay = ms;
	}

	public enqueue(payload: WirePayload): Promise<any> {
		debugLog(
			`[Kirewire] MessageBus enqueuing action "${payload.method}" for component "${payload.id}"`,
		);
		return new Promise((resolve, reject) => {
			this.queue.push({ payload, resolve, reject });

			if (!this.timer && !this.inFlight) {
				// Wait for the current synchronous execution to finish before starting the timer
				queueMicrotask(() => {
					if (!this.timer && this.queue.length > 0) {
						debugLog(
							`[Kirewire] MessageBus starting flush timer (${this.delay}ms)`,
						);
						this.timer = setTimeout(() => this.flush(), this.delay);
					}
				});
			}
		});
	}

	public cancelPending(reason: any = new Error("MessageBus queue cancelled")) {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		if (this.queue.length > 0) {
			const pending = [...this.queue];
			this.queue = [];
			for (let i = 0; i < pending.length; i++) {
				pending[i]!.reject(reason);
			}
		}

		if (this.activeCancel) {
			this.activeCancel(reason);
		}
	}

	private async flush() {
		if (this.inFlight || this.queue.length === 0) return;
		this.inFlight = true;
		this.timer = null;

		const batch = [...this.queue];
		this.queue = [];

		debugLog(
			`[Kirewire] MessageBus flushing batch of ${batch.length} actions.`,
		);

		let settled = false;
		const finalize = () => {
			if (settled) return;
			settled = true;
			this.inFlight = false;
			this.activeCancel = null;
			if (!this.timer && this.queue.length > 0) {
				this.timer = setTimeout(() => this.flush(), this.delay);
			}
		};

		const failBatch = (err: any) => {
			debugError(`[Kirewire] MessageBus batch failed:`, err);
			batch.forEach((item) => item.reject(err));
			finalize();
		};

		const timeout = setTimeout(() => {
			failBatch(
				new Error(`MessageBus timed out after ${this.flushTimeoutMs}ms`),
			);
		}, this.flushTimeoutMs);

		this.activeCancel = (reason?: any) => {
			const err =
				reason instanceof Error
					? reason
					: new Error(
							typeof reason === "string"
								? reason
								: "MessageBus batch cancelled",
						);
			failBatch(err);
		};

		try {
			// The transport logic will be injected by the adapter
			const event = new CustomEvent("wire:bus:flush", {
				detail: {
					batch: batch.map((b) => b.payload),
					setCancel: (fn: (reason?: any) => void) => {
						this.activeCancel = (reason?: any) => {
							try {
								fn(reason);
							} catch {}
							const err =
								reason instanceof Error
									? reason
									: new Error(
											typeof reason === "string"
												? reason
												: "MessageBus batch cancelled",
										);
							failBatch(err);
						};
					},
					finish: (rawResults: any) => {
						clearTimeout(timeout);
						const results = Array.isArray(rawResults)
							? rawResults
							: [rawResults];
						debugLog(
							`[Kirewire] MessageBus batch finished with ${results.length} results.`,
						);
						batch.forEach((item, i) => {
							const result = results[i] ?? results[results.length - 1];
							if (result?.error) item.reject(result.error);
							else item.resolve(result);
						});
						finalize();
					},
					error: (err: any) => {
						clearTimeout(timeout);
						failBatch(err);
					},
				},
			});
			window.dispatchEvent(event);
		} catch (e) {
			clearTimeout(timeout);
			failBatch(e);
		}
	}
}

export const bus = new MessageBus();
