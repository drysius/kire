export type WireDirectiveInfo = { 
    modifiers: string[], 
    expression: string, 
    value?: string 
};

export type WireDirectiveHandler = (
    el: HTMLElement, 
    info: WireDirectiveInfo, 
    extra: { Alpine: any, component: any }
) => void;

export const handlers = new Map<string, WireDirectiveHandler>();

export function registerWireHandler(name: string, handler: WireDirectiveHandler) {
    handlers.set(name, handler);
}
