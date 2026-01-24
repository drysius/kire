import historyCoordinator from "./coordinator"
import { unwrap, isObjecty } from "./utils"

export default function history(Alpine: any) {
    Alpine.magic('queryString', (el: HTMLElement, { interceptor }: any) =>  {
        let alias: string | undefined
        let alwaysShow = false
        let usePush = false

        return interceptor((initialSeedValue: any, getter: Function, setter: Function, path: string, key: string) => {
            let queryKey = alias || path

            let { initial, replace, push, pop } = track(queryKey, initialSeedValue, alwaysShow)

            setter(initial)

            if (! usePush) {
                Alpine.effect(() => replace(getter()))
            } else {
                Alpine.effect(() => push(getter()))

                pop(async (newValue: any) => {
                    setter(newValue)
                    // ...so that we preserve the internal lock...
                    await Promise.resolve() 
                })
            }

            return initial
        }, (func: any) => {
            func.alwaysShow = () => { alwaysShow = true; return func }
            func.usePush = () => { usePush = true; return func }
            func.as = (key: string) => { alias = key; return func }
        })
    })

    (Alpine as any).history = { track }
}

export function track(name: string, initialSeedValue: any, alwaysShow = false, except: any = null) {
    let { has, get, set, remove } = queryStringUtils()

    let url = historyCoordinator.getUrl()
    let isInitiallyPresentInUrl = has(url, name)
    let initialValue = isInitiallyPresentInUrl ? get(url, name) : initialSeedValue
    let initialValueMemo = JSON.stringify(initialValue)
    let exceptValueMemo = JSON.stringify(except)

    let hasReturnedToInitialValue = (newValue: any) => JSON.stringify(newValue) === initialValueMemo
    let hasReturnedToExceptValue = (newValue: any) =>  JSON.stringify(newValue) === exceptValueMemo

    if (alwaysShow) url = set(url, name, initialValue)

    replace(url, name, { value: initialValue })

    let lock = false

    let update = (strategy: Function, newValue: any) => {
        if (lock) return

        let url = historyCoordinator.getUrl()

        if (! alwaysShow && ! isInitiallyPresentInUrl && hasReturnedToInitialValue(newValue)) {
            url = remove(url, name)
        } else if (newValue === undefined) {
            url = remove(url, name)
        } else if (! alwaysShow && hasReturnedToExceptValue(newValue)) {
            url = remove(url, name)
        } else {
            url = set(url, name, newValue)
        }

        strategy(url, name, { value: newValue})
    }

    return {
        initial: initialValue,

        replace(newValue: any) { // Update via replaceState...
            update(replace, newValue)
        },

        push(newValue: any) { // Update via pushState...
            update(push, newValue)
        },

        pop(receiver: Function) { // "popstate" handler...
            let handler = (e: PopStateEvent) => {
                if (! e.state || ! e.state.alpine) return

                Object.entries(e.state.alpine).forEach(([iName, { value: newValue }]: any) => {
                    if (iName !== name) return

                    lock = true

                    let result = receiver(newValue)

                    if (result instanceof Promise) {
                        result.finally(() => lock = false)
                    } else {
                        lock = false
                    }
                })
            }

            window.addEventListener('popstate', handler)

            return () => window.removeEventListener('popstate', handler)
        }
    }
}

function replace(url: URL, key: string, object: any) {
    historyCoordinator.replaceState(url, { [key]: object })
}

function push(url: URL, key: string, object: any) {
    historyCoordinator.pushState(url, { [key]: object })
}

function queryStringUtils() {
    return {
        has(url: URL, key: string) {
            let search = url.search
            if (! search) return false
            let data = fromQueryString(search, key)
            return Object.keys(data).includes(key)
        },
        get(url: URL, key: string) {
            let search = url.search
            if (! search) return false
            let data = fromQueryString(search, key)
            return data[key]
        },
        set(url: URL, key: string, value: any) {
            let data = fromQueryString(url.search, key)
            data[key] = stripNulls(unwrap(value))
            url.search = toQueryString(data)
            return url
        },
        remove(url: URL, key: string) {
            let data = fromQueryString(url.search, key)
            delete data[key]
            url.search = toQueryString(data)
            return url
        },
    }
}

function stripNulls(value: any) {
    if (! isObjecty(value)) return value
    for (let key in value) {
        if (value[key] === null) delete value[key]
        else value[key] = stripNulls(value[key])
    }
    return value
}

function toQueryString(data: any) {
    let isObjecty = (subject: any) => typeof subject === 'object' && subject !== null

    let buildQueryStringEntries = (data: any, entries: any = {}, baseKey = '') => {
        Object.entries(data).forEach(([iKey, iValue]) => {
            let key = baseKey === '' ? iKey : `${baseKey}[${iKey}]`

            if (iValue === null) {
                entries[key] = '';
            } else if (! isObjecty(iValue)) {
                entries[key] = encodeURIComponent(iValue as string)
                    .replaceAll('%20', '+')
                    .replaceAll('%2C', ',')
            } else {
                entries = {...entries, ...buildQueryStringEntries(iValue, entries, key)}
            }
        })
        return entries
    }

    let entries = buildQueryStringEntries(data)
    return Object.entries(entries).map(([key, value]) => `${key}=${value}`).join('&')
}

function fromQueryString(search: string, queryKey: string) {
    search = search.replace('?', '')
    if (search === '') return {}

    let insertDotNotatedValueIntoData = (key: string, value: any, data: any) => {
        let [first, second, ...rest] = key.split('.')
        if (! second) return data[key] = value
        if (data[first] === undefined) {
            data[first] = isNaN(Number(second)) ? {} : []
        }
        insertDotNotatedValueIntoData([second, ...rest].join('.'), value, data[first])
    }

    let entries = search.split('&').map(i => i.split('='))
    let data: any = Object.create(null)

    entries.forEach(([key, value]) => {
        if ( typeof value == 'undefined' ) return;
        value = decodeURIComponent(value.replaceAll('+', '%20'))
        let decodedKey = decodeURIComponent(key)
        let shouldBeHandledAsArray = decodedKey.includes('[') && decodedKey.startsWith(queryKey)

        if (!shouldBeHandledAsArray) {
            data[key] = value
        } else {
            let dotNotatedKey = decodedKey.replaceAll('[', '.').replaceAll(']', '')
            insertDotNotatedValueIntoData(dotNotatedKey, value, data)
        }
    })
    return data
}