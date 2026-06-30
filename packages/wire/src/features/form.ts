import { resolveMeta } from "../metadata";
import { runRule } from "./validation";

/**
 * Base class for a reusable form object held as a component property. Fields are
 * plain reactive properties; `@validate` decorators on them drive `validate()`.
 * Register the subclass as a synth so it serializes:
 *
 * ```ts
 * wire.synth.register(modelSynth("createPost", CreatePostForm));
 * ```
 *
 * `wire:model="form.title"` writes through to the nested field automatically
 * (deep dot-path navigation works on class instances).
 */
export abstract class WireForm {
	/** Validation messages by field name, populated by `validate()`. */
	errors: Record<string, string> = {};

	/** Run all `@validate` rules; returns true when the form is valid. */
	validate(): boolean {
		const meta = resolveMeta(this);
		this.errors = {};
		let ok = true;
		for (const [field, rule] of meta.rules) {
			const message = runRule(rule, (this as Record<string, unknown>)[field]);
			if (message) {
				this.errors[field] = message;
				ok = false;
			}
		}
		return ok;
	}

	/** Throw if invalid (call inside an action to guard a submit). */
	validateOrThrow(): void {
		if (!this.validate()) throw new FormValidationError(this.errors);
	}

	/** Reset the given fields (or all declared props) to undefined and clear errors. */
	reset(...fields: string[]): void {
		const targets = fields.length ? fields : [...resolveMeta(this).props];
		for (const field of targets)
			(this as Record<string, unknown>)[field] = undefined;
		this.errors = {};
	}
}

/** Thrown by `WireForm.validateOrThrow()` when validation fails. */
export class FormValidationError extends Error {
	constructor(readonly errors: Record<string, string>) {
		super("Form validation failed.");
		this.name = "FormValidationError";
	}
}
