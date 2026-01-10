import * as vscode from "vscode";
import { kireStore } from "../../store";

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
			const tagName = match[1];
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

		return builder.build();
	}
}
