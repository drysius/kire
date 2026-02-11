import * as vscode from "vscode";
import { loadSchemas } from "./core/scan";

export async function activate(context: vscode.ExtensionContext) {
	// Load initial schemas
	await loadSchemas();

	// Watch for schema changes
	const watcher = vscode.workspace.createFileSystemWatcher("**/kire-schema.json");
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

    // Activate Languages
    await Promise.all([
        import("./languages/kire").then(m => m.activate(context)),
        import("./languages/html").then(m => m.activate(context)),
        import("./languages/typescript").then(m => m.activate(context)),
    ]);
}

export function deactivate() {
    import("./languages/kire").then(m => m.deactivate());
    import("./languages/html").then(m => m.deactivate());
    import("./languages/typescript").then(m => m.deactivate());
}
