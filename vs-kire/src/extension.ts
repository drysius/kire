import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import { loadSchemas } from "./analyzer";
import { HtmlLanguageFeatures, registerHtmlCommands } from "./languages/html";
import { KireLanguageFeatures } from "./languages/kire";

export async function activate(context: vscode.ExtensionContext) {
	// console.log('Kire extension activated.');

	// Load initial schemas
	await loadSchemas();

	// Watch for schema changes in workspace (ignoring node_modules usually)
	const watcher = vscode.workspace.createFileSystemWatcher(
		"**/kire-schema.json",
	);
	watcher.onDidChange(() => loadSchemas());
	watcher.onDidCreate(() => loadSchemas());
	watcher.onDidDelete(() => loadSchemas());
	context.subscriptions.push(watcher);

	context.subscriptions.push(
		vscode.commands.registerCommand("kire.reloadSchemas", async () => {
			await loadSchemas();
			vscode.window.showInformationMessage("Kire schemas reloaded.");
		}),
	);

	context.subscriptions.push(KireLanguageFeatures.register(context));
	context.subscriptions.push(HtmlLanguageFeatures.register(context));

	registerHtmlCommands(context);
}

randomBytes(12).toString();
export function deactivate() {}
