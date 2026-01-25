import historyCoordinator from "../history/coordinator";

class Snapshot {
	url: URL;
	html: string;
	constructor(url: URL, html: string) {
		this.url = url;
		this.html = html;
	}
}

const snapshotCache = {
	currentKey: null as string | null,
	currentUrl: null as URL | null,
	keys: [] as string[],
	lookup: {} as Record<string, Snapshot>,
	limit: 10,

	has(location: string) {
		return this.lookup[location] !== undefined;
	},

	retrieve(location: string) {
		const snapshot = this.lookup[location];
		if (snapshot === undefined)
			throw "No back button cache found for current location: " + location;
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
	},
};

let currentPageStatus: number | null = null;

export function storeCurrentPageStatus(status: number) {
	currentPageStatus = status;
}

export function updateCurrentPageHtmlInHistoryStateForLaterBackButtonClicks() {
	const url = historyCoordinator.getUrl();
	replaceUrl(url, document.documentElement.outerHTML);
}

export function updateCurrentPageHtmlInSnapshotCacheForLaterBackButtonClicks(
	key: string,
	url: URL,
) {
	const html = document.documentElement.outerHTML;
	snapshotCache.replace(key, new Snapshot(url, html));
}

export function whenTheBackOrForwardButtonIsClicked(
	registerFallback: (cb: Function) => void,
	handleHtml: (
		html: string,
		url: URL,
		currentUrl: URL | null,
		currentKey: string | null,
	) => void,
) {
	let fallback: Function;

	registerFallback((i: Function) => (fallback = i));

	window.addEventListener("popstate", (e) => {
		const state = e.state || {};
		const alpine = state.alpine || {};

		if (
			currentPageStatus &&
			(currentPageStatus < 200 || currentPageStatus >= 300)
		) {
			return (window.location.href = alpine.url);
		}

		if (Object.keys(state).length === 0) return;

		if (!alpine.snapshotIdx) return;

		if (snapshotCache.has(alpine.snapshotIdx)) {
			const snapshot = snapshotCache.retrieve(alpine.snapshotIdx);
			handleHtml(
				snapshot.html,
				snapshot.url,
				snapshotCache.currentUrl,
				snapshotCache.currentKey,
			);
		} else {
			fallback(alpine.url);
		}
	});
}

export function updateUrlAndStoreLatestHtmlForFutureBackButtons(
	html: string,
	destination: URL,
) {
	pushUrl(destination, html);
}

export function pushUrl(url: URL, html: string) {
	updateUrl("pushState", url, html);
}

export function replaceUrl(url: URL, html: string) {
	updateUrl("replaceState", url, html);
}

function updateUrl(
	method: "pushState" | "replaceState",
	url: URL,
	html: string,
) {
	let key = url.toString() + "-" + Math.random();

	method === "pushState"
		? snapshotCache.push(key, new Snapshot(url, html))
		: snapshotCache.replace(
				(key = snapshotCache.currentKey ?? key),
				new Snapshot(url, html),
			);

	historyCoordinator.addErrorHandler("navigate", (error: any) => {
		if (error instanceof DOMException && error.name === "SecurityError") {
			console.error(
				"Kirewire: You can't use wire:navigate with a link to a different root domain: " +
					url,
			);
		}
	});

	historyCoordinator[method](url, { snapshotIdx: key, url: url.toString() });

	snapshotCache.currentKey = key;
	snapshotCache.currentUrl = url;
}
