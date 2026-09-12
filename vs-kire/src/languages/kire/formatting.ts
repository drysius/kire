import * as vscode from "vscode";
import { formatCode } from "../../utils/formatCode";
import { computeLineIndentLevels, getLineStarts } from "./indentation";

type EmbeddedLanguage = "javascript" | "typescript" | "css";
type EmbeddedKind = "html-script" | "html-style" | "kire-js";
type EmbeddedMode = "multiline" | "inline";

interface EmbeddedBlock {
	kind: EmbeddedKind;
	languageId: EmbeddedLanguage;
	mode: EmbeddedMode;
	range?: vscode.Range;
	closerStartOffset?: number;
	closerToken: string;
	fullRange?: vscode.Range;
	inlineInner?: string;
	openLine: number;
	baseIndent: string;
	openIndent: string;
}

export class FeatureFormatting
	implements vscode.DocumentFormattingEditProvider
{
	async provideDocumentFormattingEdits(
		document: vscode.TextDocument,
		options: vscode.FormattingOptions,
		_token: vscode.CancellationToken,
	): Promise<vscode.TextEdit[]> {
		const edits: vscode.TextEdit[] = [];
		const indentUnit = options.insertSpaces
			? " ".repeat(options.tabSize)
			: "\t";
		const docEol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";

		const text = document.getText();
		// Indentation level per line, computed from every structural token on
		// the line (tags and block directives), so mixed lines such as
		// `<li>@if(x)</li>` are handled by their real nesting effect.
		const levels = computeLineIndentLevels(text, getLineStarts(text));

		const embeddedBlocks = this.collectEmbeddedBlocks(document);

		const blocksByOpenLine = new Map<number, EmbeddedBlock[]>();
		for (const b of embeddedBlocks) {
			const arr = blocksByOpenLine.get(b.openLine) ?? [];
			arr.push(b);
			blocksByOpenLine.set(b.openLine, arr);
		}

		for (let i = 0; i < document.lineCount; i++) {
			const originalLine = document.lineAt(i).text;
			const trimmed = originalLine.trim();
			const expectedIndent = indentUnit.repeat(levels[i] ?? 0);

			const blocksHere = blocksByOpenLine.get(i);
			if (blocksHere) {
				for (const b of blocksHere) {
					b.openIndent = expectedIndent;
					b.baseIndent = expectedIndent + indentUnit;
				}
			}

			if (this.isLineInsideEmbeddedContent(document, i, embeddedBlocks))
				continue;

			if (trimmed === "") {
				if (originalLine !== "")
					edits.push(this.replaceFullLine(i, originalLine, ""));
				continue;
			}

			const currentIndent = this.getLeadingWhitespace(originalLine);
			if (currentIndent !== expectedIndent) {
				edits.push(this.replaceIndent(i, currentIndent.length, expectedIndent));
			}
		}

		for (const b of embeddedBlocks) {
			if (!b.baseIndent) {
				const openerIndent = this.getLeadingWhitespace(
					document.lineAt(b.openLine).text,
				);
				b.openIndent = openerIndent;
				b.baseIndent = openerIndent + indentUnit;
			}

			if (b.mode === "inline") {
				if (
					b.kind === "kire-js" &&
					b.fullRange &&
					typeof b.inlineInner === "string"
				) {
					const inner = b.inlineInner.trim();
					const normalized =
						inner.length === 0 ? "<?js ?>" : `<?js ${inner} ?>`;

					const original = document.getText(b.fullRange);
					if (original !== normalized) {
						edits.push(vscode.TextEdit.replace(b.fullRange, normalized));
					}
				}
				continue;
			}

			if (!b.range || b.closerStartOffset == null) continue;

			const rawInner = document.getText(b.range);
			if (rawInner.trim() !== "") {
				const forceLeadingNewline = b.kind === "kire-js";
				const formattedInner = await this.formatEmbeddedText(
					rawInner,
					b.languageId,
					b.baseIndent,
					options,
					docEol,
					forceLeadingNewline,
				);

				if (formattedInner !== rawInner) {
					edits.push(vscode.TextEdit.replace(b.range, formattedInner));
				}
			}

			const betweenStart = document.offsetAt(b.range.end);
			const betweenEnd = b.closerStartOffset;

			if (betweenEnd >= betweenStart) {
				const betweenRange = new vscode.Range(
					document.positionAt(betweenStart),
					document.positionAt(betweenEnd),
				);
				const betweenText = document.getText(betweenRange);
				const hasNewLine = /[\r\n]/.test(betweenText);

				if (!hasNewLine) {
					edits.push(
						vscode.TextEdit.replace(betweenRange, docEol + b.openIndent),
					);
				}
			}
		}

		edits.sort(
			(a, b) =>
				document.offsetAt(b.range.start) - document.offsetAt(a.range.start),
		);
		return edits;
	}

	private collectEmbeddedBlocks(
		document: vscode.TextDocument,
	): EmbeddedBlock[] {
		const text = document.getText();
		const blocks: EmbeddedBlock[] = [];

		const push = (b: Omit<EmbeddedBlock, "baseIndent" | "openIndent">) => {
			blocks.push({ ...b, baseIndent: "", openIndent: "" });
		};

		const hasNewline = (s: string) => /[\r\n]/.test(s);

		const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
		for (let m: RegExpExecArray | null; (m = scriptRe.exec(text)); ) {
			const attrs = m[1] ?? "";
			const inner = m[2] ?? "";
			if (!inner || inner.trim() === "") continue;
			if (!hasNewline(inner)) continue;

			const full = m[0];
			const innerStart = m.index + full.indexOf(inner);
			let innerEnd = innerStart + inner.length;

			const lowerFull = full.toLowerCase();
			const closerIdxInFull = lowerFull.lastIndexOf("</script>");
			const closerStartOffset =
				m.index + (closerIdxInFull >= 0 ? closerIdxInFull : full.length);

			innerEnd -= this.trimTrailingCloserPadding(inner);

			const lang: EmbeddedLanguage =
				/lang\s*=\s*["']ts["']/i.test(attrs) ||
				/type\s*=\s*["']text\/typescript["']/i.test(attrs)
					? "typescript"
					: "javascript";

			push({
				kind: "html-script",
				languageId: lang,
				mode: "multiline",
				range: new vscode.Range(
					document.positionAt(innerStart),
					document.positionAt(innerEnd),
				),
				closerStartOffset,
				closerToken: "</script>",
				openLine: document.positionAt(m.index).line,
			});
		}

		const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
		for (let m: RegExpExecArray | null; (m = styleRe.exec(text)); ) {
			const inner = m[1] ?? "";
			if (!inner || inner.trim() === "") continue;
			if (!hasNewline(inner)) continue;

			const full = m[0];
			const innerStart = m.index + full.indexOf(inner);
			let innerEnd = innerStart + inner.length;

			const lowerFull = full.toLowerCase();
			const closerIdxInFull = lowerFull.lastIndexOf("</style>");
			const closerStartOffset =
				m.index + (closerIdxInFull >= 0 ? closerIdxInFull : full.length);

			innerEnd -= this.trimTrailingCloserPadding(inner);

			push({
				kind: "html-style",
				languageId: "css",
				mode: "multiline",
				range: new vscode.Range(
					document.positionAt(innerStart),
					document.positionAt(innerEnd),
				),
				closerStartOffset,
				closerToken: "</style>",
				openLine: document.positionAt(m.index).line,
			});
		}

		const kireJsRe = /<\?js\b([\s\S]*?)\?>/gi;
		for (let m: RegExpExecArray | null; (m = kireJsRe.exec(text)); ) {
			const inner = m[1] ?? "";
			const full = m[0];

			const openLine = document.positionAt(m.index).line;

			if (!hasNewline(inner)) {
				push({
					kind: "kire-js",
					languageId: "javascript",
					mode: "inline",
					fullRange: new vscode.Range(
						document.positionAt(m.index),
						document.positionAt(m.index + full.length),
					),
					inlineInner: inner,
					closerToken: "?>",
					openLine,
				});
				continue;
			}

			const innerStart = m.index + full.indexOf(inner);
			let innerEnd = innerStart + inner.length;

			const closerIdxInFull = full.lastIndexOf("?>");
			const closerStartOffset =
				m.index + (closerIdxInFull >= 0 ? closerIdxInFull : full.length);

			innerEnd -= this.trimTrailingCloserPadding(inner);

			push({
				kind: "kire-js",
				languageId: "javascript",
				mode: "multiline",
				range: new vscode.Range(
					document.positionAt(innerStart),
					document.positionAt(innerEnd),
				),
				closerStartOffset,
				closerToken: "?>",
				openLine,
			});
		}

		return blocks;
	}

	private trimTrailingCloserPadding(inner: string): number {
		const m = inner.match(/(?:\r?\n)[ \t]*$/);
		return m ? m[0].length : 0;
	}

	private isLineInsideEmbeddedContent(
		document: vscode.TextDocument,
		line: number,
		blocks: EmbeddedBlock[],
	): boolean {
		const lineText = document.lineAt(line).text;
		const lineLen = lineText.length;
		const trimmedStart = lineText.slice(lineText.search(/\S|$/));

		for (const b of blocks) {
			if (b.mode !== "multiline" || !b.range) continue;

			const s = b.range!.start;
			const e = b.range!.end;

			if (line < s.line || line > e.line) continue;

			if (line > s.line && line < e.line) return true;

			if (line === s.line && s.character === 0) return true;

			if (line === e.line) {
				if (e.character < lineLen) {
					if (trimmedStart.startsWith(b.closerToken)) return false;
					return true;
				}

				if (e.character === lineLen) return true;
			}
		}

		return false;
	}

	private async formatEmbeddedText(
		raw: string,
		languageId: EmbeddedLanguage,
		baseIndent: string,
		options: vscode.FormattingOptions,
		docEol: string,
		forceLeadingNewline: boolean,
	): Promise<string> {
		const rawLf = raw.replace(/\r\n/g, "\n");

		const hadLeadingEol = forceLeadingNewline || /^\s*\n/.test(rawLf);

		const hadTrailingEol = rawLf.endsWith("\n");

		let core = this.stripCommonIndent(this.trimEmptyEdges(rawLf));

		// Format the fragment with Prettier; fall back to plain re-indentation when
		// it can't parse (mid-edit syntax error).
		const pretty = await formatCode(core, languageId, {
			tabWidth: options.tabSize,
			useTabs: !options.insertSpaces,
		});
		if (pretty !== null) core = pretty;

		const formattedLf = core.replace(/\r\n/g, "\n").replace(/\n+$/, "");

		const lines = formattedLf.split("\n");
		const reindented = lines
			.map((l) => (l.trim() === "" ? "" : baseIndent + l))
			.join(docEol);

		let out = reindented;

		if (hadLeadingEol) out = docEol + out;

		if (hadTrailingEol) out = out + docEol;

		return out;
	}

	private trimEmptyEdges(textLf: string): string {
		const lines = textLf.split("\n");
		while (lines.length && lines[0].trim() === "") lines.shift();
		while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
		return lines.join("\n");
	}

	private stripCommonIndent(textLf: string): string {
		const lines = textLf.split("\n");
		const indents = lines
			.filter((l) => l.trim() !== "")
			.map((l) => l.match(/^\s*/)?.[0].length ?? 0);

		const min = indents.length ? Math.min(...indents) : 0;
		if (min === 0) return textLf;

		return lines.map((l) => (l.length >= min ? l.slice(min) : "")).join("\n");
	}

	private getLeadingWhitespace(line: string): string {
		const m = line.match(/^\s*/);
		return m ? m[0] : "";
	}

	private replaceIndent(
		lineNum: number,
		currentIndentLen: number,
		newIndent: string,
	): vscode.TextEdit {
		return vscode.TextEdit.replace(
			new vscode.Range(
				new vscode.Position(lineNum, 0),
				new vscode.Position(lineNum, currentIndentLen),
			),
			newIndent,
		);
	}

	private replaceFullLine(
		lineNum: number,
		oldText: string,
		newText: string,
	): vscode.TextEdit {
		return vscode.TextEdit.replace(
			new vscode.Range(
				new vscode.Position(lineNum, 0),
				new vscode.Position(lineNum, oldText.length),
			),
			newText,
		);
	}
}
