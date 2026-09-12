import type { Kire } from "../kire";
import type { LexerError, Node } from "../types";
import {
	ATTR_NAME_BREAK_REGEX,
	DIRECTIVE_NAME_REGEX,
	HTML_VOID_TAGS,
	NullProtoObj,
	TAG_CLOSE_REGEX,
	TAG_OPEN_REGEX,
	WHITESPACE_REGEX,
} from "../utils/regex";
import { extractBracketedContent, findInterpolationEnd, parseArgs } from "./balance";
import { Cursor } from "./cursor";

export class Lexer extends Cursor {
	private stack: Node[] = [];
	private root: Node[] = [];
	/** Structural problems found during the last parse(); parsing is lenient. */
	public errors: LexerError[] = [];

	constructor(
		template: string,
		private kire: Kire<any>,
		baseOffset = 0,
		baseLine = 1,
		baseColumn = 1,
		/** Inside a raw element (<script>, <style>): keep directives and
		 * interpolations, but never interpret `<` as HTML markup. */
		private rawMode = false,
	) {
		super(template, baseOffset, baseLine, baseColumn);
	}

	public parse(): Node[] {
		this.reset();
		this.stack = [];
		this.root = [];
		this.errors = [];

		this.parseBody();

		for (const open of this.stack) {
			const label =
				open.type === "directive" ? `@${open.name}` : `<${open.tagName}>`;
			// loc.offset is already absolute; reportError adds baseOffset itself
			const start = (open.loc?.offset ?? 0) - this.baseOffset;
			this.reportError(
				`${label} is not closed`,
				start,
				start + label.length,
				open.loc,
			);
		}

		return this.root;
	}

	private reportError(
		message: string,
		start: number,
		end: number,
		loc?: { line: number; column: number },
	): void {
		this.errors.push({
			message,
			start: this.baseOffset + start,
			end: this.baseOffset + end,
			line: loc?.line ?? this.line,
			column: loc?.column ?? this.column,
		});
	}

	private parseBody(): void {
		while (!this.done) {
			const char = this.char();

			if (char === "{" && this.char(1) === "{") {
				if (this.checkComment()) continue;
				if (this.checkInterpolation()) continue;
			}

			if (char === "@") {
				if (this.checkEscapedInterpolation()) continue;
				if (this.checkEscaped("@")) continue;
				if (this.checkDirective()) continue;
			}

			if (char === "<") {
				if (this.checkJavascript()) continue;
				if (!this.rawMode) {
					if (this.checkElement()) continue;
					if (this.checkClosingTag()) continue;
				}
			}

			this.parseText();
		}
	}

	// ── Node helpers ─────────────────────────────────────────────────────────

	private addNode(node: Node): void {
		const parent = this.stack[this.stack.length - 1];
		if (parent) {
			if (!parent.children) parent.children = [];
			parent.children.push(node);
		} else {
			this.root.push(node);
		}
	}

	/**
	 * Closes the stack entry at `index`. Anything opened above it is closed
	 * implicitly (the engine tolerates it), so each such node is reported.
	 */
	private closeStackAt(index: number): void {
		const registered = this.kire.$directives.records;
		for (let i = this.stack.length - 1; i > index; i--) {
			const open = this.stack[i]!;
			// Chained branches (@else after @if) are closed together with their
			// root by design; they are not "unclosed".
			const below = this.stack[i - 1]!;
			if (
				open.type === "directive" &&
				below.type === "directive" &&
				registered[open.name!]?.relatedTo?.includes(below.name!)
			) {
				continue;
			}
			const label =
				open.type === "directive" ? `@${open.name}` : `<${open.tagName}>`;
			const start = (open.loc?.offset ?? 0) - this.baseOffset;
			this.reportError(
				`${label} is not closed`,
				start,
				start + label.length,
				open.loc,
			);
		}
		this.stack.splice(index);
	}

	private popStack(name: string | null): void {
		if (this.stack.length === 0) return;
		if (!name) {
			this.stack.pop();
			return;
		}
		for (let i = this.stack.length - 1; i >= 0; i--) {
			const n = this.stack[i]!;
			if (n.name === name || n.tagName === name) {
				this.closeStackAt(i);
				break;
			}
		}
	}

