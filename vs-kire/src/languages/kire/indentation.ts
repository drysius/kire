import {
	directiveAllowsStandalone,
	directiveOpensBlock,
	getDirectiveCloseTokens,
	isDirectiveCloseToken,
} from "../../core/directiveLogic";
import { scanDirectives, skipOpaqueRegion } from "../../core/directiveScan";
import { kireStore } from "../../core/store";
import { isHtmlVoidElement } from "../../utils/html";

/**
 * A structural token that changes nesting depth.
 * - open:   `<div>`, `@if(...)`             → +1 after this token
 * - close:  `</div>`, `@end`, `@endif`      → -1 before this token
 * - middle: `@else`, `@case(...)`           → -1 before, +1 after
 */
export interface StructuralToken {
	kind: "open" | "close" | "middle";
	offset: number;
	length: number;
	label: string;
}

const TAG_REGEX =
	/<(\/?)([a-zA-Z][a-zA-Z0-9:_.-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/y;

function isVoidTag(tagName: string): boolean {
	const element = kireStore.getState().elements.get(tagName);
	if (element) return !!element.void;
	return isHtmlVoidElement(tagName);
}

/**
 * Lists every depth-changing token in document order. Opaque regions
 * (comments, interpolations, <?js ?>, <script>/<style> bodies) contribute
 * nothing, matching what the engine lexer does with them.
 */
export function collectStructuralTokens(text: string): StructuralToken[] {
	const state = kireStore.getState();
	const tokens: StructuralToken[] = [];

	// Directives: classify with a running stack so a chained branch (@else)
	// is a "middle" only when it actually sits inside a matching parent.
	const calls = scanDirectives(text);
	const directiveStack: string[] = [];
	for (let index = 0; index < calls.length; index++) {
		const call = calls[index]!;
		const length = call.end - call.start + 1;

		if (isDirectiveCloseToken(call.name)) {
			let matchIndex = -1;
			for (let i = directiveStack.length - 1; i >= 0; i--) {
				const open = directiveStack[i]!;
				if (
					call.name === "end" ||
					getDirectiveCloseTokens(open).includes(call.name)
				) {
					matchIndex = i;
					break;
				}
			}
			if (matchIndex === -1) continue; // orphan closer: no depth change
			// A branch closer that exactly names the branch closes only it.
			const closesBranchOnly =
				call.name === `end${directiveStack[matchIndex]}` &&
				(state.parentDirectives.get(directiveStack[matchIndex]!) || [])
					.length > 0 &&
				matchIndex > 0;
			let rootIndex = matchIndex;
			if (!closesBranchOnly) {
				while (rootIndex > 0) {
					const parents =
						state.parentDirectives.get(directiveStack[rootIndex]!) || [];
					if (parents.includes(directiveStack[rootIndex - 1]!)) rootIndex--;
					else break;
				}
			}
			directiveStack.splice(rootIndex);
			tokens.push({
				// Closing only a branch (@endcase) keeps the chain root open, so
				// it dedents itself like a branch but leaves the depth unchanged.
				kind: closesBranchOnly ? "middle" : "close",
				offset: call.start,
				length,
				label: `@${call.name}`,
			});
			continue;
		}

		const allowedParents = state.parentDirectives.get(call.name) || [];
		const top = directiveStack[directiveStack.length - 1];
		if (allowedParents.length > 0 && top && allowedParents.includes(top)) {
			const def = state.directives.get(call.name);
			if (def?.children) {
				directiveStack.push(call.name);
				tokens.push({
					kind: "middle",
					offset: call.start,
					length,
					label: `@${call.name}`,
				});
			}
			continue;
		}
		if (allowedParents.length > 0 && !directiveAllowsStandalone(call.name)) {
			continue;
		}

		if (directiveOpensBlock(text, call, calls.slice(index + 1))) {
			directiveStack.push(call.name);
			tokens.push({
				kind: "open",
				offset: call.start,
				length,
				label: `@${call.name}`,
			});
		}
	}

	// Tags
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === "<" || ch === "{") {
			const skipTo = skipOpaqueRegion(text, i);
			if (skipTo !== -1) {
				i = skipTo - 1;
				continue;
			}
		}
		if (ch !== "<") continue;

		TAG_REGEX.lastIndex = i;
		const m = TAG_REGEX.exec(text);
		if (!m) continue;

		const closing = m[1] === "/";
		const tagName = m[2]!;
		const selfClosing = m[4] === "/";
		if (closing) {
			tokens.push({ kind: "close", offset: i, length: m[0].length, label: `</${tagName}>` });
		} else if (!selfClosing && !isVoidTag(tagName)) {
			tokens.push({ kind: "open", offset: i, length: m[0].length, label: `<${tagName}>` });
		}
		i += m[0].length - 1;
	}

	tokens.sort((a, b) => a.offset - b.offset);
	return tokens;
}

/**
 * Computes the indentation level of every line.
 *
 * For a line, the level is the depth entering the line minus the number of
 * close/middle tokens that appear before the first open token on that line
 * (so `</div>` and `@else` dedent themselves). The depth carried to the next
 * line is adjusted by every token on the line, so mixed lines such as
 * `<li>@if(x)</li>` are handled by their real net effect, not by their
 * first token.
 *
 * @param lineStarts absolute offset of the first character of each line
 */
export function computeLineIndentLevels(
	text: string,
	lineStarts: number[],
): number[] {
	const tokens = collectStructuralTokens(text);
	const levels: number[] = new Array(lineStarts.length).fill(0);

	let depth = 0;
	let tokenIndex = 0;
	for (let line = 0; line < lineStarts.length; line++) {
		const lineEnd =
			line + 1 < lineStarts.length ? lineStarts[line + 1]! : text.length + 1;

		let leadingDedents = 0;
		let sawOpen = false;
		let net = 0;

		while (tokenIndex < tokens.length && tokens[tokenIndex]!.offset < lineEnd) {
			const token = tokens[tokenIndex]!;
			if (token.kind === "open") {
				sawOpen = true;
				net++;
			} else if (token.kind === "close") {
				if (!sawOpen) leadingDedents++;
				net--;
			} else {
				if (!sawOpen) leadingDedents++;
				// middle: -1 then +1 → no net change
			}
			tokenIndex++;
		}

		levels[line] = Math.max(0, depth - leadingDedents);
		depth = Math.max(0, depth + net);
	}

	return levels;
}

/** Offsets where each line begins (handles \n and \r\n). */
export function getLineStarts(text: string): number[] {
	const starts = [0];
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") starts.push(i + 1);
	}
	return starts;
}
