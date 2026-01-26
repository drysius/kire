import { randomUUID } from "node:crypto";
import type { Kire } from "kire";
import type { WireContext } from "./types";

export abstract class WireComponent {
	public __id: string = randomUUID();
	public __name = "";
	public __events: Array<{ name: string; params: any[] }> = [];
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

	public kire!: Kire;
	public context: WireContext = { kire: undefined as any };

	public async mount(..._args: unknown[]): Promise<void> {}
	public async updated(_name: string, _value: unknown): Promise<void> {}
	public async updating(_name: string, _value: unknown): Promise<void> {}
	public async hydrated(): Promise<void> {}
	public async rendered(): Promise<void> {}

	/**
	 * Simple validation helper.
	 * In a real app, use Zod or similar.
	 * @param rules Object where key is property and value is a validation function or regex
	 */
	public validate(
		rules: Record<string, (val: any) => string | boolean | undefined>,
	) {
		this.clearErrors();
		let isValid = true;
		for (const [prop, validator] of Object.entries(rules)) {
			const val = (this as any)[prop];
			const result = validator(val);
			if (result === false || typeof result === "string") {
				this.addError(prop, typeof result === "string" ? result : "Invalid");
				isValid = false;
			}
		}
		return isValid;
	}

	public abstract render(): Promise<string> | string;

	protected async view(
		path: string,
		locals: Record<string, unknown> = {},
	): Promise<string> {
		if (!this.kire) throw new Error("Kire instance not injected");
		const data = {
			...this.getDataForRender(),
			errors: this.__errors,
			...locals,
		};

		// Prepare injection
		const keys = Object.keys(data).filter((k) =>
			/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k),
		);
		const keysHash = keys.join("|");
		const resolvedPath = this.kire.resolvePath(path);
		const cacheKey = `wire:${resolvedPath}:${keysHash}`;

		let compiled: Function | undefined;

		if (this.kire.production && this.kire.$files.has(cacheKey)) {
			compiled = this.kire.$files.get(cacheKey) as Function;
		} else {
			const content = await this.kire.$resolver(resolvedPath);
			const injection = keys.length
				? `<?js let { ${keys.join(", ")} } = $ctx.$props; ?>`
				: "";
			compiled = await this.kire.compileFn(injection + content);
			if (this.kire.production) {
				this.kire.$files.set(cacheKey, compiled);
			}
		}

		return this.kire.run(compiled, data);
	}

	/**
	 * Renders an inline Kire template string.
	 * @param template The Kire template string.
	 * @param locals Additional local variables.
	 */
	protected async html(
		template: string,
		locals: Record<string, unknown> = {},
	): Promise<string> {
		if (!this.kire) throw new Error("Kire instance not injected");
		const data = {
			...this.getDataForRender(),
			errors: this.__errors,
			...locals,
		};

		const keys = Object.keys(data).filter((k) =>
			/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k),
		);
		
		// Otimização: Cache de templates inline baseada no conteúdo
		// Usamos o md5 do template + keys injetadas como chave de cache
		const injection = keys.length
			? `<?js let { ${keys.join(", ")} } = $ctx.$props; ?>`
			: "";
			
		const fullTemplate = injection + template;
		
		// Se estiver em produção, tenta usar o cache
		if (this.kire.production) {
			// Usar um hash simples do template string como chave é arriscado se for muito longo
			// Mas para inline templates geralmente é ok. 
			// Melhor: usar o helper $md5 do contexto se disponível, ou o kire internal
			const cacheKey = `inline:${fullTemplate}`;
			
			if (this.kire.$files.has(cacheKey)) {
				const compiled = this.kire.$files.get(cacheKey) as Function;
				return this.kire.run(compiled, data);
			}
			
			const compiled = await this.kire.compileFn(fullTemplate);
			this.kire.$files.set(cacheKey, compiled);
			return this.kire.run(compiled, data);
		}

		return this.kire.render(fullTemplate, data);
	}

	/**
	 * Emits an event to the browser.
	 */
	public emit(event: string, ...params: any[]) {
		this.__events.push({ name: event, params });
	}

	/**
	 * Streams content to a specific target element on the client.
	 * @param target The wire:stream target name
	 * @param content The HTML content to stream
	 * @param replace If true, replaces the target element itself. If false, appends/prepends based on method.
	 * @param method 'append' | 'prepend' | 'update' | 'remove' (default: 'update' - replaces innerHTML)
	 */
	public stream(
		target: string,
		content: string,
		replace = false,
		method = "update",
	) {
		this.__streams.push({ target, content, replace, method });
	}

	/**
	 * Redirects the user to a new URL.
	 */
	public redirect(url: string) {
		this.__redirect = url;
	}

	/**
	 * Adds a validation error.
	 */
	public addError(field: string, message: string) {
		this.__errors[field] = message;
	}

	/**
	 * Clears errors.
	 */
	public clearErrors(field?: string) {
		if (field) {
			delete this.__errors[field];
		} else {
			this.__errors = {};
		}
	}

	/**
	 * Returns public properties to be persisted in the snapshot.
	 */
	public getPublicProperties(): Record<string, unknown> {
		const props: Record<string, unknown> = {};
		const keys = Object.getOwnPropertyNames(this);
		for (const key of keys) {
			if (
				key.startsWith("_") ||
				key === "kire" ||
				key === "context" ||
				key === "queryString"
			)
				continue;

			const val = (this as any)[key];
			if (typeof val !== "function") {
				props[key] = val;
			}
		}
		return props;
	}

	/**
	 * Returns data available for the view rendering, including getters.
	 */
	public getDataForRender(): Record<string, unknown> {
		const props = this.getPublicProperties();

		// Include Getters
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
					} catch (e) {
						// Ignore errors in getters during data collection
					}
				}
			}
			proto = Object.getPrototypeOf(proto);
		}

		return props;
	}

	/**
	 * Fills component properties from the state.
	 */
	public fill(state: Record<string, unknown>) {
		for (const [key, value] of Object.entries(state)) {
			if (
				key in this &&
				!key.startsWith("_") &&
				key !== "jti" &&
				key !== "iat" &&
				key !== "exp"
			) {
				(this as any)[key] = value;
			}
		}
	}
}
