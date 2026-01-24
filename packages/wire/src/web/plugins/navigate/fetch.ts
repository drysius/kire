import { getUriStringFromUrlObject } from "./links"
import { sendNavigateRequest } from "../../core/navigate-request"
import { storeCurrentPageStatus } from "./history"

export function fetchHtml(destination: URL, callback: (html: string, finalDestination: URL) => void, errorCallback: (error: any) => void) {
    let uri = getUriStringFromUrlObject(destination)

    performFetch(uri, (html, finalDestination, status) => {
        storeCurrentPageStatus(status)
        callback(html, finalDestination)
    }, errorCallback)
}

export function performFetch(uri: string, callback: (html: string, destination: URL, status: number) => void, errorCallback: (error: any) => void) {
    sendNavigateRequest(uri, callback, errorCallback)
}