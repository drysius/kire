import * as vscode from "vscode";
import { scanDirectives } from "../../core/directiveScan";
import { kireLog } from "../../core/log";
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
	implements vscode.DocumentSemanticTokensProvider, vscode.Disposable
{
	private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
	private readonly unsubscribeStore: () => void;
	private refreshTimer: NodeJS.Timeout | undefined;
	public readonly onDidChangeSemanticTokens = this.onDidChangeEmitter.event;

	constructor() {
		this.unsubscribeStore = kireStore.subscribe((state, previousState) => {
			if (state.revision === previousState.revision) return;
			if (this.refreshTimer) clearTimeout(this.refreshTimer);
			this.refreshTimer = setTimeout(() => {
				kireLog(
					"debug",
					`Refreshing semantic tokens after store mutation: ${kireStore.getState().lastMutation || "unknown"}`,
				);
				this.onDidChangeEmitter.fire();
			}, 100);
		});
	}

	dispose() {
		if (this.refreshTimer) clearTimeout(this.refreshTimer);
		this.unsubscribeStore();
		this.onDidChangeEmitter.dispose();
	}

	provideDocumentSemanticTokens(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.SemanticTokens> {
		const builder = new vscode.SemanticTokensBuilder(semanticTokensLegend);
		const text = document.getText();
		const elementRegex = /<\/?([a-zA-Z0-9:_-]+)/g;

		for (const directive of scanDirectives(text)) {
			const atPos = document.positionAt(directive.start);
			builder.push(atPos.line, atPos.character, 1, 0, 0);

			const namePos = document.positionAt(directive.start + 1);
			builder.push(
				namePos.line,
				namePos.character,
				directive.name.length,
				0,
				0,
			);

			let cursor = directive.start + directive.name.length + 1;
			while (cursor < text.length && /\s/.test(text[cursor]!)) cursor++;
			if (text[cursor] === "(" && directive.end >= cursor) {
				const openPos = document.positionAt(cursor);
				builder.push(openPos.line, openPos.character, 1, 0, 0);

				if (text[directive.end] === ")") {
					const closePos = document.positionAt(directive.end);
					builder.push(closePos.line, closePos.character, 1, 0, 0);
				}
			}
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
