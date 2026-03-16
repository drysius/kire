import * as vscode from "vscode";
import {
	initKireLogChannel,
	kireLog,
	refreshKireLogConfig,
	showKireLogs,
} from "./core/log";
import { loadSchemas } from "./core/scan";

export async function activate(context: vscode.ExtensionContext) {
	initKireLogChannel(context);
	refreshKireLogConfig();
	kireLog("info", "Activating VS-Kire extension.");

	// Load initial schemas
	await loadSchemas();

	let reloadTimer: NodeJS.Timeout | undefined;
	const reloadSchemas = () => {
		if (reloadTimer) clearTimeout(reloadTimer);
		kireLog("debug", "Schema reload scheduled (debounced).");
		reloadTimer = setTimeout(() => {
			kireLog("debug", "Running schema reload.");
			void loadSchemas();
		}, 120);
	};

	// Watch schema modules
	const jsWatcher =
		vscode.workspace.createFileSystemWatcher("**/kire.schema.js");
	for (const watcher of [jsWatcher]) {
		watcher.onDidChange((uri) => {
			kireLog("debug", `Schema changed: ${uri.fsPath}`);
			reloadSchemas();
		});
		watcher.onDidCreate((uri) => {
			kireLog("debug", `Schema created: ${uri.fsPath}`);
			reloadSchemas();
		});
		watcher.onDidDelete((uri) => {
			kireLog("debug", `Schema deleted: ${uri.fsPath}`);
			reloadSchemas();
		});
		context.subscriptions.push(watcher);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand("kire.reloadSchemas", async () => {
			kireLog("info", "Manual schema reload requested.");
			await loadSchemas();
			vscode.window.showInformationMessage("Kire schemas reloaded.");
		}),
		vscode.commands.registerCommand("kire.showLogs", () => {
			showKireLogs();
		}),
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("kire.logs.debug")) {
				refreshKireLogConfig();
				kireLog("info", "Kire log configuration updated.");
			}
			if (event.affectsConfiguration("kire.schema.scanNodeModules")) {
				kireLog(
					"info",
					"kire.schema.scanNodeModules changed; reloading schemas.",
				);
				void loadSchemas();
			}
		}),
	);

	// Activate Languages
	await Promise.all([
		import("./languages/kire").then((m) => m.activate(context)),
		import("./languages/html").then((m) => m.activate(context)),
		import("./languages/typescript").then((m) => m.activate(context)),
	]);
}

export function deactivate() {
	kireLog("info", "Deactivating VS-Kire extension.");
	import("./languages/kire").then((m) => m.deactivate());
	import("./languages/html").then((m) => m.deactivate());
	import("./languages/typescript").then((m) => m.deactivate());
}
