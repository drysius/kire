import { AWAIT_KEYWORD_REGEX, RESERVED_KEYWORDS_REGEX } from "../utils/regex";

/**
 * Stateless JS code analysis.
 * Strips string/comment/regex literals before scanning so that keywords
 * inside those constructs do not produce false positives.
 */
export class JsScanner {
	// ── Public API ────────────────────────────────────────────────────────────

	containsAwait(code: string | undefined): boolean {
		if (!code) return false;
		const normalized = this.normalizeForScan(code);
		const rx = new RegExp(AWAIT_KEYWORD_REGEX.source, "g");
		let match: RegExpExecArray | null;
		while ((match = rx.exec(normalized)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			const prev = this.prevNonWhitespace(normalized, start - 1);
			const next = this.nextNonWhitespace(normalized, end);
			// Skip property access (obj.await) and object keys ({ await: 1 })
			if (prev === "." || next === ":") continue;
			return true;
		}
		return false;
	}

	collectIdentifiers(code: string | undefined, target: Set<string>): void {
		const normalized = this.normalizeForScan(code);
		const rx = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
		let match: RegExpExecArray | null;
		while ((match = rx.exec(normalized)) !== null) {
			const id = match[0]!;
			if (RESERVED_KEYWORDS_REGEX.test(id)) continue;

			const prevRaw = normalized[match.index - 1];
			const nextRaw = normalized[match.index + id.length];
			if (this.isIdentPartChar(prevRaw) || this.isIdentPartChar(nextRaw)) continue;

			const prev = this.prevNonWhitespace(normalized, match.index - 1);
			if (prev === ".") continue;

			const next = this.nextNonWhitespace(normalized, match.index + id.length);
			// Skip object-literal keys: { key: value }
			if (next === ":" && (prev === "{" || prev === ",")) continue;

			target.add(id);
		}
	}

	collectDeclaredVars(code: string, decls: Set<string>): void {
		const normalized = this.normalizeForScan(code);
		const len = normalized.length;
		let i = 0;

		while (i < len) {
			const ch = normalized[i]!;
			if (!this.isIdentStartChar(ch)) { i++; continue; }

			let j = i + 1;
			while (j < len && this.isIdentPartChar(normalized[j])) j++;
			const token = normalized.slice(i, j);

			if (
				(token === "const" || token === "let" || token === "var") &&
				!this.isIdentPartChar(normalized[i - 1]) &&
				!this.isIdentPartChar(normalized[j])
			) {
				i = j;
				while (i < len && /\s/.test(normalized[i]!)) i++;
				i = this.collectDeclaratorList(normalized, i, len, decls);
				continue;
			}

			i = j;
		}
	}

	isIdentifierReferenced(source: string, identifier: string): boolean {
		if (!identifier) return false;
		let index = source.indexOf(identifier);
		while (index !== -1) {
			const before = source[index - 1];
			const after = source[index + identifier.length];
			if (!this.isIdentPartChar(before) && !this.isIdentPartChar(after)) {
				const prev = this.prevNonWhitespace(source, index - 1);
				if (prev !== ".") {
					const next = this.nextNonWhitespace(source, index + identifier.length);
					if (!(next === ":" && (prev === "{" || prev === ","))) return true;
				}
			}
			index = source.indexOf(identifier, index + identifier.length);
		}
		return false;
	}

	/**
	 * Strips string literals, comments, and regex literals from JS code,
	 * replacing them with spaces (preserving newlines for line counting).
	 * The result is safe to scan for keyword tokens.
	 */
	normalizeForScan(code: string | undefined): string {
		if (!code) return "";

		let out = "";
		let i = 0;
		const len = code.length;
		let inSingle = false;
		let inDouble = false;
		let inTemplate = false;
		let inRegex = false;
		let inRegexCharClass = false;
		let inLineComment = false;
		let inBlockComment = false;

		while (i < len) {
			const ch = code[i]!;
			const next = code[i + 1];

			if (inLineComment) {
				if (ch === "\n" || ch === "\r") { inLineComment = false; out += ch; }
				else out += " ";
				i++;
				continue;
			}

			if (inBlockComment) {
				if (ch === "*" && next === "/") { inBlockComment = false; out += "  "; i += 2; }
				else { out += ch === "\n" || ch === "\r" ? ch : " "; i++; }
				continue;
			}

			if (inSingle) {
				if (ch === "\\") {
					out += " ";
					if (i + 1 < len) { out += code[i + 1] === "\n" || code[i + 1] === "\r" ? code[i + 1] : " "; i += 2; continue; }
					i++;
				} else {
					if (ch === "'") inSingle = false;
					out += ch === "\n" || ch === "\r" ? ch : " ";
					i++;
				}
				continue;
			}

			if (inDouble) {
				if (ch === "\\") {
					out += " ";
					if (i + 1 < len) { out += code[i + 1] === "\n" || code[i + 1] === "\r" ? code[i + 1] : " "; i += 2; continue; }
					i++;
				} else {
					if (ch === '"') inDouble = false;
					out += ch === "\n" || ch === "\r" ? ch : " ";
					i++;
				}
				continue;
			}

			if (inTemplate) {
				if (ch === "\\") {
					out += " ";
					if (i + 1 < len) { out += code[i + 1] === "\n" || code[i + 1] === "\r" ? code[i + 1] : " "; i += 2; continue; }
					i++;
				} else {
					if (ch === "`") inTemplate = false;
					out += ch === "\n" || ch === "\r" ? ch : " ";
					i++;
				}
				continue;
			}

			if (inRegex) {
				if (ch === "\\") {
					// Escaped char — skip both \ and the next char (handles [a\]b] correctly)
					out += "  ";
					i += i + 1 < len ? 2 : 1;
					continue;
				}
				if (!inRegexCharClass && ch === "[") { inRegexCharClass = true; out += " "; i++; continue; }
				if (inRegexCharClass && ch === "]") { inRegexCharClass = false; out += " "; i++; continue; }
				if (!inRegexCharClass && ch === "/") {
					inRegex = false;
					out += " ";
					i++;
					while (i < len && /[a-zA-Z]/.test(code[i]!)) { out += " "; i++; }
					continue;
				}
				out += ch === "\n" || ch === "\r" ? ch : " ";
				i++;
				continue;
			}

			if (ch === "/" && next === "/") { inLineComment = true; out += "  "; i += 2; continue; }
			if (ch === "/" && next === "*") { inBlockComment = true; out += "  "; i += 2; continue; }
			if (ch === "/" && next !== "/" && next !== "*" && this.looksLikeRegexStart(code, i)) {
				inRegex = true;
				inRegexCharClass = false;
				out += " ";
				i++;
				continue;
			}

			if (ch === "'") { inSingle = true; out += " "; i++; continue; }
			if (ch === '"') { inDouble = true; out += " "; i++; continue; }
			if (ch === "`") { inTemplate = true; out += " "; i++; continue; }

			out += ch;
			i++;
		}

		return out;
	}

	// ── Identifier char helpers ───────────────────────────────────────────────

	isIdentStartChar(ch: string | undefined): boolean {
		return !!ch && /[a-zA-Z_$]/.test(ch);
	}

	isIdentPartChar(ch: string | undefined): boolean {
		return !!ch && /[a-zA-Z0-9_$]/.test(ch);
	}

	prevNonWhitespace(source: string, index: number): string {
		for (let i = index; i >= 0; i--) {
			const ch = source[i]!;
			if (!/\s/.test(ch)) return ch;
		}
		return "";
	}

	nextNonWhitespace(source: string, index: number): string {
		for (let i = index; i < source.length; i++) {
			const ch = source[i]!;
			if (!/\s/.test(ch)) return ch;
		}
		return "";
	}

	// ── Binding pattern helpers ───────────────────────────────────────────────

	collectBindingsFromPattern(pattern: string, decls: Set<string>): void {
		let cleaned = pattern.trim();
		if (!cleaned) return;

		// Simple identifier
		if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleaned)) {
			if (!RESERVED_KEYWORDS_REGEX.test(cleaned)) decls.add(cleaned);
			return;
		}

