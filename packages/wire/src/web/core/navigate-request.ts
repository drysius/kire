import { trigger } from "./hooks";

export async function sendNavigateRequest(uri: string, callback: (html: string, destination: URL, status: number) => void, errorCallback: (error: any) => void) {
    let controller = new AbortController()
    let options = {
        headers: {
            'X-Kirewire-Navigate': '1', 
        },
        signal: controller.signal,
    }

    trigger('navigate.request', {
        uri,
        options,
    })

    try {
        let response = await fetch(uri, options)
        let destination = new URL(response.url)
        let html = await response.text()
        let status = response.status

        callback(html, destination, status)
    } catch (error) {
        errorCallback(error)
        throw error
    }
}