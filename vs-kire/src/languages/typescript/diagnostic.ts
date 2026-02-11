import * as vscode from 'vscode';
import { KIRE_TS_SCHEME, provider } from './utils';

export class TypescriptDiagnosticProvider {
    private collection: vscode.DiagnosticCollection;
    private disposable: vscode.Disposable;

    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection('kire-ts');
        this.disposable = vscode.languages.onDidChangeDiagnostics(this.onDidChangeDiagnostics, this);
    }

    private onDidChangeDiagnostics(e: vscode.DiagnosticChangeEvent) {
        e.uris.forEach(uri => {
            if (uri.scheme === KIRE_TS_SCHEME) {
                this.updateDiagnostics(uri);
            }
        });
    }

    private updateDiagnostics(virtualUri: vscode.Uri) {
        const diagnostics = vscode.languages.getDiagnostics(virtualUri);
        
        const path = virtualUri.path.slice(0, -3); 
        const originalUri = virtualUri.with({ scheme: 'file', path });
        
        const mapper = provider.getMapper(originalUri);
        if (!mapper) return;

        const kireDiagnostics: vscode.Diagnostic[] = [];

        for (const diag of diagnostics) {
            const start = mapper.toOriginal(diag.range.start.line, diag.range.start.character);
            const end = mapper.toOriginal(diag.range.end.line, diag.range.end.character);

            if (start && end) {
                const range = new vscode.Range(start.line, start.character, end.line, end.character);
                const kireDiag = new vscode.Diagnostic(range, diag.message, diag.severity);
                kireDiag.code = diag.code;
                kireDiag.source = 'TypeScript';
                kireDiagnostics.push(kireDiag);
            }
        }

        this.collection.set(originalUri, kireDiagnostics);
    }

    dispose() {
        this.collection.dispose();
        this.disposable.dispose();
    }
}
