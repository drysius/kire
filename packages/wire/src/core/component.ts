import type { Kire } from "kire";
import { RuleEngine } from "./rule";
import type { WireStream } from "../types";

export abstract class Component {
    public __id: string = Math.random().toString(36).slice(2);
    public __name = "";
    
    // Internal State Management
    protected __events: Array<{ name: string; params: any[] }> = [];
    protected __streams: Array<WireStream> = [];
    protected __redirect: string | null = null;
    protected __errors: Record<string, string> = {};
    protected __urlUpdate: string | undefined = undefined;

    // Custom configuration
    public casts: Record<string, any> = {};
    public listeners: Record<string, string> = {};
    public queryString: string[] = [];

    // Kire context
    protected kire!: Kire;
    public $globals: Record<string, any> = {};
    public $props: Record<string, any> = {};

    constructor() {
        // Automatic change detection via Proxy
        return new Proxy(this, {
            set: (target, prop, value, receiver) => {
                const oldVal = (target as any)[prop];
                const res = Reflect.set(target, prop, value, receiver);
                if (res && oldVal !== value && typeof prop === 'string' && !prop.startsWith('__')) {
                    this.updated(prop, value);
                }
                return res;
            }
        });
    }

    public _setKire(kire: Kire) {
        this.kire = kire;
        this.$globals = kire.$globals;
        this.$props = kire.$props;
    }

    // --- Lifecycle Hooks ---
    public async mount(..._args: any[]): Promise<void> {}
    public async hydrate(): Promise<void> {}
    public async updating(name: string, value: any): Promise<void> {}
    public async updated(name: string, value: any): Promise<void> {}
    public async rendering(): Promise<void> {}
    public async rendered(): Promise<void> {}

    // --- Side Effects ---
    public emit(name: string, ...params: any[]) {
        this.__events.push({ name, params });
    }

    public stream(target: string, content: string, replace = false, method: WireStream['method'] = 'update') {
        this.__streams.push({ target, content, replace, method });
    }

    public redirect(url: string) {
        this.__redirect = url;
    }

    // --- Validation ---
    public validate(rules: Record<string, string | Function>): boolean {
        this.clearErrors();
        let isValid = true;
        const state = this.getPublicProperties();

        for (const [prop, rule] of Object.entries(rules)) {
            const val = (this as any)[prop];
            if (typeof rule === 'string') {
                const result = RuleEngine.validate(val, rule, state);
                if (!result.success) {
                    this.addError(prop, result.error!);
                    isValid = false;
                }
            } else if (typeof rule === 'function') {
                const result = rule(val, state);
                if (result === false || typeof result === 'string') {
                    this.addError(prop, typeof result === 'string' ? result : 'Invalid');
                    isValid = false;
                }
            }
        }
        return isValid;
    }

    public addError(field: string, message: string) {
        this.__errors[field] = message;
    }

    public clearErrors(field?: string) {
        if (field) delete this.__errors[field];
        else this.__errors = {};
    }

    // --- State Serialization ---
    public fill(state: Record<string, any>) {
        for (const [key, value] of Object.entries(state)) {
            if (key in this && !key.startsWith('__')) {
                if (this.casts[key] && value && typeof value === 'object' && !Array.isArray(value)) {
                    const Target = this.casts[key];
                    const instance = new Target();
                    if (typeof instance.fill === 'function') instance.fill(value);
                    else Object.assign(instance, value);
                    (this as any)[key] = instance;
                } else {
                    (this as any)[key] = value;
                }
            }
        }
    }

    public getPublicProperties(): Record<string, any> {
        const props: Record<string, any> = {};
        const keys = Object.getOwnPropertyNames(this);
        for (const key of keys) {
            if (key.startsWith('__') || key.startsWith('$') || key === 'kire' || key === 'casts' || key === 'listeners' || key === 'queryString' || typeof (this as any)[key] === 'function') continue;
            props[key] = (this as any)[key];
        }
        // Proto getters
        let proto = Object.getPrototypeOf(this);
        while (proto && proto !== Component.prototype && proto !== Object.prototype) {
            for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
                if (desc.get && !key.startsWith('__')) {
                    try { props[key] = (this as any)[key]; } catch {}
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        return props;
    }

    public _getEffects() {
        return {
            events: this.__events,
            streams: this.__streams,
            redirect: this.__redirect,
            errors: this.__errors,
            url: this.__urlUpdate
        };
    }

    protected view(path: string, locals: Record<string, any> = {}): string | Promise<string> {
        if (!this.kire) throw new Error("Kire instance not available");
        return this.kire.view(path, { ...this.getPublicProperties(), errors: this.__errors, ...locals }) as any;
    }

    public abstract render(): string | Promise<string>;
}
