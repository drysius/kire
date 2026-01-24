export function packUpPersistedPopovers(persistedEl: Element) {
    if (!isPopoverSupported()) return;

    persistedEl.querySelectorAll(':popover-open').forEach((el: any) => {
        el.setAttribute('data-navigate-popover-open', '')

        let animations = el.getAnimations()

        el._pausedAnimations = animations.map((animation: Animation) => ({
            keyframes: (animation.effect as KeyframeEffect).getKeyframes(),
            options: {
                duration: (animation.effect as KeyframeEffect).getTiming().duration,
                easing: (animation.effect as KeyframeEffect).getTiming().easing,
                fill: (animation.effect as KeyframeEffect).getTiming().fill,
                iterations: (animation.effect as KeyframeEffect).getTiming().iterations
            },
            currentTime: animation.currentTime,
            playState: animation.playState
        }))

        animations.forEach((i: Animation) => i.pause())
    })
}

export function unPackPersistedPopovers(persistedEl: Element) {
    if (!isPopoverSupported()) return;

    persistedEl.querySelectorAll('[data-navigate-popover-open]').forEach((el: any) => {
        el.removeAttribute('data-navigate-popover-open')

        queueMicrotask(() => {
            if (! el.isConnected) return

            el.showPopover()

            el.getAnimations().forEach((i: Animation) => i.finish())

            if (el._pausedAnimations) {
                el._pausedAnimations.forEach(({keyframes, options, currentTime}: any) => {
                    let animation = el.animate(keyframes, options);
                    animation.currentTime = currentTime;
                })
                delete el._pausedAnimations
            }
        })
    })
}

function isPopoverSupported() {
    return typeof document.createElement('div').showPopover === 'function';
}