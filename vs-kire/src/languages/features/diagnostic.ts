import * as vscode from "vscode";
import { type DirectiveDefinition, kireStore } from "../../store";
import { parseParamDefinition } from "../../utils/params";

export class KireDiagnosticProvider {
	private diagnosticCollection: vscode.DiagnosticCollection;

	// HTML void elements (self-closing)
	private readonly htmlVoidElements = new Set([
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

	constructor() {
		this.diagnosticCollection =
			vscode.languages.createDiagnosticCollection("kire");
	}

	dispose() {
		this.diagnosticCollection.dispose();
	}

	register(_context: vscode.ExtensionContext): vscode.Disposable {
		const disposables: vscode.Disposable[] = [];
		disposables.push(this.diagnosticCollection);

		// Update diagnostics when document changes
		const updateDiagnostics = (document: vscode.TextDocument) => {
			if (
				document.languageId === "kire" ||
				document.fileName.endsWith(".kire")
			) {
				this.validateDocument(document);
			}
		};

		disposables.push(
			vscode.workspace.onDidChangeTextDocument((e) =>
				updateDiagnostics(e.document),
			),
			vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
			vscode.workspace.onDidCloseTextDocument((doc) =>
				this.diagnosticCollection.delete(doc.uri),
			),
		);

		// Validate all open documents
		vscode.workspace.textDocuments.forEach(updateDiagnostics);

		return vscode.Disposable.from(...disposables);
	}

	async validateDocument(document: vscode.TextDocument): Promise<void> {
		const diagnostics: vscode.Diagnostic[] = [];
		const text = document.getText();

		// Validate all aspects
		this.validateDirectives(document, text, diagnostics);
		this.validateElements(document, text, diagnostics);
		this.validateInterpolations(document, text, diagnostics);
		this.validateHtmlSyntax(document, text, diagnostics);
		this.validateElementAttributes(document, text, diagnostics);

		this.diagnosticCollection.set(document.uri, diagnostics);
	}

	private validateDirectives(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		const directiveStack: Array<{ name: string; line: number; char: number }> =
			[];
		const directiveRegex = /@([a-zA-Z0-9_]+)(?:\s*\(([^)]*)\))?/g;

		// Find JS blocks to ignore directives inside them
		const jsBlocks: [number, number][] = [];
		// Match both <?js and <?jsc
		//biome-ignore lint:suspicious/noControlCharactersInRegex not need
		const jsBlockRegex = /<\?js[c]?[\u0000-\uFFFF]*?\?>/g;
		let jsMatch: RegExpExecArray | null;
		while ((jsMatch = jsBlockRegex.exec(text)) !== null) {
			jsBlocks.push([jsMatch.index, jsMatch.index + jsMatch[0].length]);
		}

		let match: RegExpExecArray | null;
		while ((match = directiveRegex.exec(text)) !== null) {
			// Check if inside JS block
			const matchIndex = match.index;
			const isInsideJs = jsBlocks.some(
				([start, end]) => matchIndex >= start && matchIndex < end,
			);
			if (isInsideJs) continue;

			const fullMatch = match[0];
			const name = match[1];
			const argsStr = match[2];
			const position = document.positionAt(match.index);

			// Skip escaped directives @@
			if (match.index > 0 && text[match.index - 1] === "@") {
				continue;
			}

			// Check if directive exists
			const directiveDef = kireStore.getState().directives.get(name);

			if (directiveDef) {
				// Validate parameters
				if (argsStr !== undefined && directiveDef.params) {
					this.validateDirectiveParams(
						document,
						position,
						name,
						argsStr,
						directiveDef,
						diagnostics,
					);
				} else if (
					argsStr === undefined &&
					directiveDef.params &&
					directiveDef.params.length > 0
				) {
					// Missing required parameters
					const paramText = directiveDef.params
						.map((p) => p.split(":")[0])
						.join(", ");
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								position,
								position.translate(0, fullMatch.length),
							),
							`Directive @${name} requires parameters: (${paramText})`,
							vscode.DiagnosticSeverity.Error,
						),
					);
				}

				// Handle block directives
				if (directiveDef.children) {
					if (directiveDef.children === "auto") {
						const nextChars = text.substring(match.index, text.length);
						const hasEnd = nextChars.includes("@end");

						if (hasEnd) {
							directiveStack.push({
								name,
								line: position.line,
								char: position.character,
							});
						}
					} else if (directiveDef.children === true) {
						directiveStack.push({
							name,
							line: position.line,
							char: position.character,
						});
					}
				}
			}

