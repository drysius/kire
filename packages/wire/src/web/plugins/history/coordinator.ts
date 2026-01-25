import { batch, unwrap } from "./utils";

class HistoryCoordinator {
	url: URL | null = null;
	errorHandlers: Record<string, Function> = {};
	batch: any;

	constructor() {
		this.batch = batch((updates: any) => {
			const url = this.getUrl();

			this.writeToHistory("replaceState", url, (state: any) => {
				// Only update state.alpine as we are merging...
				state.alpine = { ...state.alpine, ...unwrap(updates) };
				return state;
			});

			this.url = null;
		});
	}

	addErrorHandler(key: string, callback: Function) {
		this.errorHandlers[key] = callback;
	}

	getUrl() {
		// If the querystring has started changing the URL before the batch has been flushed, use the URL that was passed in...
		return this.url ?? new URL(window.location.href);
	}

	replaceState(url: URL, updates: any) {
		this.url = url;
		this.batch.add(updates);
	}

	pushState(url: URL, updates: any) {
		// Flush any pending replaces first...
		this.batch.flush();

		this.writeToHistory("pushState", url, (state: any) => {
			// Replace the entire state as we are pushing...
			state = { alpine: { ...state.alpine, ...unwrap(updates) } };
			return state;
		});
	}

	writeToHistory(
		method: "pushState" | "replaceState",
		url: URL,
		callback: Function,
	) {
		let state = window.history.state || {};
		if (!state.alpine) state.alpine = {};

		// Process the state using the callback...
		state = callback(state);

		try {
			// 640k character limit:
			window.history[method](state, "", url.toString());
		} catch (error) {
			Object.values(this.errorHandlers).forEach(
				(handler: any) => typeof handler === "function" && handler(error, url),
			);

			// Remove error handlers after processing as they could be different depending on what is calling the method...
			this.errorHandlers = {};

			console.error(error);
		}
	}
}

const historyCoordinator = new HistoryCoordinator();

export default historyCoordinator;
