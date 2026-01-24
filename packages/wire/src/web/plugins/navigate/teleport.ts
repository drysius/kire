export function packUpPersistedTeleports(persistedEl: Element) {
    (window as any).Alpine.mutateDom(() => {
        persistedEl.querySelectorAll('[data-teleport-template]').forEach((i: any) => i._x_teleport.remove())
    })
}

export function removeAnyLeftOverStaleTeleportTargets(body: Element) {
    (window as any).Alpine.mutateDom(() => {
        body.querySelectorAll('[data-teleport-target]').forEach(i => i.remove())
    })
}

export function unPackPersistedTeleports(persistedEl: Element) {
    (window as any).Alpine.walk(persistedEl, (el: any, skip: Function) => {
        if (! el._x_teleport) return;
        el._x_teleportPutBack()
        skip()
    })
}

export function isTeleportTarget(el: Element) {
    return el.nodeType === 1 && el.hasAttribute('data-teleport-target')
}