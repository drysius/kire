export function hasQueryParam(param: string) {
    let queryParams = new URLSearchParams(window.location.search);
    return queryParams.has(param)
}

export function getQueryParam(param: string) {
    let queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(param)
}

export function setQueryParam(param: string, value: string) {
    let queryParams = new URLSearchParams(window.location.search);
    queryParams.set(param, value)
    
    // Reconstruct URL
    let queryString = Array.from(queryParams.entries()).length > 0
        ? '?'+queryParams.toString()
        : ''
    let url = window.location.origin + window.location.pathname + queryString + window.location.hash

    window.history.replaceState(window.history.state, '', url)
}