	// ── Escape / comment / interpolation ─────────────────────────────────────

	private checkEscapedInterpolation(): boolean {
		if (this.startsWith("@{{{")) {
			this.addNode({ type: "text", content: "{{{", loc: this.getLoc() });
			this.advance(4);
			return true;
		}
		if (this.startsWith("@{{")) {
			this.addNode({ type: "text", content: "{{", loc: this.getLoc() });
			this.advance(3);
			return true;
		}
		return false;
	}

	private checkEscaped(char: string): boolean {
		if (this.startsWith(`@${char}`)) {
			this.addNode({ type: "text", content: char, loc: this.getLoc() });
			this.advance(2);
			return true;
		}
		return false;
	}

	private checkComment(): boolean {
		if (this.startsWith("{{--")) {
			const end = this.template.indexOf("--}}", this.cursor + 4);
			if (end !== -1) {
				this.advance(end + 4 - this.cursor);
				return true;
			}
		}
		return false;
	}

	private checkInterpolation(): boolean {
		const loc = this.getLoc();
		const isRaw = this.startsWith("{{{");
		const open = isRaw ? "{{{" : "{{";
		const close = isRaw ? "}}}" : "}}";
		const end = findInterpolationEnd(this.template, this.cursor + open.length, close);
		if (end !== -1) {
			const content = this.slice(this.cursor + open.length, end).trim();
			this.addNode({ type: "interpolation", content, raw: isRaw, loc });
			this.advance(end + close.length - this.cursor);
			return true;
		}
		return false;
	}

	// ── Directives ────────────────────────────────────────────────────────────

