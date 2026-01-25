import { sendNavigateRequest } from "../../core/navigate-request";
import { storeCurrentPageStatus } from "./history";
import { getUriStringFromUrlObject } from "./links";

export function fetchHtml(
	destination: URL,
	callback: (html: string, finalDestination: URL) => void,
	errorCallback: (error: any) => void,
) {
	const uri = getUriStringFromUrlObject(destination);

	performFetch(
		uri,
		(html, finalDestination, status) => {
			storeCurrentPageStatus(status);
			callback(html, finalDestination);
		},
		errorCallback,
	);
}

export function performFetch(
	uri: string,
	callback: (html: string, destination: URL, status: number) => void,
	errorCallback: (error: any) => void,
) {
	sendNavigateRequest(uri, callback, errorCallback);
}
