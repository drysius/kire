import { batch, unwrap } from "./utils";

class HistoryCoordinator {
    public url: URL | null = null;
    public errorHandlers: Record<string, Function> = {};
    public batch: any;
    private _state: any = {}; // In-memory fallback

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

    writeToHistory(method: "pushState" | "replaceState", url: URL, callback: Function) {
        let state: any = {};
        
        try {
            state = window.history.state || this._state || {};
        } catch (e) {
            state = this._state || {};
        }

        if (!state || typeof state !== "object") state = {};
        if (!state.alpine) state.alpine = {};

        // Process the state using the callback...
        state = callback(state);
        this._state = state; // Keep in sync

        try {
            const urlString = url.toString();
            
            if (history && typeof (history as any)[method] === 'function') {
                (history as any)[method](state, '', urlString);
            } else {
                // Silently fallback to memory history
                // This prevents crashes in restricted environments (FiveM, old CEF)
            }
        } catch (error) {
            Object.values(this.errorHandlers).forEach(
                handler => typeof handler === 'function' && handler(error, url)
            );

            this.errorHandlers = {};
        }
    }

    get state() {
        try {
            return window.history.state || this._state;
        } catch (e) {
            return this._state;
        }
    }
}

const historyCoordinator = new HistoryCoordinator();

export default historyCoordinator;