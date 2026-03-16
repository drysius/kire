import * as vscode from "vscode";
import { kireStore } from "../../core/store";
import { extractTopLevelDirectiveDeclarations } from "../../utils/directiveDeclarations";

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

		for (
			let match: RegExpExecArray | null;
			(match = directiveRegex.exec(text));
		) {
			const startPos = document.positionAt(match.index + 1);
			builder.push(startPos.line, startPos.character, match[1]!.length, 0, 0);
		}

		for (
			let match: RegExpExecArray | null;
			(match = elementRegex.exec(text));
		) {
			const full = match[0]!;
			const tagName = match[1]!;
			const startOffset = match.index + (full.startsWith("</") ? 2 : 1);
			if (
				!kireStore.getState().elements.has(tagName) &&
				!tagName.startsWith("x-")
			)
				continue;
			const startPos = document.positionAt(startOffset);
			builder.push(startPos.line, startPos.character, tagName.length, 1, 0);
		}

		const declarations = extractTopLevelDirectiveDeclarations(text);
		for (const entry of declarations) {
			if (typeof entry.start !== "number" || typeof entry.end !== "number")
				continue;
			const startPos = document.positionAt(entry.start);
			builder.push(
				startPos.line,
				startPos.character,
				entry.end - entry.start,
				4,
				1,
			);
		}

		return builder.build();
	}
}
