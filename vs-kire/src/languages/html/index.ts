import * as vscode from "vscode";
import { getLanguageService } from "vscode-html-languageservice";
import { HtmlCompletionItemProvider } from "./completion";
import { HtmlHoverProvider } from "./hover";
export { HtmlDiagnosticProvider } from "./diagnostic";
import { HtmlDocumentFormattingEditProvider } from "./formatting";
import { toLspDocument, toLspPosition, toVsCodeRange } from "./utils";

const htmlLanguageService = getLanguageService();

export class HtmlDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	provideDocumentSymbols(document: vscode.TextDocument): vscode.ProviderResult<vscode.DocumentSymbol[] | vscode.SymbolInformation[]> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);
		const documentSymbols = htmlLanguageService.findDocumentSymbols2(lspDoc, htmlDoc);
		if (documentSymbols.length > 0) {
			return documentSymbols.map((s) => {
				const symbol = new vscode.DocumentSymbol(s.name, s.detail || "", s.kind as unknown as vscode.SymbolKind, toVsCodeRange(s.range), toVsCodeRange(s.selectionRange));
				if (s.children) {
					symbol.children = s.children.map((child) => new vscode.DocumentSymbol(child.name, child.detail || "", child.kind as unknown as vscode.SymbolKind, toVsCodeRange(child.range), toVsCodeRange(child.selectionRange)));
				}
				return symbol;
			});
		}
		const symbols = htmlLanguageService.findDocumentSymbols(lspDoc, htmlDoc);
		return symbols.map((s) => new vscode.SymbolInformation(s.name, s.kind as unknown as vscode.SymbolKind, s.containerName || "", new vscode.Location(vscode.Uri.parse(s.location.uri), toVsCodeRange(s.location.range))));
	}
}

export class HtmlDocumentHighlightProvider implements vscode.DocumentHighlightProvider {
	provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.DocumentHighlight[]> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);
		const highlights = htmlLanguageService.findDocumentHighlights(lspDoc, toLspPosition(position), htmlDoc);
		return highlights.map((h) => new vscode.DocumentHighlight(toVsCodeRange(h.range), h.kind as unknown as vscode.DocumentHighlightKind));
	}
}

export class HtmlFoldingRangeProvider implements vscode.FoldingRangeProvider {
	provideFoldingRanges(document: vscode.TextDocument): vscode.ProviderResult<vscode.FoldingRange[]> {
		const lspDoc = toLspDocument(document);
		const foldingRanges = htmlLanguageService.getFoldingRanges(lspDoc);
		return foldingRanges.map((range) => new vscode.FoldingRange(range.startLine, range.endLine, range.kind as never));
	}
}

export const activate = (context: vscode.ExtensionContext) => {
    const selector = { language: "kire" };
    const disposables: vscode.Disposable[] = [
        vscode.languages.registerCompletionItemProvider(selector, new HtmlCompletionItemProvider(), "<", " ", '"', "'", "=", "/", ":"),
        vscode.languages.registerHoverProvider(selector, new HtmlHoverProvider()),
        vscode.languages.registerDocumentSymbolProvider(selector, new HtmlDocumentSymbolProvider()),
        vscode.languages.registerDocumentHighlightProvider(selector, new HtmlDocumentHighlightProvider()),
        vscode.languages.registerFoldingRangeProvider(selector, new HtmlFoldingRangeProvider()),
        vscode.languages.registerDocumentFormattingEditProvider(selector, new HtmlDocumentFormattingEditProvider()),
    ];

    const diagnosticProvider = new HtmlDiagnosticProvider();
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("html");
    disposables.push(diagnosticCollection);

    const updateDiagnostics = (document: vscode.TextDocument) => {
        if (document.languageId === "kire") {
            diagnosticCollection.set(document.uri, diagnosticProvider.createDiagnostics(document));
        }
    };

    disposables.push(
        vscode.workspace.onDidChangeTextDocument((e) => updateDiagnostics(e.document)),
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        vscode.workspace.onDidCloseTextDocument((doc) => diagnosticCollection.delete(doc.uri))
    );

    vscode.workspace.textDocuments.forEach(updateDiagnostics);
    context.subscriptions.push(...disposables);
};

export const deactivate = () => {};