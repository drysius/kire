import * as vscode from "vscode";
import { kireStore } from "../../core/store";

const tokenTypes = [
    "keyword",
    "class",
    "type",
    "parameter",
    "variable",
    "property",
    "string",
];

const tokenModifiers = ["declaration", "documentation"];
export const semanticTokensLegend = new vscode.SemanticTokensLegend(
    tokenTypes,
    tokenModifiers,
);

export class KireSemanticTokensProvider
    implements vscode.DocumentSemanticTokensProvider
{
    provideDocumentSemanticTokens(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.SemanticTokens> {
        const builder = new vscode.SemanticTokensBuilder(semanticTokensLegend);
        const text = document.getText();

        const directiveRegex = /@([a-zA-Z0-9_-]+)/g;
        const elementRegex = /<\/?([a-zA-Z0-9:_-]+)/g;

        for (let match: RegExpExecArray | null; (match = directiveRegex.exec(text)); ) {
            const startPos = document.positionAt(match.index);
            builder.push(startPos.line, startPos.character, match[0]!.length, 0, 0);
        }

        for (let match: RegExpExecArray | null; (match = elementRegex.exec(text)); ) {
            const full = match[0]!;
            const tagName = match[1]!;
            const startOffset = match.index + (full.startsWith("</") ? 2 : 1);
            if (!kireStore.getState().elements.has(tagName)) continue;
            const startPos = document.positionAt(startOffset);
            builder.push(startPos.line, startPos.character, tagName.length, 1, 0);
        }

        return builder.build();
    }
}
