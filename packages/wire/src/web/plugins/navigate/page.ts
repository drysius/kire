let oldBodyScriptTagHashes: number[] = []

let attributesExemptFromScriptTagHashing = [
    'data-csrf',
    'nonce',
    'aria-hidden',
]

export function swapCurrentPageWithNewHtml(html: string, andThen: (cb: Function) => void) {
    let newDocument = (new DOMParser()).parseFromString(html, "text/html")
    let newHtml = newDocument.documentElement
    let newBody = document.adoptNode(newDocument.body)
    let newHead = document.adoptNode(newDocument.head)

    oldBodyScriptTagHashes = oldBodyScriptTagHashes.concat(Array.from(document.body.querySelectorAll('script')).map(i => {
        return simpleHash(ignoreAttributes(i.outerHTML, attributesExemptFromScriptTagHashing))
    }))

    let afterRemoteScriptsHaveLoaded = () => {}

    replaceHtmlAttributes(newHtml)

    mergeNewHead(newHead).finally(() => {
        afterRemoteScriptsHaveLoaded()
    })

    prepNewBodyScriptTagsToRun(newBody, oldBodyScriptTagHashes)

    let oldBody = document.body

    document.body.replaceWith(newBody);

    (window as any).Alpine.destroyTree(oldBody)

    andThen((i: Function) => afterRemoteScriptsHaveLoaded = i as any)
}

function prepNewBodyScriptTagsToRun(newBody: HTMLElement, oldBodyScriptTagHashes: number[]) {
    newBody.querySelectorAll('script').forEach(i => {
        if (i.hasAttribute('data-navigate-once')) {
            let hash = simpleHash(
                ignoreAttributes(i.outerHTML, attributesExemptFromScriptTagHashing)
            )
            if (oldBodyScriptTagHashes.includes(hash)) return
        }
        i.replaceWith(cloneScriptTag(i))
    })
}

function replaceHtmlAttributes(newHtmlElement: HTMLElement) {
    let currentHtmlElement = document.documentElement

    Array.from(newHtmlElement.attributes).forEach(attr => {
        const name = attr.name
        const value = attr.value
        if (currentHtmlElement.getAttribute(name) !== value) {
            currentHtmlElement.setAttribute(name, value)
        }
    })

    Array.from(currentHtmlElement.attributes).forEach(attr => {
        if (!newHtmlElement.hasAttribute(attr.name)) {
            currentHtmlElement.removeAttribute(attr.name)
        }
    })
}

async function mergeNewHead(newHead: HTMLElement) {
    let children = Array.from(document.head.children)
    let headChildrenHtmlLookup = children.map(i => i.outerHTML)

    let garbageCollector = document.createDocumentFragment()
    let touchedHeadElements: Element[] = []
    let remoteScriptsPromises: Promise<any>[] = []

    for (let child of Array.from(newHead.children)) {
        if (isAsset(child)) {
            if (! headChildrenHtmlLookup.includes(child.outerHTML)) {
                if (isTracked(child)) {
                    if (ifTheQueryStringChangedSinceLastRequest(child, children)) {
                        setTimeout(() => window.location.reload())
                    }
                }

                if (isScript(child)) {
                    try {
                        remoteScriptsPromises.push(
                            injectScriptTagAndWaitForItToFullyLoad(
                                cloneScriptTag(child as HTMLScriptElement)
                            )
                        )
                    } catch (error) {
                        // ignore
                    }
                } else {
                    document.head.appendChild(child)
                }
            } else {
                garbageCollector.appendChild(child)
            }
            touchedHeadElements.push(child)
        }
    }

    for (let child of Array.from(document.head.children)) {
        if (! isAsset(child)) child.remove()
    }

    for (let child of Array.from(newHead.children)) {
        if (child.tagName.toLowerCase() === 'noscript') continue
        document.head.appendChild(child)
    }

    return Promise.all(remoteScriptsPromises)
}

async function injectScriptTagAndWaitForItToFullyLoad(script: HTMLScriptElement) {
    return new Promise<void>((resolve, reject) => {
        if (script.src) {
            script.onload = () => resolve()
            script.onerror = () => reject()
        } else {
            resolve()
        }
        document.head.appendChild(script)
    })
}

function cloneScriptTag(el: HTMLScriptElement) {
    let script = document.createElement('script')
    script.textContent = el.textContent
    script.async = el.async
    for (let attr of Array.from(el.attributes)) {
        script.setAttribute(attr.name, attr.value)
    }
    return script
}

function isTracked(el: Element) {
    return el.hasAttribute('data-navigate-track')
}

function ifTheQueryStringChangedSinceLastRequest(el: Element, currentHeadChildren: Element[]) {
    let [uri, queryString] = extractUriAndQueryString(el)
    return currentHeadChildren.some(child => {
        if (! isTracked(child)) return false
        let [currentUri, currentQueryString] = extractUriAndQueryString(child)
        if (currentUri === uri && queryString !== currentQueryString) return true
    })
}

function extractUriAndQueryString(el: Element) {
    let url = isScript(el) ? (el as HTMLScriptElement).src : (el as HTMLLinkElement).href
    return url.split('?')
}

function isAsset(el: Element) {
    return (el.tagName.toLowerCase() === 'link' && el.getAttribute('rel')?.toLowerCase() === 'stylesheet')
        || el.tagName.toLowerCase() === 'style'
        || el.tagName.toLowerCase() === 'script'
}

function isScript(el: Element) {
    return el.tagName.toLowerCase() === 'script'
}

function simpleHash(str: string) {
    return str.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
    }, 0);
}

function ignoreAttributes(subject: string, attributesToRemove: string[]) {
    let result = subject
    attributesToRemove.forEach(attr => {
        const regex = new RegExp(`${attr}="[^"]*"|${attr}='[^']*'`, 'g')
        result = result.replace(regex, '')
    })
    return result.replace(/\s/g, '').trim() // simplified replaceAll ' '
}