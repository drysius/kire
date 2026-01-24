export function storeScrollInformationInHtmlBeforeNavigatingAway() {
    document.body.setAttribute('data-scroll-x', String(document.body.scrollLeft))
    document.body.setAttribute('data-scroll-y', String(document.body.scrollTop))

    const bs = String.fromCharCode(92);
    const selector = `[x-navigate${bs}:scroll], [wire${bs}:navigate${bs}:scroll]`;

    document.querySelectorAll(selector).forEach(el => {
        el.setAttribute('data-scroll-x', String(el.scrollLeft))
        el.setAttribute('data-scroll-y', String(el.scrollTop))
    })
}

export function restoreScrollPositionOrScrollToTop() {
    let scroll = (el: Element) => {
        if (! el.hasAttribute('data-scroll-x')) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        } else {
            el.scrollTo({
                top: Number(el.getAttribute('data-scroll-y')),
                left: Number(el.getAttribute('data-scroll-x')),
                behavior: 'instant',
            })
            el.removeAttribute('data-scroll-x')
            el.removeAttribute('data-scroll-y')
        }
    }

    const bs = String.fromCharCode(92);
    const selector = `[x-navigate${bs}:scroll], [wire${bs}:navigate${bs}:scroll]`;

    queueMicrotask(() => {
        queueMicrotask(() => { 
            scroll(document.body)
            document.querySelectorAll(selector).forEach(scroll)
        })
    })
}