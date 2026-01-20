import * as vscode from "vscode";
import {
	type DocumentContext,
	getLanguageService as getHtmlService,
	type HoverSettings,
} from "vscode-html-languageservice";
import { TextDocument } from "vscode-languageserver-textdocument";
import { kireStore } from "@/store";

export const htmlLanguageService = getHtmlService();

function toLspDocument(document: vscode.TextDocument) {
	return TextDocument.create(
		document.uri.toString(),
		document.languageId,
		document.version,
		document.getText(),
	);
}

function toVsCodeRange(range: {
	start: { line: number; character: number };
	end: { line: number; character: number };
}) {
	return new vscode.Range(
		range.start.line,
		range.start.character,
		range.end.line,
		range.end.character,
	);
}

function toLspPosition(position: vscode.Position) {
	return { line: position.line, character: position.character };
}

export class HtmlCompletionItemProvider
	implements vscode.CompletionItemProvider
{
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext,
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		const completionConfig = {
			hideAutoCompleteProposals: false,
		};

		const htmlList = htmlLanguageService.doComplete(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
			completionConfig,
		);

		return htmlList.items.map((item) => {
			const newItem = new vscode.CompletionItem(item.label);
			newItem.kind = item.kind as unknown as vscode.CompletionItemKind;

			if (item.detail) newItem.detail = item.detail;
			if (item.documentation) {
				newItem.documentation = (
					typeof item.documentation === "string"
						? new vscode.MarkdownString(item.documentation)
						: item.documentation
				) as any;
			}

			newItem.insertText = item.insertText
				? typeof item.insertText === "string"
					? item.insertText
					: (item.insertText as any).value
				: item.label;

			if (item.filterText) newItem.filterText = item.filterText;
			if (item.sortText) newItem.sortText = item.sortText;
			if (item.preselect !== undefined) newItem.preselect = item.preselect;
			if (item.commitCharacters)
				newItem.commitCharacters = item.commitCharacters;

			if (item.textEdit) {
				if ("range" in item.textEdit && "newText" in item.textEdit) {
					newItem.range = toVsCodeRange(item.textEdit.range);
					newItem.insertText = item.textEdit.newText;
				}
			}

			if (item.additionalTextEdits) {
				newItem.additionalTextEdits = item.additionalTextEdits.map(
					(edit) =>
						new vscode.TextEdit(toVsCodeRange(edit.range), edit.newText),
				);
			}

			return newItem;
		});
	}
}

export class HtmlHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Hover> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		const hoverSettings: HoverSettings = {
			documentation: true,
			references: true,
		};

		const hover = htmlLanguageService.doHover(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
			hoverSettings,
		);

		if (!hover || !hover.contents) {
			return undefined;
		}

		const markdown = new vscode.MarkdownString();
		markdown.isTrusted = true;

		if (typeof hover.contents === "string") {
			markdown.appendMarkdown(hover.contents);
		} else if (Array.isArray(hover.contents)) {
			hover.contents.forEach((c, index) => {
				if (typeof c === "string") {
					markdown.appendMarkdown(c);
				} else if ("language" in c) {
					markdown.appendCodeblock(c.value, c.language);
				} else {
					markdown.appendMarkdown((c as any).value);
				}
				if (index < (hover.contents as any[]).length - 1) {
					markdown.appendText("\n\n");
				}
			});
		} else if ("kind" in hover.contents) {
			if (hover.contents.kind === "markdown") {
				markdown.appendMarkdown(hover.contents.value);
			} else {
				markdown.appendCodeblock(
					hover.contents.value,
					hover.contents.kind || "",
				);
			}
		} else {
			markdown.appendCodeblock(
				hover.contents.value,
				hover.contents.language || "",
			);
		}

		const range = hover.range ? toVsCodeRange(hover.range) : undefined;
		return new vscode.Hover(markdown, range);
	}
}

