import type { LiveComponent } from "../component";
import { resolveMeta } from "../metadata";
import { store } from "../runtime/store";
import type { RequestContext } from "../runtime/context";
import { Feature } from "./feature";

/**
 * A validation rule. Either a predicate returning an error message (or
 * null/undefined when valid), or a schema-like object exposing `safeParse`
 * (Zod) / `Check` + `Errors` (TypeBox-style). Kept dependency-free.
 */
export type Rule =
	| ((value: unknown) => string | null | undefined)
	| { safeParse(v: unknown): { success: boolean; error?: { message: string } } };

function runRule(rule: unknown, value: unknown): string | null {
	if (typeof rule === "function") return (rule as (v: unknown) => string | null)(value) ?? null;
	if (rule && typeof (rule as { safeParse?: unknown }).safeParse === "function") {
		const res = (rule as Exclude<Rule, Function>).safeParse(value);
		return res.success ? null : (res.error?.message ?? "Invalid value.");
	}
	return null;
}

/**
 * Runs `@validate` rules when their property is written, collecting messages into
 * an error bag exposed to the view as `$errors` and to the client as an effect.
 */
export class ValidationFeature extends Feature {
	override skip(c: LiveComponent): boolean {
		return resolveMeta(c).rules.size === 0;
	}

	override update(c: LiveComponent, path: string, value: unknown): void {
		const root = path.split(".")[0]!;
		const rule = resolveMeta(c).rules.get(root);
		if (rule === undefined) return;
		const errors = store.get<Record<string, string>>(c, "errors", {});
		const message = runRule(rule, value);
		if (message) errors[root] = message;
		else delete errors[root];
		store.set(c, "errors", errors);
	}

	override dehydrate(c: LiveComponent, ctx: RequestContext): void {
		const errors = store.get<Record<string, string>>(c, "errors", {});
		if (Object.keys(errors).length) ctx.addEffect("errors", errors);
	}
}
