import { Kirewire } from "../kirewire";

const channelByComponentId = new Map<string, string>();
const channelByElement = new WeakMap<HTMLElement, string>();
const CHANNEL_PATTERN = /^[a-zA-Z0-9:_-]{1,120}$/;

function resolveChannel(expression: string): string | null {
    const value = String(expression || "").trim();
    if (!value) return null;
    if (!CHANNEL_PATTERN.test(value)) return null;
    return value;
}

function resolveRootElement(el: HTMLElement): HTMLElement | null {
    if (el.hasAttribute("wire:id") || el.hasAttribute("wire-id")) return el;
    return el.closest("[wire\\:id], [wire-id]") as HTMLElement | null;
}

function bindElementToChannel(el: HTMLElement, channel: string, wire: typeof Kirewire) {
    const root = resolveRootElement(el);
    if (!root) return;

    const id = wire.getComponentId(root);
    if (!id) return;

    channelByComponentId.set(id, channel);
    channelByElement.set(root, channel);
    root.setAttribute("wire:broadcast", channel);
}

Kirewire.directive("broadcast", ({ el, expression, wire }) => {
    const channel = resolveChannel(expression);
    if (!channel) return;
    bindElementToChannel(el, channel, wire);
});

Kirewire.$on("component:update", (payload) => {
    const id = String(payload?.id || "");
    if (!id) return;

    let channel = channelByComponentId.get(id);
    if (!channel) {
        const root = document.querySelector(`[wire\\:id="${id}"], [wire-id="${id}"]`) as HTMLElement | null;
        if (root) {
            const attrChannel = resolveChannel(root.getAttribute("wire:broadcast") || "");
            channel = channelByElement.get(root) || attrChannel || undefined;
            if (channel) {
                channelByComponentId.set(id, channel);
                channelByElement.set(root, channel);
            }
        }
    }

    if (!channel) return;
    Kirewire.$emit(`broadcast:${channel}`, { ...payload, channel });
});
