import { performFetch } from "./fetch";
import { storeCurrentPageStatus } from "./history";
import { getUriStringFromUrlObject } from "./links";

const prefetches: Record<string, any> = {};
const cacheDuration = 30000;

export function prefetchHtml(
	destination: URL,
	callback: (html: string, uri: URL) => void,
	errorCallback: () => void,
) {
	const uri = getUriStringFromUrlObject(destination);

	if (prefetches[uri]) return;

	prefetches[uri] = {
		finished: false,
		html: null,
		whenFinished: () => setTimeout(() => delete prefetches[uri], cacheDuration),
	};

	performFetch(
		uri,
		(html: string, routedUri: URL, status: number) => {
			storeCurrentPageStatus(status);
			callback(html, routedUri);
		},
		() => {
			delete prefetches[uri];
			errorCallback();
		},
	);
}

export function storeThePrefetchedHtmlForWhenALinkIsClicked(
	html: string,
	destination: URL,
	finalDestination: URL,
) {
	const state = prefetches[getUriStringFromUrlObject(destination)];
	if (state) {
		state.html = html;
		state.finished = true;
		state.finalDestination = finalDestination;
		state.whenFinished();
	}
}

export function getPretchedHtmlOr(
	destination: URL,
	receive: (html: string, finalDestination: URL) => void,
	ifNoPrefetchExists: () => void,
) {
	const uri = getUriStringFromUrlObject(destination);

	if (!prefetches[uri]) return ifNoPrefetchExists();

	if (prefetches[uri].finished) {
		const html = prefetches[uri].html;
		const finalDestination = prefetches[uri].finalDestination;
		delete prefetches[uri];
		return receive(html, finalDestination);
	} else {
		prefetches[uri].whenFinished = () => {
			const html = prefetches[uri].html;
			const finalDestination = prefetches[uri].finalDestination;
			delete prefetches[uri];
			receive(html, finalDestination);
		};
	}
}
