import type { Kire } from "kire";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import type { TSchema } from "@sinclair/typebox";
import { Rule, RuleEngine, validateRule } from "./rule";
import { FileUpload } from "./upload";
import { WireBroadcast } from "./broadcast";
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
    private __updateCallbacks: Array<(updates: Record<string, any>) => void> = [];

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
                    for (const cb of this.__updateCallbacks) {
                        cb({ [prop]: value });
                    }
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

    public rule(rules: string, message?: string) {
        return { _is_rule_helper: true, rules, message };
    }

    // --- Validation ---
    public validate(
        rules: Record<
            string,
            (
                (val: any, state?: Record<string, any>) => string | boolean | undefined
            ) | Rule | string | TSchema | { _is_rule_helper: boolean; rules: string; message?: string } | any[]
        >
    ): boolean {
        this.clearErrors();
        let isValid = true;
        const state = this.getPublicProperties();

        for (const [prop, validatorOrArray] of Object.entries(rules)) {
            const val = (this as any)[prop];
            const validators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];

            for (const validator of validators) {
                if (typeof validator === "string") {
                    const result = validateRule(val, validator);
                    if (!result.success) {
                        this.addError(prop, result.error || "Invalid");
                        isValid = false;
                        break;
                    }
                } else if (validator instanceof Rule) {
                    const result = validator.validate(val);
                    if (!result.success) {
                        this.addError(prop, result.errors[0] || "Invalid");
                        isValid = false;
                        break;
                    }
                } else if (typeof validator === "object" && validator !== null) {
                    if ("kind" in validator || "type" in validator) {
                        const compiled = TypeCompiler.Compile(validator as TSchema);
                        const valToValidate = val && typeof val === "object" && Array.isArray((val as any).files) ? (val as any).files : val;
                        if (!compiled.Check(valToValidate)) {
                            const error = [...compiled.Errors(valToValidate)][0];
                            this.addError(prop, error?.message || "Invalid");
                            isValid = false;
                            break;
                        }
                    } else if ("_is_rule_helper" in validator && (validator as any)._is_rule_helper) {
                        const helper = validator as any;
                        const result = validateRule(val, helper.rules, helper.message);
                        if (!result.success) {
                            this.addError(prop, result.error || "Invalid");
                            isValid = false;
                            break;
                        }
                    } else {
                        const result = RuleEngine.validate(val, validator as any, state);
                        if (!result.success) {
                            this.addError(prop, result.error || "Invalid");
                            isValid = false;
                            break;
                        }
                    }
                } else if (typeof validator === "function") {
                    const result = validator(val, state);
                    if (result === false || typeof result === "string") {
                        this.addError(prop, typeof result === "string" ? result : "Invalid");
                        isValid = false;
                        break;
                    }
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
                if ((this as any)[key] instanceof FileUpload && value && typeof value === "object" && (value as any)._wire_type === "WireFile") {
                    (this as any)[key].options = (value as any).options || {};
                    (this as any)[key].files = (value as any).files || [];
                    (this as any)[key].uploading = (value as any).uploading || { progress: 100, percent: 100, loaded: 0, total: 0 };
                } else if (this.casts[key] && value && typeof value === 'object' && !Array.isArray(value)) {
                    const Target = this.casts[key];
                    const instance = new Target();
                    if (typeof instance.fill === 'function') instance.fill(value);
                    else Object.assign(instance, value);
                    (this as any)[key] = instance;
                } else if (typeof (this as any)[key] === "string" && value && typeof value === "object") {
                    (this as any)[key] = "";
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
            if ((this as any)[key] instanceof WireBroadcast) continue;
            props[key] = (this as any)[key];
        }
        return props;
    }

    public getDataForRender(): Record<string, any> {
        const props = this.getPublicProperties();
        let proto = Object.getPrototypeOf(this);
        while (proto && proto !== Component.prototype && proto !== Object.prototype) {
            for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
                if (desc.get && !key.startsWith('__') && key !== "constructor") {
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
            listeners: this.listeners,
            url: this.__urlUpdate
        };
    }

    public onUpdateState(callback: (updates: Record<string, any>) => void) {
        this.__updateCallbacks.push(callback);
    }

    protected view(path: string, locals: Record<string, any> = {}): string | Promise<string> {
        if (!this.kire) throw new Error("Kire instance not available");
        return this.kire.view(path, { ...this.getDataForRender(), errors: this.__errors, ...locals }) as any;
    }

    public abstract render(): string | Promise<string>;
}
