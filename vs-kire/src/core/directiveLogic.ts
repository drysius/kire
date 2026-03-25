import type { DirectiveCall } from "./directiveScan";
import { scanDirectives } from "./directiveScan";
import { kireStore } from "./store";

function normalizeCloseByTokens(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.map((entry) => String(entry || "").trim())
			.filter(Boolean);
	}

	if (typeof value === "string" && value.trim()) {
		return [value.trim()];
	}

	return [];
}

function findUnescapedDirective(source: string, directiveName: string): number {
	const token = `@${directiveName}`;
	let index = source.indexOf(token);

	while (index !== -1) {
		const prev = index > 0 ? source[index - 1] : "";
		const next = source[index + token.length] || "";
		if (prev !== "@" && !/[A-Za-z0-9_]/.test(next)) {
			return index;
		}
		index = source.indexOf(token, index + token.length);
	}

	return -1;
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

export function directiveOpensBlock(text: string, call: DirectiveCall): boolean {
	const def = kireStore.getState().directives.get(call.name);
	if (!def?.children) return false;
	if (def.children === true) return true;

	const rest = text.slice(Math.min(call.end + 1, text.length));
	for (const token of getDirectiveCloseTokens(call.name)) {
		if (findUnescapedDirective(rest, token) !== -1) {
			return true;
		}
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
		if (closeToken === "end" || getDirectiveCloseTokens(name).includes(closeToken)) {
			return index;
		}
	}
	return -1;
}

export function getDirectiveContextStack(text: string, offset: number): string[] {
	const stack: string[] = [];
	const state = kireStore.getState();
	const calls = scanDirectives(text);

	for (const call of calls) {
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

		if (!directiveOpensBlock(text, call)) continue;

		const allowedParents = state.parentDirectives.get(call.name) || [];
		if (allowedParents.length > 0) {
			const current = stack[stack.length - 1];
			if (!current || !allowedParents.includes(current)) continue;
		}

		stack.push(call.name);
	}

	return stack;
}