export class HtmlDocumentSymbolProvider
	implements vscode.DocumentSymbolProvider
{
	provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<
		vscode.DocumentSymbol[] | vscode.SymbolInformation[]
	> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		// Usa a nova API com DocumentSymbol (hierárquico)
		const documentSymbols = htmlLanguageService.findDocumentSymbols2(
			lspDoc,
			htmlDoc,
		);

		if (documentSymbols.length > 0) {
			return documentSymbols.map((s) => {
				const range = toVsCodeRange(s.range);
				const selectionRange = toVsCodeRange(s.selectionRange);
				const symbol = new vscode.DocumentSymbol(
					s.name,
					s.detail || "",
					s.kind as unknown as vscode.SymbolKind,
					range,
					selectionRange,
				);

				if (s.children) {
					symbol.children = s.children.map((child) => {
						const childRange = toVsCodeRange(child.range);
						const childSelectionRange = toVsCodeRange(child.selectionRange);
						return new vscode.DocumentSymbol(
							child.name,
							child.detail || "",
							child.kind as unknown as vscode.SymbolKind,
							childRange,
							childSelectionRange,
						);
					});
				}

				return symbol;
			});
		}

		// Fallback para API antiga
		const symbols = htmlLanguageService.findDocumentSymbols(lspDoc, htmlDoc);
		return symbols.map((s) => {
			const range = toVsCodeRange(s.location.range);
			const location = new vscode.Location(
				vscode.Uri.parse(s.location.uri),
				range,
			);
			return new vscode.SymbolInformation(
				s.name,
				s.kind as unknown as vscode.SymbolKind,
				s.containerName || "",
				location,
			);
		});
	}
}

export class HtmlDocumentHighlightProvider
	implements vscode.DocumentHighlightProvider
{
	provideDocumentHighlights(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.DocumentHighlight[]> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);
		const highlights = htmlLanguageService.findDocumentHighlights(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
		);

		return highlights.map((h) => {
			const range = toVsCodeRange(h.range);
			let kind = vscode.DocumentHighlightKind.Text;

			switch (h.kind) {
				case 1:
					kind = vscode.DocumentHighlightKind.Text;
					break;
				case 2:
					kind = vscode.DocumentHighlightKind.Read;
					break;
				case 3:
					kind = vscode.DocumentHighlightKind.Write;
					break;
			}

			return new vscode.DocumentHighlight(range, kind);
		});
	}
}

export class HtmlDefinitionProvider implements vscode.DefinitionProvider {
	provideDefinition(
		_document: vscode.TextDocument,
		_position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
		//const lspDoc = toLspDocument(document);
		//const _htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		// Para HTML, a definição geralmente é o próprio elemento
		// Se quiser suporte a definições mais avançadas, pode implementar
		return undefined;
	}
}

export class HtmlReferenceProvider implements vscode.ReferenceProvider {
	provideReferences(
		document: vscode.TextDocument,
		position: vscode.Position,
		_context: vscode.ReferenceContext,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Location[]> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		// Encontra todas as ocorrências do elemento atual
		const highlights = htmlLanguageService.findDocumentHighlights(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
		);

		return highlights.map((h) => {
			const range = toVsCodeRange(h.range);
			return new vscode.Location(document.uri, range);
		});
	}
}

export class HtmlRenameProvider implements vscode.RenameProvider {
	provideRenameEdits(
		document: vscode.TextDocument,
		position: vscode.Position,
		newName: string,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.WorkspaceEdit> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);
		const workspaceEdit = htmlLanguageService.doRename(
			lspDoc,
			toLspPosition(position),
			newName,
			htmlDoc,
		);

		if (!workspaceEdit) {
			return undefined;
		}

		const edit = new vscode.WorkspaceEdit();

		if (workspaceEdit.changes) {
			Object.entries(workspaceEdit.changes).forEach(([uri, textEdits]) => {
				edit.set(
					vscode.Uri.parse(uri),
					textEdits.map(
						(te) => new vscode.TextEdit(toVsCodeRange(te.range), te.newText),
					),
				);
			});
		}

		return edit;
	}
}

