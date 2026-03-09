import * as vscode from "vscode";
import { kireStore } from "../../core/store";
import { extractTagAttributes } from "../../utils/embedded";

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
		const parsedAttrs = extractTagAttributes(text);
		for (const attr of parsedAttrs) {
			let def = store.attributes.get(attr.name);
			if (!def) {
				for (const el of store.elements.values()) {
					if (!el.attributes) continue;
					if (Array.isArray(el.attributes)) {
						const found = el.attributes.find((entry: any) => entry?.name === attr.name);
						if (found) {
							def = typeof found === "string" ? { type: found } : (found as any);
							break;
						}
						continue;
					}
					const raw = (el.attributes as Record<string, any>)[attr.name];
					if (raw) {
						def = typeof raw === "string" ? { type: raw } : (raw as any);
						break;
					}
				}
			}

			const attrType = Array.isArray(def?.type) ? def?.type[0] : def?.type;
			if (attrType === "javascript" && !attr.quote) {
				const pos = document.positionAt(attr.valueStart);
				diagnostics.push(
					new vscode.Diagnostic(
						new vscode.Range(pos, pos.translate(0, Math.max(attr.value.length, 1))),
						`JavaScript attribute "${attr.name}" should use quoted value to preserve parsing.`,
						vscode.DiagnosticSeverity.Warning,
					),
				);
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
