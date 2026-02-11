import * as vscode from "vscode";
import { kireStore } from "../../core/store";

// Semantic Tokens Legend
const tokenTypes = [
	"keyword",
	"class",
	"type",
	"parameter",
	"variable",
	"property",
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

		// Regex for directives: @directive
		const directiveRegex = /@([a-zA-Z0-9_-]+)/g;

		// Regex for elements: <Element> or </Element>
		const elementRegex = /<\/?([a-zA-Z0-9_-]+)/g;

		let match: RegExpExecArray | null;

		// Find Directives
		while ((match = directiveRegex.exec(text))) {
			const startPos = document.positionAt(match.index);
			const value = match[0]; // Includes @
			builder.push(
				startPos.line,
				startPos.character,
				value.length,
				0, // index of 'keyword' in tokenTypes
				0,
			);
		}

		// Find Elements
		while ((match = elementRegex.exec(text))) {
			const fullMatch = match[0];
			const tagName = match[1] as string;
			const startOffset = match.index + (fullMatch.startsWith("</") ? 2 : 1);
			const startPos = document.positionAt(startOffset);

			if (kireStore.getState().elements.has(tagName)) {
				builder.push(
					startPos.line,
					startPos.character,
					tagName.length,
					1, // index of 'class' in tokenTypes
					0,
				);
			}
		}

        // Find JS Objects in Attributes (Simple heuristic for Alpine/Kire props)
        // Matches: =" { ... } " or =' { ... } '
        const jsObjectRegex = /=\s*(["'])(\{[^{}]*\})\1/g;
        while ((match = jsObjectRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const objectContent = match[2] as string;
            // Calculate start position of the object content (skipping = " )
            const quoteIndex = fullMatch.indexOf(match[1] as string);
            const objectIndex = fullMatch.indexOf(objectContent, quoteIndex);
            const startOffset = match.index + objectIndex;
            const startPos = document.positionAt(startOffset);

            builder.push(
                startPos.line,
                startPos.character,
                objectContent.length,
                4, // index of 'variable' in tokenTypes
                0
            );
        }

		return builder.build();
	}
}
