import * as vscode from 'vscode';
import { TypescriptCompletionItemProvider } from './completion';
import { TypescriptHoverProvider } from './hover';
import { TypescriptDiagnosticProvider } from './diagnostic';
import { provider, KIRE_TS_SCHEME } from './utils';

export const activate = (context: vscode.ExtensionContext) => {
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(KIRE_TS_SCHEME, provider)
    );

    const selector = { language: 'kire', scheme: 'file' };
    
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(selector, new TypescriptCompletionItemProvider(), '.'),
        vscode.languages.registerHoverProvider(selector, new TypescriptHoverProvider())
    );

    const diagnosticProvider = new TypescriptDiagnosticProvider();
    context.subscriptions.push(diagnosticProvider);
};

export const deactivate = () => {};
