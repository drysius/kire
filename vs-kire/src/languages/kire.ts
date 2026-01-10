import * as vscode from "vscode";
import { KireCompletionItemProvider } from "./features/completion";
import { KireDiagnosticProvider } from "./features/diagnostic";
import { KireDocumentSymbolProvider } from "./features/documentSymbol";
import { KireFormattingProvider } from "./features/formatting";
import { KireHoverProvider } from "./features/hover";
import {
	KireSemanticTokensProvider,
	semanticTokensLegend,
} from "./features/semanticTokens";
import { TagAutoCloseProvider } from "./features/tagAutoClose";

export class KireLanguageFeatures {
	static register(context: vscode.ExtensionContext): vscode.Disposable {
		const disposables: vscode.Disposable[] = [];
		const selector = [
			{ language: "kire", scheme: "file" },
			{ language: "html", scheme: "file", pattern: "**/*.kire" },
		];

		// Register diagnostic provider
		disposables.push(new KireDiagnosticProvider().register(context));

		// Register auto-close tag provider
		disposables.push(new TagAutoCloseProvider());

		// Register Providers
		disposables.push(
			vscode.languages.registerCompletionItemProvider(
				selector,
				new KireCompletionItemProvider(),
				"@",
				"<",
				"{",
			),
			vscode.languages.registerHoverProvider(selector, new KireHoverProvider()),
			vscode.languages.registerDocumentSymbolProvider(
				selector,
				new KireDocumentSymbolProvider(),
			),
			vscode.languages.registerDocumentSemanticTokensProvider(
				selector,
				new KireSemanticTokensProvider(),
				semanticTokensLegend,
			),
			vscode.languages.registerDocumentFormattingEditProvider(
				selector,
				new KireFormattingProvider(),
			),
		);

		return vscode.Disposable.from(...disposables);
	}
}
