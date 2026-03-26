import { Value } from "@sinclair/typebox/value";
import type { Kire, KireRendered } from "kire";
import { normalizeFileList, WireUpload } from "./features/file-upload";
import { WireBroadcast } from "./features/wire-broadcast";
import { getWireVariables, type WireVariableDefinition } from "./metadata";
import {
	type ComponentRuleDescriptor,
	isTypeBoxSchema,
	makeRuleDescriptor,
	type ValidationResult,
	validateRuleString,
	validateTypeBoxSchema,
} from "./validation/rule";
import { WireProperty } from "./wire-property";

export type WireEffect = {
	type: string;
	payload: any;
};

export type WireCollectionAction =
	| "replace"
	| "append"
	| "prepend"
	| "upsert"
	| "remove";
export type WireCollectionMode = "state" | "dom";

export type WireCollectionPayload = {
	name: string;
	action: WireCollectionAction;
	mode?: WireCollectionMode;
	path?: string;
	key?: string;
	keys?: Array<string | number>;
	items?: any[];
	content?: string;
	limit?: number;
	position?: "append" | "prepend";
};

const BLOCKED_SET_PATH_SEGMENTS = new Set([
	"__proto__",
	"constructor",
	"prototype",
]);

/**
 * Base Component class for Kirewire.
 */
export class Component {
	/**
	 * Enables client-first/live mode where the component can be instantiated
	 * and used without an initial server-side HTML render.
	 */
	public $live = false;

	/**
	 * Unique ID for this component instance on the page.
	 * Managed by Kirewire.
	 */
	public $id!: string;

	/**
	 * Reference to the Kire engine instance.
	 */
	protected $kire!: Kire;

	/**
	 * Renders the component view.
	 * @param view Path to the kire view file.
	 * @param data Additional locals for rendering.
	 */
	public view(view: string, data: Record<string, any> = {}): KireRendered {
		const locals: Record<string, any> = { ...(this as any), ...data };

		// Materialize computed getters as own props so they survive Kire fork
		// prop-merging (which can drop prototype chain from locals).
		let proto = Object.getPrototypeOf(this);
		while (proto && proto !== Object.prototype) {
			const descriptors = Object.getOwnPropertyDescriptors(proto);
			const keys = Object.keys(descriptors);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (key === "constructor" || key in locals) continue;
				const descriptor = descriptors[key];
				if (typeof descriptor.get === "function") {
					try {
						locals[key] = (this as any)[key];
					} catch {
						// Ignore failing computed getters during template hydration.
					}
				}
			}
			proto = Object.getPrototypeOf(proto);
		}

		if (!Object.hasOwn(locals, "errors")) {
			locals.errors = this.__errors;
		}

