import type { Component } from "./component";
import type { Directive } from "./directives";

export type DirectiveHandler = (el: HTMLElement, directive: Directive, component: Component) => void;

const directives = new Map<string, DirectiveHandler>();

export function directive(name: string, handler: DirectiveHandler) {
    directives.set(name, handler);
}

export function getDirectiveHandler(name: string) {
    return directives.get(name);
}
