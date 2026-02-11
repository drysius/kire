import * as vscode from "vscode";
import { KireCompletionItemProvider } from "./completion";
import { KireDiagnosticProvider } from "./diagnostic";
import { KireDocumentSymbolProvider } from "./documentSymbol";
import { KireFoldingRangeProvider } from "./folding";
import { FeatureFormatting } from "./formatting";
import { KireHoverProvider } from "./hover";
import {
	KireSemanticTokensProvider,
	semanticTokensLegend,
} from "./semanticTokens";
import { TagAutoCloseProvider } from "./tagAutoClose";

export const activate = (context: vscode.ExtensionContext) => {
	const selector = [
		{ language: "kire", scheme: "file" },
		{ language: "html", scheme: "file", pattern: "**/*.kire" },
	];

	// Register diagnostic provider
	const diagnosticProvider = new KireDiagnosticProvider();
	context.subscriptions.push(diagnosticProvider.register(context));

	// Register auto-close tag provider
	context.subscriptions.push(new TagAutoCloseProvider());

	// Register Providers
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			selector,
			new KireCompletionItemProvider(),
			"@",
			"<",
			"{",
            "/",
            "\\",
            ".",
            ":"
		),
		vscode.languages.registerHoverProvider(selector, new KireHoverProvider()),
		vscode.languages.registerDocumentSymbolProvider(
			selector,
			new KireDocumentSymbolProvider(),
		),
		vscode.languages.registerFoldingRangeProvider(
			selector,
			new KireFoldingRangeProvider(),
		),
		vscode.languages.registerDocumentSemanticTokensProvider(
			selector,
			new KireSemanticTokensProvider(),
			semanticTokensLegend,
		),
		vscode.languages.registerDocumentFormattingEditProvider(
			selector,
			new FeatureFormatting(),
		),
	);
};

export const deactivate = () => {};