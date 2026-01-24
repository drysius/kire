import { replaceUrl, updateCurrentPageHtmlInHistoryStateForLaterBackButtonClicks, updateCurrentPageHtmlInSnapshotCacheForLaterBackButtonClicks, updateUrlAndStoreLatestHtmlForFutureBackButtons, whenTheBackOrForwardButtonIsClicked } from "./history"
import { getPretchedHtmlOr, prefetchHtml, storeThePrefetchedHtmlForWhenALinkIsClicked } from "./prefetch"
import { createUrlObjectFromString, extractDestinationFromLink, whenThisLinkIsHoveredFor, whenThisLinkIsPressed } from "./links"
import { isTeleportTarget, packUpPersistedTeleports, removeAnyLeftOverStaleTeleportTargets, unPackPersistedTeleports } from "./teleport"
import { restoreScrollPositionOrScrollToTop, storeScrollInformationInHtmlBeforeNavigatingAway } from "./scroll"
import { isPersistedElement, putPersistantElementsBack, storePersistantElementsForLater } from "./persist"
import { finishAndHideProgressBar, removeAnyLeftOverStaleProgressBars, showAndStartProgressBar } from "./bar"
import { packUpPersistedPopovers, unPackPersistedPopovers } from "./popover"
import { swapCurrentPageWithNewHtml } from "./page"
import { fetchHtml } from "./fetch"

let enablePersist = true
let showProgressBar = true
let restoreScroll = true
let autofocus = false

export default function (Alpine: any) {

    (Alpine as any).navigate = (url: string, options: any = {}) => {
        let { preserveScroll = false } = options

        let destination = createUrlObjectFromString(url)

        let prevented = fireEventForOtherLibrariesToHookInto('alpine:navigate', {
            url: destination, history: false, cached: false,
         })

        if (prevented) return

        if(destination) navigateTo(destination, { preserveScroll })
    }

    (Alpine as any).navigate.disableProgressBar = () => {
        showProgressBar = false
    }

    Alpine.addInitSelector(() => `[${Alpine.prefixed('navigate')}], [wire\\:navigate], [wire\\:navigate\\.hover]`)

    Alpine.interceptInit(
        Alpine.skipDuringClone((el: HTMLElement) => {
            if (el.hasAttribute('wire:navigate')) {
                Alpine.bind(el, {
                    'x-navigate': true
                })
            }
            if (el.hasAttribute('wire:navigate.hover')) {
                Alpine.bind(el, {
                    'x-navigate.hover': true
                })
            }
        })
    )

    Alpine.directive('navigate', (el: HTMLElement, { modifiers }: any) => {
        let shouldPrefetchOnHover = modifiers.includes('hover')

        let preserveScroll = modifiers.includes('preserve-scroll')

        shouldPrefetchOnHover && whenThisLinkIsHoveredFor(el, 60, () => {
            let destination = extractDestinationFromLink(el)

            if (! destination) return

            prefetchHtml(destination, (html, finalDestination) => {
                storeThePrefetchedHtmlForWhenALinkIsClicked(html, destination!, finalDestination)
            }, () => {
                showProgressBar && finishAndHideProgressBar()
            })
        })

        whenThisLinkIsPressed(el, (whenItIsReleased) => {
            let destination = extractDestinationFromLink(el)

            if (! destination) return

            prefetchHtml(destination, (html, finalDestination) => {
                storeThePrefetchedHtmlForWhenALinkIsClicked(html, destination!, finalDestination)
            }, () => {
                showProgressBar && finishAndHideProgressBar()
            })

            whenItIsReleased(() => {
                let prevented = fireEventForOtherLibrariesToHookInto('alpine:navigate', {
                    url: destination, history: false, cached: false,
                 })

                if (prevented) return

                navigateTo(destination, { preserveScroll })
            })
        })
    })

    function navigateTo(destination: URL, { preserveScroll = false, shouldPushToHistoryState = true }: any) {
        showProgressBar && showAndStartProgressBar()

        fetchHtmlOrUsePrefetchedHtml(destination, (html, finalDestination) => {
            let swapCallbacks: Function[] = []

            fireEventForOtherLibrariesToHookInto('alpine:navigating', {
                onSwap: (callback: Function) => swapCallbacks.push(callback)
            })

            restoreScroll && storeScrollInformationInHtmlBeforeNavigatingAway()

            cleanupAlpineElementsOnThePageThatArentInsideAPersistedElement()

            updateCurrentPageHtmlInHistoryStateForLaterBackButtonClicks()

            preventAlpineFromPickingUpDomChanges(Alpine, (andAfterAllThis) => {
                enablePersist && storePersistantElementsForLater(persistedEl => {
                    packUpPersistedTeleports(persistedEl)
                    packUpPersistedPopovers(persistedEl)
                })

                if (shouldPushToHistoryState) {
                    updateUrlAndStoreLatestHtmlForFutureBackButtons(html, finalDestination)
                } else {
                    replaceUrl(finalDestination, html)
                }

                swapCurrentPageWithNewHtml(html, (afterNewScriptsAreDoneLoading) => {
                    removeAnyLeftOverStaleTeleportTargets(document.body)

                    enablePersist && putPersistantElementsBack((persistedEl, newStub) => {
                        unPackPersistedTeleports(persistedEl)
                        unPackPersistedPopovers(persistedEl)
                    })

                    !preserveScroll && restoreScrollPositionOrScrollToTop()

                    swapCallbacks.forEach(callback => callback())

                    afterNewScriptsAreDoneLoading(() => {
                        andAfterAllThis(() => {
                            setTimeout(() => {
                                autofocus && autofocusElementsWithTheAutofocusAttribute()
                            })

                            nowInitializeAlpineOnTheNewPage(Alpine)

                            fireEventForOtherLibrariesToHookInto('alpine:navigated')
                            showProgressBar && finishAndHideProgressBar()
                        })
                    })
                })
            })
        }, () => {
            showProgressBar && finishAndHideProgressBar()
        })
    }

    whenTheBackOrForwardButtonIsClicked(
        (ifThePageBeingVisitedHasntBeenCached) => {
            ifThePageBeingVisitedHasntBeenCached((url: URL) => {
                let destination = createUrlObjectFromString(url.toString())

                let prevented = fireEventForOtherLibrariesToHookInto('alpine:navigate', {
                    url: destination, history: true, cached: false,
                 })

                if (prevented) return

                if(destination) navigateTo(destination, { shouldPushToHistoryState: false })
            })
        },
        (html, url, currentPageUrl, currentPageKey) => {
            let destination = createUrlObjectFromString(url.toString())

            let prevented = fireEventForOtherLibrariesToHookInto('alpine:navigate', {
                url: destination, history: true, cached: true,
            })

            if (prevented) return

            storeScrollInformationInHtmlBeforeNavigatingAway()

            let swapCallbacks: Function[] = []

            fireEventForOtherLibrariesToHookInto('alpine:navigating', {
                onSwap: (callback: Function) => swapCallbacks.push(callback)
            })

            if (currentPageUrl && currentPageKey)
                updateCurrentPageHtmlInSnapshotCacheForLaterBackButtonClicks(currentPageKey, currentPageUrl)

            preventAlpineFromPickingUpDomChanges(Alpine, (andAfterAllThis) => {
                enablePersist && storePersistantElementsForLater(persistedEl => {
                    packUpPersistedTeleports(persistedEl)
                    packUpPersistedPopovers(persistedEl)
                })

                swapCurrentPageWithNewHtml(html, () => {
                    removeAnyLeftOverStaleProgressBars()

                    removeAnyLeftOverStaleTeleportTargets(document.body)

                    enablePersist && putPersistantElementsBack((persistedEl, newStub) => {
                        unPackPersistedTeleports(persistedEl)
                        unPackPersistedPopovers(persistedEl)
                    })

                    restoreScrollPositionOrScrollToTop()

                    swapCallbacks.forEach(callback => callback())

                    andAfterAllThis(() => {
                        autofocus && autofocusElementsWithTheAutofocusAttribute()

                        nowInitializeAlpineOnTheNewPage(Alpine)

                        fireEventForOtherLibrariesToHookInto('alpine:navigated')
                    })
                })
            })
        },
    )

    setTimeout(() => {
        fireEventForOtherLibrariesToHookInto('alpine:navigated')
    })
}