			// Handle @end
			if (name === "end") {
				if (directiveStack.length === 0) {
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								position,
								position.translate(0, fullMatch.length),
							),
							`Unexpected @end without opening directive`,
							vscode.DiagnosticSeverity.Error,
						),
					);
				} else {
					directiveStack.pop();
				}
			}
		}

		// Check for unclosed directives
		directiveStack.forEach(({ name, line, char }) => {
			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(line, char, line, char + 1),
					`Directive @${name} is not closed with @end`,
					vscode.DiagnosticSeverity.Error,
				),
			);
		});
	}

	private validateDirectiveParams(
		_document: vscode.TextDocument,
		position: vscode.Position,
		name: string,
		argsStr: string,
		directiveDef: DirectiveDefinition,
		diagnostics: vscode.Diagnostic[],
	) {
		// Parse arguments with type inference for validation
		const args = this.parseDirectiveArgs(argsStr);
		const requiredParams = directiveDef.params || [];

		// Basic parameter count validation (might need adjustment for optional params logic later)
		// If args are fewer than required params, check if the last param might be a catch-all or pattern
		if (args.length < requiredParams.length) {
			// Identify truly missing required parameters
			const missingParams: string[] = [];

			for (let i = args.length; i < requiredParams.length; i++) {
				const p = requiredParams[i]!;
				// Check if optional (ends with ?) or is a pattern (might cover optionality differently?)
				// We use simple split checking for now.
				const namePart = p.includes("|")
					? p.split("|")[0]!.split(":")[0]!
					: p.split(":")[0]!;

				// If name part doesn't end with '?', it's required.
				if (!namePart.endsWith("?")) {
					missingParams.push(namePart);
				}
			}

			if (missingParams.length > 0) {
				diagnostics.push(
					new vscode.Diagnostic(
						new vscode.Range(
							position,
							position.translate(0, `@${name}(${argsStr})`.length),
						),
						`Missing parameters for @${name}: ${missingParams.join(", ")}`,
						vscode.DiagnosticSeverity.Error,
					),
				);
			}
		}

		// Validate types using robust parser
		requiredParams.forEach((paramDefStr, index) => {
			if (index < args.length) {
				const argValue = args[index];

				try {
					const definition = parseParamDefinition(paramDefStr);
					const validation = definition.validate(argValue);

					if (!validation.valid) {
						diagnostics.push(
							new vscode.Diagnostic(
								new vscode.Range(
									position,
									position.translate(0, `@${name}(${argsStr})`.length),
								),
								`Parameter ${index + 1} error: ${validation.error}`,
								vscode.DiagnosticSeverity.Warning,
							),
						);
					}
				} catch (e: any) {
					console.error(
						`Error validating param definition "${paramDefStr}":`,
						e,
					);
				}
			}
		});
	}

	private parseDirectiveArgs(argsStr: string): any[] {
		const args: any[] = [];
		let current = "";
		let inQuote = false;
		let quoteChar = "";
		let braceDepth = 0;
		let bracketDepth = 0;
		let parenDepth = 0;

		for (let i = 0; i < argsStr.length; i++) {
			const char = argsStr[i];

			// Handle quotes
			if (
				(char === '"' || char === "'") &&
				(i === 0 || argsStr[i - 1] !== "\\")
			) {
				if (inQuote && char === quoteChar) {
					inQuote = false;
				} else if (!inQuote) {
					inQuote = true;
					quoteChar = char;
				}
			}

			if (!inQuote) {
				if (char === "{") braceDepth++;
				else if (char === "}") braceDepth--;
				else if (char === "[") bracketDepth++;
				else if (char === "]") bracketDepth--;
				else if (char === "(") parenDepth++;
				else if (char === ")") parenDepth--;
			}

			if (
				char === "," &&
				!inQuote &&
				braceDepth === 0 &&
				bracketDepth === 0 &&
				parenDepth === 0
			) {
				args.push(this.parseValue(current.trim()));
				current = "";
			} else {
				current += char;
			}
		}

		if (current.trim()) {
			args.push(this.parseValue(current.trim()));
		}

		return args;
	}

	private parseValue(val: string): any {
		if (val === "true") return true;
		if (val === "false") return false;
		if (val === "null") return null;
		if (val === "undefined") return undefined;

		// Number check (must be a valid number, not just digits inside a variable name)
		// If it looks like a variable (starts with letter), it's a string expression, unless it matches a pattern later.
		if (!Number.isNaN(Number(val)) && val.trim() !== "") return Number(val);

		// Remove quotes if present for string literals
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			return val.slice(1, -1);
		}

		// Otherwise treat as string (variable name, pattern content, or object literal string)
		return val;
	}

	private validateElements(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		const elementRegex = /<([a-zA-Z][a-zA-Z0-9_-]*)([^>]*?)(\/?)>/g;

		let match: RegExpExecArray | null;
		while ((match = elementRegex.exec(text)) !== null) {
			const fullMatch = match[0];
			const name = match[1];
			const attributes = match[2];
			const isSelfClosing = match[3] === "/";
			const position = document.positionAt(match.index);

			// Check if it's a Kire element
			const elementDef = Array.from(
				kireStore.getState().elements.values(),
			).find((def) => {
				if (typeof def.name === "string") {
					return def.name === name;
				} else if ((def as any).name instanceof RegExp) {
					return (def as any).name.test(name);
				}
				return false;
			});

			if (elementDef) {
				// Validate void element usage
				if (elementDef.void === true) {
					if (!isSelfClosing) {
						// Check if it has separate closing tag (error)
						const nextChars = text.substring(
							match.index,
							Math.min(match.index + 500, text.length),
						);
						const closingTagRegex = new RegExp(`</${name}s*>`, "i");
						const closingMatch = closingTagRegex.exec(nextChars);

						if (closingMatch) {
							const closingPos = document.positionAt(
								match.index + closingMatch.index,
							);
							diagnostics.push(
								new vscode.Diagnostic(
									new vscode.Range(
										closingPos,
										closingPos.translate(0, name.length + 3),
									),
									`Void element <${name}> should not have a separate closing tag. Use <${name} /> instead.`,
									vscode.DiagnosticSeverity.Error,
								),
							);
						}

						// Suggest using self-closing syntax
						diagnostics.push(
							new vscode.Diagnostic(
								new vscode.Range(
									position,
									position.translate(0, fullMatch.length),
								),
								`Element <${name}> is void. Consider using self-closing syntax: <${name}${attributes}/>`,
								vscode.DiagnosticSeverity.Information,
							),
						);
					}
				} else if (
					isSelfClosing &&
					!this.htmlVoidElements.has(name.toLowerCase())
				) {
					// Non-void element with self-closing tag (error)
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								position,
								position.translate(0, fullMatch.length),
							),
							`Element <${name}> is not void and should not use self-closing syntax`,
							vscode.DiagnosticSeverity.Error,
						),
					);
				}
			}
		}
	}

	private validateElementAttributes(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		// Validate Kire element attributes based on their definitions
		const elementRegex = /<([a-zA-Z][a-zA-Z0-9_-]*)([^>]*)>/g;

		let match: RegExpExecArray | null;
		while ((match = elementRegex.exec(text)) !== null) {
			const name = match[1];
			const attrsStr = match[2];
			const position = document.positionAt(match.index);

			// Find element definition
			const elementDef = Array.from(
				kireStore.getState().elements.values(),
			).find((def) => {
				if (typeof def.name === "string") {
					return def.name === name;
				} else if ((def as any).name instanceof RegExp) {
					return (def as any).name.test(name);
				}
				return false;
			});

			if (elementDef) {
				// Extract attributes
				const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*["']?([^"'\s>]*)[ "']?/g;
				const attributes: Record<string, string> = {};
				let attrMatch: RegExpExecArray | null;

				while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
					const attrName = attrMatch[1];
					const attrValue = attrMatch[2];
					attributes[attrName] = attrValue;
				}

				// Check for required attributes if element has params definition
				if ((elementDef as any).params) {
					const requiredParams = (elementDef as any).params as string[];
					requiredParams.forEach((paramName) => {
						if (!attributes[paramName.split(":")[0]]) {
							diagnostics.push(
								new vscode.Diagnostic(
									new vscode.Range(
										position,
										position.translate(0, name.length + 1),
									),
									`Element <${name}> requires attribute "${paramName.split(":")[0]}"`,
									vscode.DiagnosticSeverity.Warning,
								),
							);
						}
					});
				}
			}
		}
	}

	private validateInterpolations(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		// Validate {{ }} interpolations
		const interpolationRegex = /\{\{([^}]*)\}\}/g;
		let match: RegExpExecArray | null;

		while ((match = interpolationRegex.exec(text)) !== null) {
			const fullMatch = match[0];
			const content = match[1];
			const position = document.positionAt(match.index);

			// Check for empty interpolations
			if (!content.trim()) {
				diagnostics.push(
					new vscode.Diagnostic(
						new vscode.Range(position, position.translate(0, fullMatch.length)),
						`Empty interpolation`,
						vscode.DiagnosticSeverity.Warning,
					),
				);
			}
		}

		// Validate {{{ }}} raw interpolations
		const rawInterpolationRegex = /\{\{\{([^}]*)\}\}\}/g;
		while ((match = rawInterpolationRegex.exec(text)) !== null) {
			const fullMatch = match[0];
			const content = match[1];
			const position = document.positionAt(match.index);

			if (!content.trim()) {
				diagnostics.push(
					new vscode.Diagnostic(
						new vscode.Range(position, position.translate(0, fullMatch.length)),
						`Empty raw interpolation`,
						vscode.DiagnosticSeverity.Warning,
					),
				);
			}
		}

		// Check for unclosed interpolations
		const lines = text.split("\n");
		lines.forEach((line, lineIndex) => {
			const openBraces = (line.match(/\{\{/g) || []).length;
			const closeBraces = (line.match(/\}\}/g) || []).length;

			if (openBraces > closeBraces) {
				const charIndex = line.lastIndexOf("{{");
				if (charIndex !== -1) {
					// Check if it continues on next line
					const remainingText = lines.slice(lineIndex).join("\n");
					const hasClosing = remainingText.includes("}}");

					if (!hasClosing) {
						diagnostics.push(
							new vscode.Diagnostic(
								new vscode.Range(
									lineIndex,
									charIndex,
									lineIndex,
									charIndex + 2,
								),
								`Unclosed interpolation {{`,
								vscode.DiagnosticSeverity.Error,
							),
						);
					}
				}
			}
		});
	}

	private validateHtmlSyntax(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		// Simple HTML tag validation (ignores Kire elements and directives)
		const stack: Array<{ tag: string; line: number; char: number }> = [];
		const tagRegex = /<(\/?)(\w+)(?:\s|>|\/)/g;

		let match: RegExpExecArray | null;
		while ((match = tagRegex.exec(text)) !== null) {
			const isClosing = match[1] === "/";
			const tagName = match[2];
			const position = document.positionAt(match.index);

			const isKireElement = Array.from(
				kireStore.getState().elements.values(),
			).some((def) => {
				if (typeof def.name === "string") {
					return def.name === tagName;
				} else if ((def as any).name instanceof RegExp) {
					return (def as any).name.test(tagName);
				}
				return false;
			});

			if (isKireElement) {
				continue; // Skip Kire elements, they're validated elsewhere
			}

			const isVoid = this.htmlVoidElements.has(tagName.toLowerCase());

			if (!isClosing && !isVoid) {
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
					const last = stack[stack.length - 1];
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

			// Check for void elements with separate closing tag
			if (isVoid && !isClosing) {
				const nextChars = text.substring(
					match.index,
					Math.min(match.index + 200, text.length),
				);
				const closingTagPattern = new RegExp(`</${tagName}s*>`, "i");
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

		// Check for unclosed HTML tags
		stack.forEach(({ tag, line, char }) => {
			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(line, char, line, char + tag.length + 1),
					`Unclosed tag <${tag}>`,
					vscode.DiagnosticSeverity.Warning,
				),
			);
		});

		// Validate attribute syntax
		const unquotedAttrRegex = /\s([a-zA-Z-]+)=([^"'\s>]+)(?=\s|\/?>)/g;
		while ((match = unquotedAttrRegex.exec(text)) !== null) {
			const attrName = match[1];
			const attrValue = match[2];
			const position = document.positionAt(
				match.index + match[0].indexOf(attrValue),
			);

			// Check if value needs quotes
			if (
				attrValue.includes(" ") ||
				attrValue.includes("=") ||
				attrValue.includes(">")
			) {
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
