import * as vscode from 'vscode';
import { loadSchemas } from './analyzer';
import { KireHoverProvider } from './providers/hover';
import { KireSemanticTokensProvider, legend } from './providers/semanticTokens';

export async function activate(context: vscode.ExtensionContext) {
    // console.log('Kire extension activated.');

    // Load initial schemas
    await loadSchemas();

    // Watch for schema changes in workspace (ignoring node_modules usually)
    const watcher = vscode.workspace.createFileSystemWatcher('**/kire-schema.json');
    watcher.onDidChange(() => loadSchemas());
    watcher.onDidCreate(() => loadSchemas());
    watcher.onDidDelete(() => loadSchemas());
    context.subscriptions.push(watcher);
    
    // Command to manually reload
    context.subscriptions.push(vscode.commands.registerCommand('kire.reloadSchemas', async () => {
        await loadSchemas();
        vscode.window.showInformationMessage('Kire schemas reloaded.');
    }));

    const selector = [{ language: 'kire', scheme: 'file' }, { language: 'html', scheme: 'file', pattern: '**/*.kire' }];

    // Register Hover
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(selector, new KireHoverProvider())
    );

    // Register Semantic Tokens
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(selector, new KireSemanticTokensProvider(), legend)
    );
}

export function deactivate() {}