export class HtmlFoldingRangeProvider implements vscode.FoldingRangeProvider {
	provideFoldingRanges(
		document: vscode.TextDocument,
		_context: vscode.FoldingContext,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.FoldingRange[]> {
		const lspDoc = toLspDocument(document);
		const foldingRanges = htmlLanguageService.getFoldingRanges(lspDoc);

		return foldingRanges.map((range) => {
			return new vscode.FoldingRange(
				range.startLine,
				range.endLine,
				range.kind as never,
			);
		});
	}
}

export class HtmlSelectionRangeProvider
	implements vscode.SelectionRangeProvider
{
	provideSelectionRanges(
		document: vscode.TextDocument,
		positions: vscode.Position[],
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.SelectionRange[]> {
		const lspDoc = toLspDocument(document);
		const lspPositions = positions.map((p) => toLspPosition(p));

		const selectionRanges = htmlLanguageService.getSelectionRanges(
			lspDoc,
			lspPositions,
		);

		return selectionRanges.map((range) => {
			let current: vscode.SelectionRange | undefined;
			let parent = range;

			while (parent) {
				const vsRange = toVsCodeRange(parent.range);
				current = new vscode.SelectionRange(vsRange, current);
				parent = parent.parent;
			}

			return current!;
		});
	}
}

export class HtmlDiagnosticProvider {
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
		const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9_-]*)(?:\s|>|\/)/g;
		const store = kireStore.getState();
		let match: RegExpExecArray | null;
		while ((match = tagRegex.exec(text)) !== null) {
			const isClosing = match[1] === "/";
			const tagName = match[2];
			const position = document.positionAt(match.index);

			// Check if element is void (self-closing)
			let isVoid = this.htmlVoidElements.has(tagName.toLowerCase());
			// kire element check
			if (store.elements.get(tagName))
				isVoid = !!store.elements.get(tagName)?.void;

			if (!isClosing && !isVoid) {
				// Only push to stack if NOT void
				stack.push({
					tag: tagName,
					line: position.line,
					char: position.character,
				});
			} else if (isClosing) {
				// Handle closing tag
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
						stack.pop(); // Matches correctly
					}
				}
			}

			// Check for void elements with separate closing tag (error)
			if (isVoid && !isClosing) {
				const nextChars = text.substring(
					match.index,
					Math.min(match.index + 200, text.length),
				);
				const closingTagPattern = new RegExp(`</${tagName}\\s*>`, "i");
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

		// Check for unclosed tags at the end
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
		// Validate unquoted attribute values
		const unquotedAttrRegex = /\s([a-zA-Z-]+)=([^"'\s>]+)(?=\s|\/?>)/g;
		let match: RegExpExecArray | null;

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

		// Validate empty attribute values
		const emptyAttrRegex = /\s([a-zA-Z-]+)=(?=\s|\/?>)/g;
		while ((match = emptyAttrRegex.exec(text)) !== null) {
			const attrName = match[1];
			const position = document.positionAt(match.index + match[0].indexOf("="));

			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(position, position.translate(0, 1)),
					`Attribute "${attrName}" has empty value`,
					vscode.DiagnosticSeverity.Warning,
				),
			);
		}
	}
}

export class HtmlDocumentLinkProvider implements vscode.DocumentLinkProvider {
	provideDocumentLinks(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.DocumentLink[]> {
		const lspDoc = toLspDocument(document);

		const documentContext: DocumentContext = {
			resolveReference: (ref, _base) => {
				// Implementação básica de resolução de referência
				if (ref.startsWith("/")) {
					return vscode.Uri.joinPath(
						vscode.workspace.workspaceFolders?.[0]?.uri || document.uri,
						ref,
					).toString();
				}
				return ref;
			},
		};

		const documentLinks = htmlLanguageService.findDocumentLinks(
			lspDoc,
			documentContext,
		);

		return documentLinks.map((link) => {
			const range = toVsCodeRange(link.range);
			const target = link.target ? vscode.Uri.parse(link.target) : undefined;
			return new vscode.DocumentLink(range, target);
		});
	}
}

// Extensão para encontrar tags correspondentes
export class HtmlMatchingTagProvider {
	async findMatchingTagPosition(
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.Position | null> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);
		const match = htmlLanguageService.findMatchingTagPosition(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
		);