	private checkDirective(): boolean {
		const loc = this.getLoc();
		const slice = this.slice(this.cursor);
		const match = slice.match(DIRECTIVE_NAME_REGEX);
		if (!match) return false;

		const rawName = match[1]!;
		const registered = this.kire.$directives.records;

		// 1. Check if this token closes an open scope
		if (this.stack.length > 0) {
			for (let i = this.stack.length - 1; i >= 0; i--) {
				const node = this.stack[i]!;
				// Elements are closed by their own closing tag, never by @end
				if (node.type !== "directive") continue;
				const def = registered[node.name!];
				let shouldPop = false;

				if (def?.closeBy) {
					const closeBy = Array.isArray(def.closeBy) ? def.closeBy : [def.closeBy];
					if (closeBy.includes(rawName)) shouldPop = true;
				}

				if (!shouldPop) {
					if (rawName === "end") {
						shouldPop = true;
					} else if (node.type === "directive" && rawName === `end${node.name}`) {
						shouldPop = true;
					}
				}

				if (shouldPop) {
					// Chained branches (@else, @case, ...) sit on the stack above their
					// chain root. A generic closer (@end, @endif) closes the whole
					// chain; an explicit branch closer (@endcase) closes only the branch.
					let rootIdx = i;
					const closesBranchOnly = rawName === `end${node.name}`;
					while (!closesBranchOnly && rootIdx > 0) {
						const branchDef = registered[this.stack[rootIdx]!.name!];
						const below = this.stack[rootIdx - 1]!;
						if (
							below.type === "directive" &&
							branchDef?.relatedTo?.includes(below.name!)
						) {
							rootIdx--;
						} else {
							break;
						}
					}
					this.closeStackAt(rootIdx);
					this.advance(rawName.length + 1);
					return true;
				}
			}
		}

		// 2. Match directive name — exact preferred; prefix only for related/scoped directives
		let matchedName = "";
		if (registered[rawName]) {
			matchedName = rawName;
		} else {
			const m = rawName.match(this.kire.$directivesPattern);
			if (m && m.index === 0) {
				const candidate = m[0]!;
				if (candidate !== rawName && registered[candidate]) {
					const nextChar = this.rawAt(this.cursor + 1 + candidate.length);
					const hasCallArgs = nextChar === "(";

					let allowPrefixInScope = false;
					const current = this.stack[this.stack.length - 1];
					if (current) {
						const candidateDef = registered[candidate]!;
						if (candidateDef.relatedTo?.includes(current.name!)) {
							allowPrefixInScope = true;
						} else {
							const currentDef = registered[current.name!];
							if (currentDef?.closeBy) {
								const closeBy = Array.isArray(currentDef.closeBy)
									? currentDef.closeBy
									: [currentDef.closeBy];
								allowPrefixInScope = closeBy.includes(candidate);
							}
						}
					}

					if (hasCallArgs || allowPrefixInScope) matchedName = candidate;
				}
			}
		}

		if (!matchedName) {
			// Not a registered directive — keep as literal if it's not a template expression
			if (this.char(1) === "{") return false;
			if (rawName === "end" || /^end[A-Za-z]/.test(rawName)) {
				// A closer that matched nothing on the stack (see step 1)
				const hasOpenDirective = this.stack.some((n) => n.type === "directive");
				this.reportError(
					hasOpenDirective
						? `@${rawName} does not close the current block`
						: `@${rawName} has no matching opening directive`,
					this.cursor,
					this.cursor + rawName.length + 1,
					loc,
				);
			}
			this.advance(rawName.length + 1);
			this.addNode({ type: "directive", name: rawName, args: [], children: [], loc });
			return true;
		}

		const name = matchedName;
		const def = registered[name]!;
		this.advance(name.length + 1);

		let args: any[] = [];
		if (this.char() === "(") {
			const res = extractBracketedContent(this.template, this.cursor, "(", ")");
			if (res) {
				args = parseArgs(res.content);
				this.advance(res.fullLength);
			}
		}

		const node: Node = { type: "directive", name, args, children: [], loc };

		// 3. Handle chain/related directives (e.g. @else after @if, @case after @switch)
		if (this.stack.length > 0) {
			const current = this.stack[this.stack.length - 1]!;

			if (def.relatedTo?.includes(current.name!)) {
				// Walk back to find the root of this relationship chain
				let rootIdx = this.stack.length - 1;
				while (rootIdx > 0) {
					const candidate = this.stack[rootIdx]!;
					const parent = this.stack[rootIdx - 1]!;
					const candDef = registered[candidate.name!];
					if (candDef?.relatedTo?.includes(parent.name!)) {
						rootIdx--;
					} else {
						break;
					}
				}
				const rootNode = this.stack[rootIdx]!;

				if (!rootNode.related) rootNode.related = [];
				rootNode.related.push(node);

				// A branch closes whatever the previous branch left open (e.g. a
				// <div> opened inside @if and never closed before @else).
				this.closeStackAt(rootIdx + 1);

				if (
					def.children === true ||
					(def.children === "auto" && this.hasExplicitDirectiveEnd(name, this.cursor))
				) {
					this.stack.push(node);
				}
				return true;
			}
		}

		this.addNode(node);
		if (
			def.children === true ||
			(def.children === "auto" && this.hasExplicitDirectiveEnd(name, this.cursor))
		) {
			this.stack.push(node);
		}
		return true;
	}

	// ── Elements ──────────────────────────────────────────────────────────────

