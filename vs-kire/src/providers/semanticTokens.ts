import * as vscode from 'vscode';
import { kireStore } from '../store';

const tokenTypes = ['keyword', 'class'];
const tokenModifiers = ['declaration'];
export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

export class KireSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens> {
        const builder = new vscode.SemanticTokensBuilder(legend);
        const text = document.getText();
        
        // Match Directives
        // Using simple regex for speed. 
        const directiveRegex = /@([a-zA-Z0-9_]+)/g;
        let match;
        while ((match = directiveRegex.exec(text))) {
            const name = match[1];
            if (kireStore.getState().directives.has(name)) {
                const startPos = document.positionAt(match.index);
                // Highlight the full @name. 
                // We use type index 0 ('keyword') -> typically Purple.
                builder.push(startPos.line, startPos.character, match[0].length, 0, 0); 
            }
        }

        // Match Elements
        // Matches <name or </name
        const elementRegex = /<\/?([a-zA-Z0-9_\-:]+)/g;
        while ((match = elementRegex.exec(text))) {
            const name = match[1];
            if (kireStore.getState().elements.has(name)) {
                // We need the position of the name itself
                const offset = match[0].indexOf(name);
                const startPos = document.positionAt(match.index + offset);
                
                // We use type index 1 ('class') -> typically Green.
                builder.push(startPos.line, startPos.character, name.length, 1, 0);
            }
        }

        return builder.build();
    }
}
