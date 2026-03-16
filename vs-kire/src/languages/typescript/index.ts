import * as vscode from "vscode";
import { TypescriptCompletionItemProvider } from "./completion";
import { TypescriptDiagnosticProvider } from "./diagnostic";
import { TypescriptHoverProvider } from "./hover";
import { KIRE_TS_SCHEME, provider } from "./utils";

export const activate = (context: vscode.ExtensionContext) => {
	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(
			KIRE_TS_SCHEME,
			provider,
		),
	);
	provider.bootstrapWorkspaceInterfaces();

	const selector = { language: "kire", scheme: "file" };

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			selector,
			new TypescriptCompletionItemProvider(),
			".",
		),
		vscode.languages.registerHoverProvider(
			selector,
			new TypescriptHoverProvider(),
		),
	);

	const diagnosticProvider = new TypescriptDiagnosticProvider();
	context.subscriptions.push(diagnosticProvider);

	const kireWatcher = vscode.workspace.createFileSystemWatcher("**/*.kire");
	const kireHtmlWatcher =
		vscode.workspace.createFileSystemWatcher("**/*.kire.html");
	for (const watcher of [kireWatcher, kireHtmlWatcher]) {
		watcher.onDidChange(() => provider.scheduleWorkspaceInterfaceRescan());
		watcher.onDidCreate(() => provider.scheduleWorkspaceInterfaceRescan());
		watcher.onDidDelete(() => provider.scheduleWorkspaceInterfaceRescan());
		context.subscriptions.push(watcher);
	}
};

export const deactivate = () => {};
