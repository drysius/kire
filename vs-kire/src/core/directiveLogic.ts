import type { DirectiveCall } from "./directiveScan";
import { scanDirectives } from "./directiveScan";
import { kireStore } from "./store";

function normalizeCloseByTokens(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry || "").trim()).filter(Boolean);
	}

	if (typeof value === "string" && value.trim()) {
		return [value.trim()];
	}

	return [];
}

export function isDirectiveCloseToken(name: string): boolean {
	return name === "end" || name.startsWith("end");
}

export function getDirectiveCloseTokens(name: string): string[] {
	const def = kireStore.getState().directives.get(name);
	const tokens = new Set<string>(["end", `end${name}`]);
	for (const token of normalizeCloseByTokens(def?.closeBy)) {
		tokens.add(token);
	}
	return Array.from(tokens);
}

/**
 * A chained directive (one with allowed parents, like @empty after @for) may
 * also be used standalone when it declares its own explicit closer
 * (`@empty(expr) ... @endempty`). Mirrors the core lexer, which only treats
 * such a directive as a branch when it appears inside a matching parent.
 */
export function directiveAllowsStandalone(name: string): boolean {
	const def = kireStore.getState().directives.get(name);
	return normalizeCloseByTokens(def?.closeBy).includes(`end${name}`);
}

/**
 * Decides whether a `children: "auto"` directive owns a block. Walks the
 * directive calls that follow it, tracking nesting depth, so an `@end` that
 * belongs to a later, unrelated block does not turn this call into a block.
 * Mirrors `Lexer.hasExplicitDirectiveEnd` in core.
 */
export function directiveOpensBlock(
	text: string,
	call: DirectiveCall,
	callsAfter?: DirectiveCall[],
): boolean {
	const state = kireStore.getState();
	const def = state.directives.get(call.name);
	if (!def?.children) return false;
	if (def.children === true) return true;

	const closers = new Set(getDirectiveCloseTokens(call.name));
	const following =
		callsAfter ?? scanDirectives(text).filter((c) => c.start > call.start);

	let depth = 0;
	for (const next of following) {
		const token = next.name;
		if (depth === 0 && closers.has(token)) return true;

		if (isDirectiveCloseToken(token)) {
			if (depth > 0) depth--;
			else return false; // closes something opened before us
			continue;
		}

		const nextDef = state.directives.get(token);
		if (!nextDef) continue;
		// Chained branches (@else, @case, ...) share their parent's block
		if ((state.parentDirectives.get(token) || []).length > 0) continue;
		if (nextDef.children === true) depth++;
	}
	return false;
}

function isRelatedToParent(child: string, parent: string): boolean {
	const parents = kireStore.getState().parentDirectives.get(child) || [];
	return parents.includes(parent);
}

function collapseClosedRelatedChain(stack: string[], closedName: string) {
	let current = closedName;
	while (stack.length > 0) {
		const parent = stack[stack.length - 1]!;
		if (!isRelatedToParent(current, parent)) break;
		current = stack.pop()!;
	}
}

function findMatchingDirectiveStackIndex(
	stack: string[],
	closeToken: string,
): number {
	for (let index = stack.length - 1; index >= 0; index--) {
		const name = stack[index]!;
		if (
			closeToken === "end" ||
			getDirectiveCloseTokens(name).includes(closeToken)
		) {
			return index;
		}
	}
	return -1;
}

export function getDirectiveContextStack(
	text: string,
	offset: number,
): string[] {
	const stack: string[] = [];
	const state = kireStore.getState();
	const calls = scanDirectives(text);

	for (let index = 0; index < calls.length; index++) {
		const call = calls[index]!;
		if (call.start >= offset) break;

		if (isDirectiveCloseToken(call.name)) {
			const matchIndex = findMatchingDirectiveStackIndex(stack, call.name);
			if (matchIndex >= 0) {
				const closed = stack.splice(matchIndex);
				const closedName = closed[0];
				if (closedName) {
					collapseClosedRelatedChain(stack, closedName);
				}
			}
			continue;
		}

		if (!directiveOpensBlock(text, call, calls.slice(index + 1))) continue;

		const allowedParents = state.parentDirectives.get(call.name) || [];
		if (allowedParents.length > 0) {
			const current = stack[stack.length - 1];
			const isBranch = !!current && allowedParents.includes(current);
			if (!isBranch && !directiveAllowsStandalone(call.name)) continue;
		}

		stack.push(call.name);
	}

	return stack;
}
