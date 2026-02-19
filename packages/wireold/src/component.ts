import { randomUUID } from "node:crypto";
import type { Kire } from "kire";
import type { WireContext } from "./types";
import { WireFile } from "./core/file";
import { Rule, validateRule } from "./core/rule";
import type { TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

export abstract class WireComponent {
	public __id: string = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
	public __name = "";
	public __events: Array<{ event: string; params: any[] }> = [];
	public __streams: Array<{
		target: string;
		content: string;
		replace?: boolean;
		method?: string;
	}> = [];
	public __redirect: string | null = null;
	public __errors: Record<string, string> = {};
	public listeners: Record<string, string> = {}; // event -> method

	// Properties to sync with URL query string
	public queryString: string[] = [];

	public context: WireContext = { kire: undefined as any };
	public params: Record<string, any> = {};

    /**
     * Map of property names to class constructors for automatic hydration.
     */
    public casts: Record<string, any> = {};

    public $globals: Record<string, any> = {};
    public $props: Record<string, any> = {};

    private _updateCallbacks: Array<(updates: Record<string, any>) => void> = [];

    constructor(public kire: Kire) {
        if (kire) {
            this.$globals = kire.$globals;
            this.$props = kire.$props;
        }
        
        // Wrap this instance in a Proxy to detect changes automatically
        return new Proxy(this, {
            set: (target, prop, value, receiver) => {
                const oldVal = (target as any)[prop];
                const res = Reflect.set(target, prop, value, receiver);
                
                if (res && oldVal !== value && typeof prop === 'string' && !prop.startsWith('_')) {
                    this.onUpdateState({ [prop]: value });
                }
                return res;
            }
        });
    }

	public async mount(..._args: unknown[]): Promise<void> {
        await this.onComponentMount();
    }
    
	public async unmount(): Promise<void> {
        await this.onComponentUnMount();
    }

	public async updated(name: string, value: unknown): Promise<void> {}
	public async updating(name: string, value: unknown): Promise<void> {}
	public async hydrated(): Promise<void> {}
	public async rendered(): Promise<void> {
        await this.onComponentRender();
    }

    // --- New Hooks ---
    
    public async onUpdateState(updates: Record<string, any>): Promise<void> {
        for (const cb of this._updateCallbacks) {
            cb(updates);
        }
    }

    public async onComponentMount(): Promise<void> {}
    public async onComponentUnMount(): Promise<void> {}
    public async onComponentRender(): Promise<void> {}

    // Internal hook for broadcast sync
    public _onUpdate(callback: (updates: Record<string, any>) => void) {
        this._updateCallbacks.push(callback);
    }

    // --- Core Logic ---

    public rule(rules: string, message?: string) {
        return { _is_rule_helper: true, rules, message };
    }

	public validate(
		rules: Record<string, ((val: any) => string | boolean | undefined) | Rule | string | TSchema | { _is_rule_helper: boolean; rules: string; message?: string } | any[]>,
	) {
		this.clearErrors();
		let isValid = true;
		for (const [prop, validatorOrArray] of Object.entries(rules)) {
			const val = (this as any)[prop];
            const validators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];

            for (const validator of validators) {
                if (typeof validator === 'string') {
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
                } else if (typeof validator === 'object' && validator !== null) {
                    if ('kind' in validator || 'type' in validator) {
                         const C = TypeCompiler.Compile(validator as TSchema);
                         if (!C.Check(val)) {
                             const error = [...C.Errors(val)][0];
                             this.addError(prop, error?.message || "Invalid");
                             isValid = false;
                             break;
                         }
                    }
                    else if ('_is_rule_helper' in validator && (validator as any)._is_rule_helper) {
                        const helper = validator as any;
                        const result = validateRule(val, helper.rules, helper.message);
                        if (!result.success) {
                            this.addError(prop, result.error || "Invalid");
                            isValid = false;
                            break;
                        }
                    }
                } else if (typeof validator === 'function') {
                    const result = validator(val);
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

	public abstract render(): Promise<string | ReadableStream> | string | ReadableStream;

	protected async view(
		path: string,
		locals: Record<string, unknown> = {},
	): Promise<string | ReadableStream> {
		if (!this.kire) throw new Error("Kire instance not injected");
		const data = {
			...this.getDataForRender(),
			errors: this.__errors,
			...locals,
		};

		return this.kire.view(path, data) as any;
	}

	protected async html(
		template: string,
		locals: Record<string, unknown> = {},
	): Promise<string| ReadableStream> {
		if (!this.kire) throw new Error("Kire instance not injected");
		const data = {
			...this.getDataForRender(),
			errors: this.__errors,
			...locals,
		};

		return this.kire.render(template, data) as any;
	}

	public emit(event: string, ...params: any[]) {
		this.__events.push({ event, params });
	}

	public stream(
		target: string,
		content: string,
		replace = false,
		method = "update",
	) {
		this.__streams.push({ target, content, replace, method });
	}

	public redirect(url: string) {
		this.__redirect = url;
	}

	public addError(field: string, message: string) {
		this.__errors[field] = message;
	}

	public clearErrors(field?: string) {
		if (field) {
			delete this.__errors[field];
		} else {
			this.__errors = {};
		}
	}

	public getPublicProperties(): Record<string, unknown> {
		const props: Record<string, unknown> = {};
		const keys = Object.getOwnPropertyNames(this);
		for (const key of keys) {
			if (
				key.startsWith("_") ||
				key === "$globals" ||
				key === "$props" ||
				key === "kire" ||
				key === "context" ||
				key === "queryString" ||
                key === "casts"
			)
				continue;

			const val = (this as any)[key];
			if (typeof val !== "function") {
				props[key] = val;
			}
		}
		return props;
	}

	public getDataForRender(): Record<string, unknown> {
		const props = this.getPublicProperties();

		let proto = Object.getPrototypeOf(this);
		while (
			proto &&
			proto !== WireComponent.prototype &&
			proto !== Object.prototype
		) {
			const descriptors = Object.getOwnPropertyDescriptors(proto);
			for (const [key, descriptor] of Object.entries(descriptors)) {
				if (key.startsWith("_") || key === "constructor") continue;
				if (descriptor.get) {
					try {
						props[key] = (this as any)[key];
					} catch (e) {}
				}
			}
			proto = Object.getPrototypeOf(proto);
		}

		return props;
	}

	public fill(state: Record<string, unknown>) {
		for (const [key, value] of Object.entries(state)) {
			if (
				key in this &&
				!key.startsWith("_") &&
				key !== "jti" &&
				key !== "iat" &&
				key !== "exp" &&
                key !== "casts"
			) {
                if ((this as any)[key] instanceof WireFile && value && typeof value === 'object' && (value as any)._wire_type === 'WireFile') {
                    (this as any)[key].options = (value as any).options;
                    (this as any)[key].files = (value as any).files;
                } 
                else if (this.casts[key] && value && typeof value === 'object' && !Array.isArray(value)) {
                    const TargetClass = this.casts[key];
                    const instance = new TargetClass();
                    
                    if (typeof instance.fill === 'function') {
                        instance.fill(value);
                    } else {
                        Object.assign(instance, value);
                    }
                    
                    (this as any)[key] = instance;
                }
                else {
				    (this as any)[key] = value;
                }
			}
		}
	}
}