		if (match) {
			return new vscode.Position(match.line, match.character);
		}

		return null;
	}
}

// Extensão para linked editing (renomear tag de abertura/fechamento juntas)
export class HtmlLinkedEditingProvider {
	provideLinkedEditingRanges(
		document: vscode.TextDocument,
		position: vscode.Position,
	): vscode.Range[] | null {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);
		const ranges = htmlLanguageService.findLinkedEditingRanges(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
		);

		if (ranges) {
			return ranges.map((r) => toVsCodeRange(r));
		}

		return null;
	}
}

// Classe principal para registrar todos os providers
export class HtmlLanguageFeatures {
	static register(_context: vscode.ExtensionContext): vscode.Disposable {
		const disposables: vscode.Disposable[] = [];

		// Registra os providers principais
		const providers = [
			vscode.languages.registerCompletionItemProvider(
				{ language: "kire" },
				new HtmlCompletionItemProvider(),
				"<",
				" ",
				'"',
				"'",
				"=",
				"/",
				":",
			),
			vscode.languages.registerHoverProvider(
				{ language: "kire" },
				new HtmlHoverProvider(),
			),
			vscode.languages.registerDocumentSymbolProvider(
				{ language: "kire" },
				new HtmlDocumentSymbolProvider(),
			),
			vscode.languages.registerDocumentHighlightProvider(
				{ language: "kire" },
				new HtmlDocumentHighlightProvider(),
			),
			vscode.languages.registerReferenceProvider(
				{ language: "kire" },
				new HtmlReferenceProvider(),
			),
			vscode.languages.registerRenameProvider(
				{ language: "kire" },
				new HtmlRenameProvider(),
			),
			vscode.languages.registerFoldingRangeProvider(
				{ language: "kire" },
				new HtmlFoldingRangeProvider(),
			),
			vscode.languages.registerSelectionRangeProvider(
				{ language: "kire" },
				new HtmlSelectionRangeProvider(),
			),
			vscode.languages.registerDocumentLinkProvider(
				{ language: "kire" },
				new HtmlDocumentLinkProvider(),
			),
		];

		disposables.push(...providers);

		// Configura diagnósticos
		const diagnosticProvider = new HtmlDiagnosticProvider();
		const diagnosticCollection =
			vscode.languages.createDiagnosticCollection("html");
		disposables.push(diagnosticCollection);

		// Atualiza diagnósticos
		const updateDiagnostics = (document: vscode.TextDocument) => {
			if (document.languageId === "kire") {
				const diagnostics = diagnosticProvider.createDiagnostics(document);
				diagnosticCollection.set(document.uri, diagnostics);
			}
		};

		disposables.push(
			vscode.workspace.onDidChangeTextDocument((e) =>
				updateDiagnostics(e.document),
			),
			vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
			vscode.workspace.onDidCloseTextDocument((doc) =>
				diagnosticCollection.delete(doc.uri),
			),
		);

		// Inicializa diagnósticos para documentos abertos
		vscode.workspace.textDocuments.forEach(updateDiagnostics);

		return vscode.Disposable.from(...disposables);
	}
}

// Comandos adicionais úteis
export function registerHtmlCommands(context: vscode.ExtensionContext) {
	const matchingTagProvider = new HtmlMatchingTagProvider();

	const goToMatchingTag = vscode.commands.registerCommand(
		"kire.goToMatchingTag",
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== "kire") {
				return;
			}

			const position = editor.selection.active;
			const match = await matchingTagProvider.findMatchingTagPosition(
				editor.document,
				position,
			);

			if (match) {
				editor.selection = new vscode.Selection(match, match);
				editor.revealRange(new vscode.Range(match, match));
			} else {
				vscode.window.showInformationMessage("No matching tag found");
			}
		},
	);

	context.subscriptions.push(goToMatchingTag);
}