	private checkElement(): boolean {
		const loc = this.getLoc();
		const slice = this.slice(this.cursor);
		const match = slice.match(TAG_OPEN_REGEX);
		if (!match) return false;

		const tagName = match[1]!;
		const isLetter = /^[a-zA-Z]/.test(tagName);
		if (!isLetter && !this.kire.$elementsPattern.test(tagName)) return false;

		this.advance(match[0]!.length);
		const { attrs: attributes, meta: attributeMeta } = this.parseAttributesState();

		while (!this.done && WHITESPACE_REGEX.test(this.char())) this.advance(1);

		let selfClosing = false;
		if (this.char() === "/") {
			selfClosing = true;
			this.advance(1);
		}
		if (this.char() === ">") this.advance(1);

		const node: Node = {
			type: "element",
			name: tagName,
			tagName,
			attributes,
			attributeMeta,
			void: selfClosing || HTML_VOID_TAGS.has(tagName.toLowerCase()),
			children: [],
			loc,
		};

		let def = null;
		for (const m of this.kire.$elementMatchers) {
			const d = m.def;
			if (typeof d.name === "string") {
				if (d.name === tagName) {
					def = d;
					break;
				}
				if (d.name.includes("*")) {
					const p = d.name.replace("*", "(.*)");
					const m2 = tagName.match(new RegExp(`^${p}$`));
					if (m2) {
						node.wildcard = m2[1];
						def = d;
						break;
					}
				}
			} else if (d.name instanceof RegExp && d.name.test(tagName)) {
				def = d;
				break;
			}
		}

		// Raw elements (e.g. <script>, <style>) get their inner content parsed as-is
		if (!selfClosing && def?.raw) {
			const closeTag = `</${tagName}>`;
			const endIdx = this.template.indexOf(closeTag, this.cursor);
			if (endIdx !== -1) {
				const content = this.slice(this.cursor, endIdx);
				const innerParser = new Lexer(
					content,
					this.kire,
					this.baseOffset + this.cursor,
					this.line,
					this.column,
					true,
				);
				node.children = innerParser.parse();
				this.errors.push(...innerParser.errors);
				this.addNode(node);
				this.advance(content.length + closeTag.length);
				return true;
			}
		}

		// Check for element relationship chaining (e.g. <x-else> after <x-if>)
		const current = this.stack[this.stack.length - 1];
		const siblings = current ? current.children || [] : this.root;
		let lastIdx = siblings.length - 1;
		while (lastIdx >= 0 && siblings[lastIdx]!.type === "text" && !siblings[lastIdx]!.content?.trim()) {
			lastIdx--;
		}
		const lastSibling = siblings[lastIdx];
		const isRelated = lastSibling?.tagName
			? !!def?.relatedTo?.includes(lastSibling.tagName)
			: false;

		if (lastSibling && isRelated) {
			if (!lastSibling.related) lastSibling.related = [];
			lastSibling.related.push(node);
			if (!node.void) this.stack.push(node);
			return true;
		}

		this.addNode(node);
		if (!node.void) this.stack.push(node);
		return true;
	}

	private checkClosingTag(): boolean {
		const match = this.slice(this.cursor).match(TAG_CLOSE_REGEX);
		if (!match) return false;
		const tagName = match[1]!;

		const isLetter = /^[a-zA-Z]/.test(tagName);
		if (!isLetter && !this.kire.$elementsPattern.test(tagName)) return false;

		const hasOpen = this.stack.some(
			(n) => n.type === "element" && n.tagName === tagName,
		);
		if (!hasOpen) {
			this.reportError(
				`</${tagName}> has no matching opening tag`,
				this.cursor,
				this.cursor + match[0]!.length,
				this.getLoc(),
			);
		}

		this.popStack(tagName);
		this.advance(match[0]!.length);
		return true;
	}

	// ── Attribute parsing ─────────────────────────────────────────────────────

	private parseAttributesState(): {
		attrs: Record<string, string>;
		meta: Record<string, { quoted: boolean; quote?: '"' | "'" }>;
	} {
		const attrs: Record<string, string> = new NullProtoObj();
		const meta: Record<string, { quoted: boolean; quote?: '"' | "'" }> = new NullProtoObj();

		while (!this.done) {
			while (!this.done && WHITESPACE_REGEX.test(this.char())) this.advance(1);

			const ch = this.char();
			if (ch === ">" || ch === "/" || !ch) break;

			let name = "";
			while (!this.done && !ATTR_NAME_BREAK_REGEX.test(this.char())) {
				name += this.char();
				this.advance(1);
			}
			if (!name) break;

			let value = "true";
			let quoted = false;
			let quote: '"' | "'" | undefined;

			if (this.char() === "(") {
				const res = extractBracketedContent(this.template, this.cursor, "(", ")");
				if (res) {
					value = res.content;
					this.advance(res.fullLength);
				}
			} else if (this.char() === "=") {
				this.advance(1);
				const first = this.char();
				if (first === '"' || first === "'") {
					quoted = true;
					quote = first;
					this.advance(1);
					value = this.captureQuotedValue(first);
					if (this.char() === first) this.advance(1);
				} else {
					value = this.captureBalancedValue();
				}
			}

			attrs[name] = value;
			meta[name] = quoted ? { quoted: true, quote } : { quoted: false };
		}

		return { attrs, meta };
	}

