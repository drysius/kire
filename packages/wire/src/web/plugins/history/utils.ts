export function unwrap(object: any): any {
    if (object === undefined) return undefined
    return JSON.parse(JSON.stringify(object))
}

export function isObjecty(subject: any) { return (typeof subject === 'object' && subject !== null) }

export function batch(callback: (updates: any) => void) {
    let batch = {
        queued: false,
        updates: {} as any,
        add(updates: any) {
            Object.assign(batch.updates, updates)
            if (batch.queued) return
            batch.queued = true
            queueMicrotask(() => batch.flush())
        },
        flush() {
            if (Object.keys(batch.updates).length) {
                callback(batch.updates)
            }
            batch.queued = false
            batch.updates = {}
        },
    }
    return batch
}