		(locals as any).$wire = this;
		return this.$kire.view(view, locals);
	}

	/**
	 * Helper to set property values from the client.
	 * Supports dot notation for nested properties.
	 */
	public $set(property: string, value: any) {
		const normalizedProperty = String(property || "").trim();
		if (!this.isPropertyWritable(normalizedProperty)) {
			throw new Error(`Property "${normalizedProperty}" is not writable.`);
		}

		if (!normalizedProperty.includes(".")) {
			const current = (this as any)[normalizedProperty];
			const declaration = this.getVariableDeclaration(normalizedProperty);
			(this as any)[normalizedProperty] = this.normalizeIncomingValue(
				current,
				value,
				declaration,
			);
			return;
		}

		const parts = normalizedProperty.split(".");
		const root = parts[0]!;
		const rootDeclaration = this.getVariableDeclaration(root);
		let obj = this as any;
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i]!;
			if (
				!(part in obj) ||
				obj[part] === null ||
				typeof obj[part] !== "object"
			) {
				obj[part] = {};
			}
			obj = obj[part];
		}
		const leaf = parts[parts.length - 1]!;
		obj[leaf] = this.normalizeIncomingValue(obj[leaf], value);

		if (rootDeclaration) {
			const rootValue = (this as any)[root];
			(this as any)[root] = this.normalizeIncomingValue(
				rootValue,
				rootValue,
				rootDeclaration,
			);
		}
	}

	/**
	 * Adapter-level helper for validating incoming $set paths.
	 * Keeps authorization checks centralized in Component.
	 */
	public $canSet(property: string): boolean {
		return this.isPropertyWritable(property);
	}

	public validate(
		rules: Record<
			string,
			| string
			| ComponentRuleDescriptor
			| ((
					value: any,
					state?: Record<string, any>,
			  ) => boolean | string | undefined)
			| any[]
		>,
	): boolean {
		this.clearErrors();
		let isValid = true;
		const state = this.getPublicState();

		for (const [field, validatorOrArray] of Object.entries(rules || {})) {
			const value = this.getValueByPath(field);
			const validators = Array.isArray(validatorOrArray)
				? validatorOrArray
				: [validatorOrArray];

			for (const validator of validators) {
				const result = this.runValidator(value, validator, state);
				if (!result.success) {
					this.addError(field, result.error || "Invalid");
					isValid = false;
					break;
				}
			}
		}

		return isValid;
	}

	public rule(ruleStr: string, message?: string): ComponentRuleDescriptor {
		return makeRuleDescriptor(ruleStr, message);
	}

	/**
	 * Error bag for form-like components.
	 */
	protected __errors: Record<string, string> = {};

	/**
	 * Internal tracking of side effects to be sent to the client.
	 */
	public __effects: Array<WireEffect> = [];

	/**
	 * Allows one response cycle to skip HTML morphing and send only state/effects.
	 */
	public __skipRender = false;

	/**
	 * Resets all pending effects.
	 */
	public $clearEffects() {
		this.__effects = [];
	}

	/**
	 * Emits an effect to the browser.
	 */
	public $effect(type: string, payload: any) {
		this.__effects.push({ type, payload });
	}

	public skipRender(value = true) {
		this.__skipRender = !!value;
	}

	public $skipRender(value = true) {
		this.skipRender(value);
	}

	/**
	 * Emits an event to the browser and other components on the same page.
	 */
	public emit(name: string, ...params: any[]) {
		this.$effect("event", { name, params });
		// Trigger internal server-side emit if wire instance is available
		if ((this as any).$wire_instance) {
			(this as any).$wire_instance.emit(`event:${name}`, {
				params,
				sourceId: this.$id,
			});
		}
	}

	public $emit(name: string, ...params: any[]) {
		this.emit(name, ...params);
	}

	/**
	 * Redirects the user to a new URL.
	 */
	public redirect(url: string) {
		this.$effect("redirect", url);
	}

	public $redirect(url: string) {
		this.redirect(url);
	}

	/**
	 * Sends a direct HTML stream update to a specific target.
	 */
	public stream(
		target: string,
		content: string,
		method: "update" | "append" | "prepend" = "update",
	) {
		this.$effect("stream", { target, content, method });
	}

	public $stream(
		target: string,
		content: string,
		method: "update" | "append" | "prepend" = "update",
	) {
		this.stream(target, content, method);
	}

	public collection(
		name: string,
		payload: Omit<WireCollectionPayload, "name">,
	) {
		const target = String(name || "").trim();
		if (!target) return;
		this.$effect("collection", {
			name: target,
			...payload,
		});
	}

	public replaceCollection<T = any>(
		path: string,
		items: T[] = [],
		options: { key?: string; limit?: number } = {},
	) {
		this.collection(path, {
			mode: "state",
			path,
			action: "replace",
			items: Array.isArray(items) ? items : [],
			key: options.key || "id",
			limit: options.limit,
		});
	}

	public appendToCollection<T = any>(
		path: string,
		items: T | T[],
		options: { key?: string; limit?: number } = {},
	) {
		const list = Array.isArray(items) ? items : [items];
		this.collection(path, {
			mode: "state",
			path,
			action: "append",
			items: list.filter((item) => item !== undefined && item !== null),
			key: options.key || "id",
			limit: options.limit,
		});
	}

	public prependToCollection<T = any>(
		path: string,
		items: T | T[],
		options: { key?: string; limit?: number } = {},
	) {
		const list = Array.isArray(items) ? items : [items];
		this.collection(path, {
			mode: "state",
			path,
			action: "prepend",
			items: list.filter((item) => item !== undefined && item !== null),
			key: options.key || "id",
			limit: options.limit,
		});
	}

	public upsertCollection<T = any>(
		path: string,
		items: T | T[],
		options: {
			key?: string;
			limit?: number;
			position?: "append" | "prepend";
		} = {},
	) {
		const list = Array.isArray(items) ? items : [items];
		this.collection(path, {
			mode: "state",
			path,
			action: "upsert",
			items: list.filter((item) => item !== undefined && item !== null),
			key: options.key || "id",
			limit: options.limit,
			position: options.position || "append",
		});
	}

	public removeFromCollection(
		path: string,
		keys: Array<string | number> | string | number,
		options: { key?: string } = {},
	) {
		const list = Array.isArray(keys) ? keys : [keys];
		this.collection(path, {
			mode: "state",
			path,
			action: "remove",
			keys: list.filter((item) => item !== undefined && item !== null),
			key: options.key || "id",
		});
	}

	public replaceCollectionHtml(name: string, content: string) {
		this.collection(name, {
			mode: "dom",
			action: "replace",
			content: String(content || ""),
		});
	}

	public appendCollectionHtml(
		name: string,
		content: string,
		options: { key?: string | number } = {},
	) {
		this.collection(name, {
			mode: "dom",
			action: "append",
			content: String(content || ""),
			key:
				options.key === undefined || options.key === null
					? undefined
					: String(options.key),
		});
	}

	public prependCollectionHtml(
		name: string,
		content: string,
		options: { key?: string | number } = {},
	) {
		this.collection(name, {
			mode: "dom",
			action: "prepend",
			content: String(content || ""),
			key:
				options.key === undefined || options.key === null
					? undefined
					: String(options.key),
		});
	}

	public upsertCollectionHtml(
		name: string,
		content: string,
		options: { key: string | number; position?: "append" | "prepend" },
	) {
		this.collection(name, {
			mode: "dom",
			action: "upsert",
			content: String(content || ""),
			key: String(options.key),
			position: options.position || "append",
		});
	}

	public removeCollectionHtml(
		name: string,
		keys: Array<string | number> | string | number,
	) {
		const list = Array.isArray(keys) ? keys : [keys];
		this.collection(name, {
			mode: "dom",
			action: "remove",
			keys: list
				.filter((item) => item !== undefined && item !== null)
				.map((item) => String(item)),
		});
	}

	public addError(field: string, message: string) {
		this.__errors[field] = message;
	}

	public clearErrors(field?: string) {
		if (field) delete this.__errors[field];
		else this.__errors = {};
	}

	/**
	 * Fills component state from serialized client payload while preserving
	 * specialized WireProperty objects.
	 */
	public fill(state: Record<string, any>) {
		if (!state) return;
		this.ensureDeclaredWireVariables();
		const declarations = this.getVariableDeclarations();
		if (declarations.size > 0) {
			const keys = Object.keys(state);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i]!;
				const declaration = declarations.get(key);
				if (!declaration || declaration.isPrivate) continue;
				if (!(key in this)) continue;

				const current = (this as any)[key];
				const value = state[key];
				(this as any)[key] = this.normalizeIncomingValue(
					current,
					value,
					declaration,
				);
			}
			return;
		}

		const keys = Object.keys(state);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (!(key in this)) continue;

			const current = (this as any)[key];
			const value = state[key];

			if (current instanceof WireProperty) {
				current.hydrate(value);
			} else {
				(this as any)[key] = value;
			}
		}
	}

	/**
	 * Returns only serializable/public state for hydration roundtrips.
	 */
	public getPublicState(): Record<string, any> {
		this.ensureDeclaredWireVariables();
		const declarations = this.getVariableDeclarations();
		if (declarations.size > 0) {
			const declaredState: Record<string, any> = Object.create(null);
			for (const [name, declaration] of declarations.entries()) {
				if (declaration.isPrivate) continue;
				const value = (this as any)[name];
				if (typeof value === "function") continue;

				if (value instanceof WireProperty) {
					declaredState[name] = value.dehydrate();
				} else if (declaration.kind === "files") {
					const upload = this.normalizeIncomingValue(
						value,
						value,
						declaration,
					) as WireUpload;
					declaredState[name] = upload.dehydrate();
				} else {
					declaredState[name] = value;
				}
			}
			return declaredState;
		}

		const state: Record<string, any> = Object.create(null);
		const keys = Object.keys(this);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (key.charCodeAt(0) === 36 || key.charCodeAt(0) === 95) continue; // Skip $ and _

			const value = (this as any)[key];
			if (typeof value === "function") continue;

			if (value instanceof WireProperty) {
				state[key] = value.dehydrate();
			} else {
				state[key] = value;
			}
		}
		return state;
	}

	protected normalizeIncomingValue(
		current: any,
		value: any,
		declaration?: WireVariableDefinition,
	): any {
		if (current instanceof WireProperty) {
			current.hydrate(value);
			return current;
		}

		if (!declaration) return value;

		if (declaration.kind === "broadcast") {
			const channel = declaration.room || declaration.name;
			if (current instanceof WireBroadcast) {
				if (value && typeof value === "object") current.hydrate(value);
				return current;
			}

			const next = new WireBroadcast({
				name: channel,
			});
			if (value && typeof value === "object") next.hydrate(value);
			return next;
		}

		if (declaration.kind === "files") {
			const upload =
				current instanceof WireUpload ? current : new WireUpload(current);
			upload.hydrate(value);
			this.validateFilesVariable(declaration, upload);
			return upload;
		}

		if (declaration.schema) {
			const converted = Value.Convert(declaration.schema, value);
			if (!Value.Check(declaration.schema, converted)) {
				throw new Error(
					`Invalid value for variable "${declaration.name}" (${declaration.raw || declaration.kind}).`,
				);
			}
			this.validateDeclaredShapeRules(declaration, converted);
			return converted;
		}

		this.validateDeclaredShapeRules(declaration, value);
		return value;
	}

	/**
	 * Marker helper for live-mode API ergonomics.
	 * Currently a runtime no-op; state visibility is still controlled by
	 * writable/public rules and serialization guards.
	 */
	public onlyserver<T>(value: T): T {
		return value;
	}

	protected isPropertyWritable(property: string): boolean {
		const normalized = String(property || "").trim();
		if (!normalized) return false;
		this.ensureDeclaredWireVariables();

		const segments = normalized
			.split(".")
			.map((part) => part.trim())
			.filter(Boolean);
		if (segments.length === 0) return false;

		for (let i = 0; i < segments.length; i++) {
			if (BLOCKED_SET_PATH_SEGMENTS.has(segments[i]!)) return false;
		}

		const root = segments[0]!;
		const first = root.charCodeAt(0);
		if (first === 36 || first === 95) return false; // $ or _

		const declarations = this.getVariableDeclarations();
		if (declarations.size > 0) {
			const declaration = declarations.get(root);
			if (!declaration) return false;
			if (declaration.isPrivate) return false;
			if (declaration.kind === "broadcast") return false;

			const fillable = (this as any).$fillable;
			if (Array.isArray(fillable) && fillable.length > 0) {
				return this.matchesFillablePath(normalized, fillable);
			}

			return true;
		}

		const fillable = (this as any).$fillable;
		if (Array.isArray(fillable) && fillable.length > 0) {
			return this.matchesFillablePath(normalized, fillable);
		}

		const state = this.getPublicState();
		return Object.hasOwn(state, root);
	}

	private getVariableDeclarations() {
		return getWireVariables(this.constructor as Function);
	}

	private getVariableDeclaration(
		propertyPath: string,
	): WireVariableDefinition | undefined {
		const root = String(propertyPath || "")
			.split(".")
			.map((entry) => entry.trim())
			.filter(Boolean)[0];
		if (!root) return undefined;
		return this.getVariableDeclarations().get(root);
	}

	private ensureDeclaredWireVariables() {
		const declarations = this.getVariableDeclarations();
		if (declarations.size === 0) return;

		for (const [name, declaration] of declarations.entries()) {
			if ((this as any)[name] !== undefined) continue;

			if (declaration.kind === "files") {
				(this as any)[name] = new WireUpload();
				continue;
			}

			if (declaration.kind === "broadcast") {
				(this as any)[name] = new WireBroadcast({
					name: declaration.room || name,
				});
			}
		}
	}

	private validateFilesVariable(
		declaration: WireVariableDefinition,
		upload: WireUpload,
	) {
		const files = normalizeFileList(upload.dehydrate());
		if (
			typeof declaration.minItems === "number" &&
			files.length < declaration.minItems
		) {
			throw new Error(
				`Variable "${declaration.name}" requires at least ${declaration.minItems} file(s).`,
			);
		}

		if (
			typeof declaration.maxItems === "number" &&
			files.length > declaration.maxItems
		) {
			throw new Error(
				`Variable "${declaration.name}" accepts at most ${declaration.maxItems} file(s).`,
			);
		}

		if (typeof declaration.maxBytes === "number" && declaration.maxBytes > 0) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i]!;
				if (Number(file.size || 0) > declaration.maxBytes) {
					throw new Error(
						`File "${file.name || "upload"}" exceeds max size for "${declaration.name}".`,
					);
				}
			}
		}
	}

	private matchesFillablePath(property: string, fillable: any[]): boolean {
		const normalizedProperty = String(property || "").trim();
		if (!normalizedProperty) return false;

		for (let i = 0; i < fillable.length; i++) {
			const raw = String(fillable[i] || "").trim();
			if (!raw) continue;

			if (raw === "*" || raw === normalizedProperty) return true;

			if (raw.endsWith(".*")) {
				const base = raw.slice(0, -2);
				if (
					normalizedProperty === base ||
					normalizedProperty.startsWith(`${base}.`)
				) {
					return true;
				}
				continue;
			}

			if (normalizedProperty.startsWith(`${raw}.`)) return true;
		}

		return false;
	}

	protected unpackEvent<T = any>(event?: unknown): T | null {
		const payload =
			(event as any)?.params?.[0] ??
			(event as any)?.detail?.params?.[0] ??
			(event as any)?.detail ??
			event;

		if (payload === undefined || payload === null) return null;
		return payload as T;
	}

	protected appendUniqueBy<T extends Record<string, any>>(
		list: T[],
		item: T | null | undefined,
		key: keyof T | string = "id",
	): T[] {
		if (!item) return Array.isArray(list) ? list : [];
		const normalized = Array.isArray(list) ? list : [];
		const needle = (item as any)[key as string];
		if (needle === undefined || needle === null) return [...normalized, item];
		if (normalized.some((entry) => (entry as any)?.[key as string] === needle))
			return normalized;
		return [...normalized, item];
	}

	protected prependUniqueBy<T extends Record<string, any>>(
		list: T[],
		item: T | null | undefined,
		key: keyof T | string = "id",
	): T[] {
		if (!item) return Array.isArray(list) ? list : [];
		const normalized = Array.isArray(list) ? list : [];
		const needle = (item as any)[key as string];
		if (needle === undefined || needle === null) return [item, ...normalized];
		if (normalized.some((entry) => (entry as any)?.[key as string] === needle))
			return normalized;
		return [item, ...normalized];
	}

	protected upsertBy<T extends Record<string, any>>(
		list: T[],
		item: T | null | undefined,
		key: keyof T | string = "id",
		mode: "append" | "prepend" = "append",
	): T[] {
		if (!item) return Array.isArray(list) ? list : [];
		const normalized = Array.isArray(list) ? list : [];
		const needle = (item as any)[key as string];
		if (needle === undefined || needle === null) {
			return mode === "prepend" ? [item, ...normalized] : [...normalized, item];
		}

		const next = normalized.filter(
			(entry) => (entry as any)?.[key as string] !== needle,
		);
		return mode === "prepend" ? [item, ...next] : [...next, item];
	}

	private runValidator(
		value: any,
		validator: any,
		state: Record<string, any>,
	): ValidationResult {
		if (typeof validator === "function") {
			const result = validator(value, state);
			if (result === false) return { success: false, error: "Invalid" };
			if (typeof result === "string") return { success: false, error: result };
			return { success: true };
		}

		if (typeof validator === "string") {
			return validateRuleString(
				this.normalizeValidationValue(value),
				validator,
			);
		}

		if (validator && typeof validator === "object") {
			// Check for file rule or other specialized validators via duck typing or instanceof
			if (typeof validator.validate === "function") {
				const result = validator.validate(value);
				if (result.success) return { success: true };
				return { success: false, error: result.errors?.[0] || "Invalid." };
			}

			if ("ruleStr" in validator && "schema" in validator) {
				const helper = validator as ComponentRuleDescriptor;
				return validateRuleString(
					this.normalizeValidationValue(value),
					helper.ruleStr,
					helper.message,
				);
			}

			if (isTypeBoxSchema(validator)) {
				return validateTypeBoxSchema(
					validator,
					this.normalizeValidationValue(value),
				);
			}
		}

		return { success: true };
	}

	private normalizeValidationValue(value: any): any {
		if (value instanceof WireProperty) {
			return value.dehydrate();
		}
		return value;
	}

	private getValueByPath(path: string): any {
		if (!path.includes(".")) {
			return (this as any)[path];
		}

		const parts = path.split(".");
		let current: any = this;
		for (let i = 0; i < parts.length; i++) {
			if (current === undefined || current === null) {
				return undefined;
			}
			current = current[parts[i]];
		}
		return current;
	}

	private validateDeclaredShapeRules(
		declaration: WireVariableDefinition,
		value: any,
	) {
		const shapeRules = declaration.shapeRules;
		if (!shapeRules || typeof shapeRules !== "object") return;

		const entries = Object.entries(shapeRules);
		for (let i = 0; i < entries.length; i++) {
			const [rawPath, rule] = entries[i]!;
			const path = String(rawPath || "").trim();
			const normalizedRule = String(rule || "").trim();
			if (!path || !normalizedRule) continue;

			const candidates = this.collectPathCandidates(value, path);
			const hasWildcard = path.includes("*");
			if (candidates.length === 0 && hasWildcard) continue;

			const targets =
				candidates.length > 0 ? candidates : [{ path, value: undefined }];
			for (let j = 0; j < targets.length; j++) {
				const candidate = targets[j]!;
				const result = validateRuleString(
					this.normalizeValidationValue(candidate.value),
					normalizedRule,
				);
				if (result.success) continue;

				const suffix = candidate.path ? `.${candidate.path}` : "";
				throw new Error(
					`Invalid value for variable "${declaration.name}${suffix}" (${result.error || "Invalid"}).`,
				);
			}
		}
	}

	private collectPathCandidates(
		source: any,
		path: string,
	): Array<{ path: string; value: any }> {
		const segments = String(path || "")
			.split(".")
			.map((part) => part.trim())
			.filter(Boolean);
		if (segments.length === 0) return [{ path: "", value: source }];

		const candidates: Array<{ path: string; value: any }> = [];
		const hasWildcard = segments.includes("*");

		const walk = (current: any, index: number, resolved: string[]) => {
			if (index >= segments.length) {
				candidates.push({
					path: resolved.join("."),
					value: current,
				});
				return;
			}

			const segment = segments[index]!;
			if (segment === "*") {
				if (!current || typeof current !== "object") return;

				const keys = Array.isArray(current)
					? current.map((_, itemIndex) => String(itemIndex))
					: Object.keys(current);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i]!;
					walk((current as any)[key], index + 1, [...resolved, key]);
				}
				return;
			}

			if (!current || typeof current !== "object") {
				if (index === segments.length - 1) {
					candidates.push({
						path: [...resolved, segment].join("."),
						value: undefined,
					});
				}
				return;
			}

			walk((current as any)[segment], index + 1, [...resolved, segment]);
		};

		walk(source, 0, []);
		if (candidates.length === 0 && !hasWildcard) {
			return [{ path, value: undefined }];
		}
		return candidates;
	}

	/**
	 * Lifecycle hook: Called after the component is instantiated and state is hydrated.
	 */
	public mount(): void | Promise<void> {}

	/**
	 * Lifecycle hook: Called before the component is removed from memory.
	 * Use this to cleanup resources, listeners, etc.
	 */
	public unmount(): void | Promise<void> {}

	/**
	 * Default render method.
	 * Non-live components should override this and return this.view(...).
	 */
	public render(): KireRendered {
		if ((this as any).$live) return "" as unknown as KireRendered;
		throw new Error(
			`Component "${this.constructor?.name || "AnonymousComponent"}" must implement render() unless $live = true.`,
		);
	}
}
