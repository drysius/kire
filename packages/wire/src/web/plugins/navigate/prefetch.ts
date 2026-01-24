import { performFetch } from "./fetch";
import { getUriStringFromUrlObject } from "./links";
import { storeCurrentPageStatus } from "./history";

let prefetches: Record<string, any> = {}
let cacheDuration = 30000

export function prefetchHtml(destination: URL, callback: (html: string, uri: URL) => void, errorCallback: () => void) {
    let uri = getUriStringFromUrlObject(destination)

    if (prefetches[uri]) return

    prefetches[uri] = { finished: false, html: null, whenFinished: () => setTimeout(() => delete prefetches[uri], cacheDuration) }

    performFetch(uri, (html: string, routedUri: URL, status: number) => {
        storeCurrentPageStatus(status)
        callback(html, routedUri)
    }, () => {
        delete prefetches[uri]
        errorCallback()
    })
}

export function storeThePrefetchedHtmlForWhenALinkIsClicked(html: string, destination: URL, finalDestination: URL) {
    let state = prefetches[getUriStringFromUrlObject(destination)]
    if (state) {
        state.html = html
        state.finished = true
        state.finalDestination = finalDestination
        state.whenFinished()
    }
}

export function getPretchedHtmlOr(destination: URL, receive: (html: string, finalDestination: URL) => void, ifNoPrefetchExists: () => void) {
    let uri = getUriStringFromUrlObject(destination)

    if (! prefetches[uri]) return ifNoPrefetchExists()

    if (prefetches[uri].finished) {
        let html = prefetches[uri].html
        let finalDestination = prefetches[uri].finalDestination
        delete prefetches[uri]
        return receive(html, finalDestination)
    } else {
        prefetches[uri].whenFinished = () => {
            let html = prefetches[uri].html
            let finalDestination = prefetches[uri].finalDestination
            delete prefetches[uri]
            receive(html, finalDestination)
        }
    }
}