	private captureQuotedValue(quote: '"' | "'"): string {
		let value = "";
		let escaped = false;

		while (!this.done) {
			const char = this.char();
			if (escaped) {
				value += char === quote || char === "\\" ? char : `\\${char}`;
				escaped = false;
				this.advance(1);
				continue;
			}
			if (char === "\\") {
				escaped = true;
				this.advance(1);
				continue;
			}
			if (char === quote) break;
			value += char;
			this.advance(1);
		}

		if (escaped) value += "\\";
		return value;
	}

	private captureBalancedValue(): string {
		let val = "";
		let dPar = 0;
		let dBra = 0;
		let dCur = 0;
		let inQ: string | null = null;
		let escaped = false;

		while (!this.done) {
			const c = this.char();

			if (inQ) {
				if (escaped) {
					escaped = false;
				} else if (c === "\\") {
					escaped = true;
				} else if (c === inQ) {
					inQ = null;
				}
			} else {
				if (c === '"' || c === "'" || c === "`") inQ = c;
				else if (c === "(") dPar++;
				else if (c === ")") dPar--;
				else if (c === "[") dBra++;
				else if (c === "]") dBra--;
				else if (c === "{") dCur++;
				else if (c === "}") dCur--;
			}

			if (!inQ && dPar === 0 && dBra === 0 && dCur === 0 && (WHITESPACE_REGEX.test(c) || c === ">" || c === "/"))
				break;

			val += c;
			this.advance(1);
		}

		return val;
	}

	// ── Misc ──────────────────────────────────────────────────────────────────

	private checkJavascript(): boolean {
		const loc = this.getLoc();
		if (this.startsWith("<?js")) {
			const end = this.template.indexOf("?>", this.cursor + 4);
			if (end !== -1) {
				this.addNode({
					type: "js",
					content: this.slice(this.cursor + 4, end),
					loc,
				});
				this.advance(end + 2 - this.cursor);
				return true;
			}
		}
		return false;
	}

	private parseText(): void {
		const loc = this.getLoc();
		// Manual scan instead of a stateful global regex — avoids lastIndex desync bugs
		let end = this.cursor;
		const len = this.template.length;
		while (end < len) {
			const c = this.template[end]!;
			if (c === "{" && this.template[end + 1] === "{") break;
			if (c === "@") break;
			if (c === "<") break;
			end++;
		}

		if (end > this.cursor) {
			this.addNode({ type: "text", content: this.slice(this.cursor, end), loc });
			this.advance(end - this.cursor);
		} else {
			// Consume one character to avoid an infinite loop on unmatched input
			this.addNode({ type: "text", content: this.char(), loc });
			this.advance(1);
		}
	}

	/**
	 * Decides whether a `children: "auto"` directive at `fromCursor` owns a block.
	 * Walks the remaining directive tokens tracking nesting depth, so an `@end`
	 * that belongs to a later, unrelated block does not turn this directive into
	 * a block by accident.
	 */
	private hasExplicitDirectiveEnd(name: string, fromCursor: number): boolean {
		const registered = this.kire.$directives.records;
		const def = registered[name];
		const closers = new Set<string>([`end${name}`, "end"]);
		if (def?.closeBy) {
			const closeBy = Array.isArray(def.closeBy) ? def.closeBy : [def.closeBy];
			for (const token of closeBy) closers.add(token);
		}

		const rest = this.slice(fromCursor);
		const rx = /@([a-zA-Z0-9_\-.:]+)/g;
		let depth = 0;
		let m: RegExpExecArray | null;
		while ((m = rx.exec(rest)) !== null) {
			if (m.index > 0 && rest[m.index - 1] === "@") continue; // escaped @@
			const token = m[1]!;

			if (depth === 0 && closers.has(token)) return true;

			if (token.startsWith("end")) {
				if (depth > 0) depth--;
				else return false; // closes something opened before us
				continue;
			}

			const tokenDef = registered[token];
			if (!tokenDef) continue;
			// Chained branches (@else, @case, ...) share their parent's block
			if (tokenDef.relatedTo && tokenDef.relatedTo.length > 0) continue;
			if (tokenDef.children === true) depth++;
		}
		return false;
	}
}
