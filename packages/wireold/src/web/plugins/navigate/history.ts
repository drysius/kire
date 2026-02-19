import historyCoordinator from "../history/coordinator";

class Snapshot {
    public url: URL;
    public html: string;
    constructor(url: URL, html: string) {
        this.url = url;
        this.html = html;
    }
}

const snapshotCache: any = {
    currentKey: null,
    currentUrl: null,
    keys: [],
    lookup: {},

    limit: 10,

    has(location: string) {
        return this.lookup[location] !== undefined;
    },

    retrieve(location: string) {
        const snapshot = this.lookup[location];

        if (snapshot === undefined)
            throw (
                'No back button cache found for current location: ' +
                location
            );

        return snapshot;
    },

    replace(key: string, snapshot: Snapshot) {
        if (this.has(key)) {
            this.lookup[key] = snapshot;
        } else {
            this.push(key, snapshot);
        }
    },

    push(key: string, snapshot: Snapshot) {
        this.lookup[key] = snapshot;

        const index = this.keys.indexOf(key);

        if (index > -1) this.keys.splice(index, 1);

        this.keys.unshift(key);

        this.trim();
    },

    trim() {
        for (const key of this.keys.splice(this.limit)) {
          delete this.lookup[key];
        }
    }
};

let currentPageStatus: number | null = null;

export function storeCurrentPageStatus(status: number) {
    currentPageStatus = status;
}

export function updateCurrentPageHtmlInHistoryStateForLaterBackButtonClicks() {
    // Get the URL with all querystring changes...
    const url = historyCoordinator.getUrl();
    
    // Create a history state entry for the initial page load.
    // (This is so later hitting back can restore this page).
    replaceUrl(url, document.documentElement.outerHTML);
}

export function updateCurrentPageHtmlInSnapshotCacheForLaterBackButtonClicks(key: string, url: URL) {
    const html = document.documentElement.outerHTML;

    snapshotCache.replace(key, new Snapshot(url, html));
}

export function whenTheBackOrForwardButtonIsClicked(
    registerFallback: (cb: Function) => void,
    handleHtml: (html: string, url: URL, currentUrl: URL | null, currentKey: string | null) => void
) {
    let fallback: Function;

    registerFallback((i: Function) => (fallback = i));

    window.addEventListener('popstate', e => {
        const state = e.state || historyCoordinator.state || {};

        const alpine = state.alpine || {};

        // If the current page is not a 2xx status code, then we want to force a full page refresh to ensure that the error page assets aren't kept in the DOM...
        if (currentPageStatus && (currentPageStatus < 200 || currentPageStatus >= 300)) {
            return window.location.href = alpine.url;
        }

        // If state is an empty object, then the popstate has probably been triggered
        // by anchor tags `#my-heading`, so we don't want to handle them.
        if (Object.keys(state).length === 0) return;

        if (! alpine.snapshotIdx) return;

        if (snapshotCache.has(alpine.snapshotIdx)) {
            const snapshot = snapshotCache.retrieve(alpine.snapshotIdx);

            handleHtml(snapshot.html, snapshot.url, snapshotCache.currentUrl, snapshotCache.currentKey);
        } else {
            fallback(alpine.url);
        }
    });
}

export function updateUrlAndStoreLatestHtmlForFutureBackButtons(
    html: string,
    destination: URL
) {
    pushUrl(destination, html);
}

export function pushUrl(url: URL, html: string) {
    updateUrl('pushState', url, html);
}

export function replaceUrl(url: URL, html: string) {
    updateUrl('replaceState', url, html);
}

function updateUrl(method: "pushState" | "replaceState", url: URL, html: string) {
    let key = url.toString() + '-' + Math.random();

    if (method === 'pushState') {
        snapshotCache.push(key, new Snapshot(url, html));
    } else {
        key = snapshotCache.currentKey ?? key;
        snapshotCache.replace(key, new Snapshot(url, html));
    }

    historyCoordinator.addErrorHandler('navigate', (error: any) => {
        if (error instanceof DOMException && error.name === 'SecurityError') {
            console.error(
                "KireWire: You can't use wire:navigate with a link to a different root domain: " +
                    url
            );
        }
    });

    if (method === 'pushState') {
        historyCoordinator.pushState(url, { snapshotIdx: key, url: url.toString() });
    } else {
        historyCoordinator.replaceState(url, { snapshotIdx: key, url: url.toString() });
    }

    snapshotCache.currentKey = key;
    snapshotCache.currentUrl = url;
}
