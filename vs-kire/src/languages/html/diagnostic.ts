import * as vscode from "vscode";
import { kireStore } from "../../core/store";

export class HtmlDiagnosticProvider {
	public static readonly htmlVoidElements = new Set([
		"area",
		"base",
		"br",
		"col",
		"embed",
		"hr",
		"img",
		"input",
		"link",
		"meta",
		"param",
		"source",
		"track",
		"wbr",
		"command",
		"keygen",
	]);

	createDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
		const diagnostics: vscode.Diagnostic[] = [];
		const text = document.getText();

		this.validateUnclosedTags(document, text, diagnostics);
		this.validateAttributes(document, text, diagnostics);

		return diagnostics;
	}

	private validateUnclosedTags(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		const stack: Array<{ tag: string; line: number; char: number }> = [];
		const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9_-]*)([^>]*?)(\/?)>/g;
		const store = kireStore.getState();
		let match: RegExpExecArray | null;
		while ((match = tagRegex.exec(text)) !== null) {
			const isClosing = match[1] === "/";
			const tagName = match[2] as string;
            const isSelfClosing = match[4] === "/";
			const position = document.positionAt(match.index);

			let isVoid = HtmlDiagnosticProvider.htmlVoidElements.has(
				tagName.toLowerCase(),
			);
			if (store.elements.get(tagName))
				isVoid = !!store.elements.get(tagName)?.void;

			if (!isClosing && !isVoid && !isSelfClosing) {
				stack.push({
					tag: tagName,
					line: position.line,
					char: position.character,
				});
			} else if (isClosing) {
				if (stack.length === 0) {
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								position,
								position.translate(0, tagName.length + 2),
							),
							`Closing tag </${tagName}> has no corresponding opening tag`,
							vscode.DiagnosticSeverity.Error,
						),
					);
				} else {
					const last = stack[stack.length - 1]!;
					if (last.tag !== tagName) {
						diagnostics.push(
							new vscode.Diagnostic(
								new vscode.Range(
									position,
									position.translate(0, tagName.length + 2),
								),
								`Closing tag </${tagName}> does not match opening tag <${last.tag}>`,
								vscode.DiagnosticSeverity.Error,
							),
						);
						stack.pop();
					} else {
						stack.pop();
					}
				}
			}

			if (isVoid && !isClosing && !isSelfClosing) {
				const nextChars = text.substring(
					match.index,
					Math.min(match.index + 200, text.length),
				);
				const closingTagPattern = new RegExp(`</${tagName}\s*>`, "i");
				const closingMatch = closingTagPattern.exec(nextChars);

				if (closingMatch) {
					const closingPos = document.positionAt(
						match.index + closingMatch.index,
					);
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								closingPos,
								closingPos.translate(0, tagName.length + 3),
							),
							`Void element <${tagName}> should not have a separate closing tag`,
							vscode.DiagnosticSeverity.Error,
						),
					);
				}
			}
		}

		stack.forEach(({ tag, line, char }) => {
			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(line, char, line, char + tag.length + 1),
					`Unclosed tag <${tag}>`,
					vscode.DiagnosticSeverity.Warning,
				),
			);
		});
	}

	private validateAttributes(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		const store = kireStore.getState();
		const jsAttrRegex = /([:@a-zA-Z0-9\-.]+)\s*=\s*(["'])/g;
		let jsMatch: RegExpExecArray | null;

		while ((jsMatch = jsAttrRegex.exec(text)) !== null) {
			const attrName = jsMatch[1] as string;
			const quote = jsMatch[2] as string;
			const startValueIndex = jsMatch.index + jsMatch[0].length;

			let def = store.attributes.get(attrName);
			if (!def) {
				for (const el of store.elements.values()) {
					if (el.attributes && el.attributes[attrName]) {
						const attr = el.attributes[attrName];
						def = typeof attr === "string" ? { type: attr } : attr;
						break;
					}
				}
			}

			if (def?.type === "javascript") {
				let current = startValueIndex;
				while (current < text.length) {
					const char = text[current];
					if (char === quote && text[current - 1] !== "") {
						const nextChunk = text.slice(current + 1, current + 50);
						const trimmedNext = nextChunk.trim();
						if (trimmedNext && /^[a-zA-Z0-9_{}[\](),.;+\-*/=!&|]/.test(trimmedNext)) {
							const position = document.positionAt(current);
							diagnostics.push(
								new vscode.Diagnostic(
									new vscode.Range(position, position.translate(0, 1)),
									`Unescaped quote in JavaScript attribute. Use \${quote} to avoid breaking HTML syntax.`,
									vscode.DiagnosticSeverity.Error,
								),
							);
						}
						break;
					}
					current++;
				}
			}
		}

		const unquotedAttrRegex = /\s([a-zA-Z0-9\-:@.]+)=([^"'\s>]+)(?=\s|\/?>)/g;
		let match: RegExpExecArray | null;
		while ((match = unquotedAttrRegex.exec(text)) !== null) {
			const attrName = match[1] as string;
			const attrValue = match[2] as string;
			const position = document.positionAt(match.index + match[0]!.indexOf(attrValue));
			if (attrValue.includes(" ") || attrValue.includes("=") || attrValue.includes(">") || attrValue.includes("{")) {
				diagnostics.push(
					new vscode.Diagnostic(
						new vscode.Range(position, position.translate(0, attrValue.length)),
						`Attribute "${attrName}" value should be quoted`,
						vscode.DiagnosticSeverity.Warning,
					),
				);
			}
		}
	}
}