		// Strip outer parens
		cleaned = cleaned.replace(/^\(([\s\S]*)\)$/u, "$1").trim();
		// Spread operators
		cleaned = cleaned.replace(/\.\.\./g, " ");
		// Object destructuring keys (keep right-side aliases only)
		cleaned = cleaned.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, ":");
		// Default value expressions
		cleaned = cleaned.replace(/=\s*[^,}\]]+/g, " ");

		const rx = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
		let m: RegExpExecArray | null;
		while ((m = rx.exec(cleaned)) !== null) {
			const id = m[0]!;
			if (!RESERVED_KEYWORDS_REGEX.test(id)) decls.add(id);
		}
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private looksLikeRegexStart(source: string, slashIndex: number): boolean {
		const prev = this.prevNonWhitespace(source, slashIndex - 1);
		if (!prev) return true;
		if (/[([{:;,=!?&|+\-*%^~<>]/.test(prev)) return true;
		if (prev === ")" || prev === "]" || prev === "}" || prev === "'" || prev === '"')
			return false;

		let j = slashIndex - 1;
		while (j >= 0 && /\s/.test(source[j]!)) j--;
		const end = j + 1;
		while (j >= 0 && /[a-zA-Z_$]/.test(source[j]!)) j--;
		const token = source.slice(j + 1, end);

		return (
			token === "return" ||
			token === "throw" ||
			token === "case" ||
			token === "delete" ||
			token === "typeof" ||
			token === "void" ||
			token === "yield" ||
			token === "await" ||
			token === "in" ||
			token === "of"
		);
	}

	private splitDeclaratorBinding(segment: string): string {
		let dPar = 0, dBra = 0, dCur = 0;
		for (let i = 0; i < segment.length; i++) {
			const ch = segment[i]!;
			if (ch === "(") dPar++;
			else if (ch === ")") dPar = Math.max(0, dPar - 1);
			else if (ch === "[") dBra++;
			else if (ch === "]") dBra = Math.max(0, dBra - 1);
			else if (ch === "{") dCur++;
			else if (ch === "}") dCur = Math.max(0, dCur - 1);

			if (dPar || dBra || dCur) continue;

			if (ch === "=") return segment.slice(0, i).trim();

			if (ch === " " || ch === "\t") {
				const rest = segment.slice(i);
				if (/^(?:\s+)(?:in|of)(?:\s+)/.test(rest)) return segment.slice(0, i).trim();
			}
		}
		return segment.trim();
	}

	private collectDeclaratorList(
		normalized: string,
		start: number,
		len: number,
		decls: Set<string>,
	): number {
		let i = start;
		let dPar = 0, dBra = 0, dCur = 0;
		let declaratorStart = i;
		let stopped = false;

		while (i < len) {
			const ch = normalized[i]!;
			if (ch === "(") dPar++;
			else if (ch === ")") {
				if (dPar === 0 && dBra === 0 && dCur === 0) {
					const seg = normalized.slice(declaratorStart, i).trim();
					if (seg) this.collectBindingsFromPattern(this.splitDeclaratorBinding(seg), decls);
					i++;
					stopped = true;
					break;
				}
				dPar = Math.max(0, dPar - 1);
			} else if (ch === "[") dBra++;
			else if (ch === "]") dBra = Math.max(0, dBra - 1);
			else if (ch === "{") dCur++;
			else if (ch === "}") dCur = Math.max(0, dCur - 1);

			if (dPar === 0 && dBra === 0 && dCur === 0) {
				if (ch === ",") {
					const seg = normalized.slice(declaratorStart, i).trim();
					if (seg) this.collectBindingsFromPattern(this.splitDeclaratorBinding(seg), decls);
					declaratorStart = i + 1;
				} else if (ch === ";") {
					const seg = normalized.slice(declaratorStart, i).trim();
					if (seg) this.collectBindingsFromPattern(this.splitDeclaratorBinding(seg), decls);
					i++;
					stopped = true;
					break;
				} else if (ch === "\n" || ch === "\r") {
					const prev = this.prevNonWhitespace(normalized, i - 1);
					if (prev !== ",") {
						const seg = normalized.slice(declaratorStart, i).trim();
						if (seg) this.collectBindingsFromPattern(this.splitDeclaratorBinding(seg), decls);
						i++;
						stopped = true;
						break;
					}
				}
			}
			i++;
		}

		if (!stopped && declaratorStart < len) {
			const seg = normalized.slice(declaratorStart).trim();
			if (seg) this.collectBindingsFromPattern(this.splitDeclaratorBinding(seg), decls);
			i = len;
		}

		return i;
	}
}