function fetchHtmlOrUsePrefetchedHtml(fromDestination: URL, callback: (html: string, finalDestination: URL) => void, errorCallback: () => void) {
    getPretchedHtmlOr(fromDestination, callback, () => {
        fetchHtml(fromDestination, callback, errorCallback)
    })
}

function preventAlpineFromPickingUpDomChanges(Alpine: any, callback: (cb: (fn: () => void) => void) => void) {
    Alpine.stopObservingMutations()

    callback((afterAllThis) => {
        Alpine.startObservingMutations()

        queueMicrotask(() => {
            afterAllThis()
        })
    })
}

function fireEventForOtherLibrariesToHookInto(name: string, detail?: any) {
    let event = new CustomEvent(name, {
        cancelable: true,
        bubbles: true,
        detail,
    })

    document.dispatchEvent(event)

    return event.defaultPrevented
}

function nowInitializeAlpineOnTheNewPage(Alpine: any) {
    Alpine.initTree(document.body, undefined, (el: any, skip: Function) => {
        if (el._x_wasPersisted) skip()
    })
}

function autofocusElementsWithTheAutofocusAttribute() {
    (document.querySelector('[autofocus]') as HTMLElement)?.focus()
}

function cleanupAlpineElementsOnThePageThatArentInsideAPersistedElement() {
    const Alpine = (window as any).Alpine;
    
    Alpine.walk(document.body, (el: any, skip: Function) => {
        if (isPersistedElement(el)) return skip()
        if (isTeleportTarget(el)) return skip()

        if (el._x_cleanups) {
            while (el._x_cleanups.length) el._x_cleanups.pop()()
        }
    })
}