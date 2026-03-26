import * as vscode from "vscode";
import {
	directiveOpensBlock,
	getDirectiveCloseTokens,
	isDirectiveCloseToken,
} from "../../core/directiveLogic";
import { scanDirectives } from "../../core/directiveScan";
import { kireStore } from "../../core/store";
import {
	ensureRangeContainsSelection,
	type SymbolPoint,
	type SymbolSpan,
} from "./documentSymbolRange";

const toSymbolPoint = (position: vscode.Position): SymbolPoint => ({
	line: position.line,
	character: position.character,
});

const toSymbolSpan = (range: vscode.Range): SymbolSpan => ({
	start: toSymbolPoint(range.start),
	end: toSymbolPoint(range.end),
});

const toVsCodeRange = (range: SymbolSpan) =>
	new vscode.Range(
		new vscode.Position(range.start.line, range.start.character),
		new vscode.Position(range.end.line, range.end.character),
	);

const createContainedRange = (
	range: vscode.Range,
	selectionRange: vscode.Range,
) =>
	toVsCodeRange(
		ensureRangeContainsSelection(
			toSymbolSpan(range),
			toSymbolSpan(selectionRange),
		),
	);

export class KireDocumentSymbolProvider
	implements vscode.DocumentSymbolProvider
{
	provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<
		vscode.SymbolInformation[] | vscode.DocumentSymbol[]
	> {
		const rootSymbols: vscode.DocumentSymbol[] = [];
		const stack: vscode.DocumentSymbol[] = [];
		const stackNames: string[] = [];

		const text = document.getText();
		const calls = scanDirectives(text);
		const documentEnd = document.lineAt(document.lineCount - 1).range.end;

		const closeSymbol = (endRange: vscode.Range) => {
			const symbol = stack.pop();
			const name = stackNames.pop();
			if (!symbol || !name) return undefined;
			symbol.range = createContainedRange(
				new vscode.Range(symbol.range.start, endRange.end),
				symbol.selectionRange,
			);
			return name;
		};

		const collapseClosedRelatedChain = (
			endRange: vscode.Range,
			closedName: string,
		) => {
			let current = closedName;
			while (stackNames.length > 0) {
				const parentName = stackNames[stackNames.length - 1]!;
				const allowedParents =
					kireStore.getState().parentDirectives.get(current) || [];
				if (!allowedParents.includes(parentName)) break;
				current = closeSymbol(endRange) || current;
			}
		};

		const findMatchingSymbolIndex = (closeToken: string) => {
			for (let index = stackNames.length - 1; index >= 0; index--) {
				const name = stackNames[index]!;
				if (
					closeToken === "end" ||
					getDirectiveCloseTokens(name).includes(closeToken)
				) {
					return index;
				}
			}
			return -1;
		};

		for (const call of calls) {
			const start = document.positionAt(call.start);
			const end = document.positionAt(call.end);
			const lineEnd = document.lineAt(start.line).range.end;
			const selectionEnd = document.positionAt(
				call.start + call.name.length + 1,
			);
			const selectionRange = new vscode.Range(start, selectionEnd);
			const range = createContainedRange(
				new vscode.Range(start, end.isAfter(lineEnd) ? end : lineEnd),
				selectionRange,
			);

			if (isDirectiveCloseToken(call.name)) {
				const matchIndex = findMatchingSymbolIndex(call.name);
				if (matchIndex < 0) continue;

				let closedName = "";
				while (stackNames.length > matchIndex) {
					closedName = closeSymbol(range) || closedName;
				}
				if (closedName) {
					collapseClosedRelatedChain(range, closedName);
				}
				continue;
			}

			const args = call.args.map((arg) => arg.value).join(", ");
			const isSection = call.name.includes("/") || call.name.includes(".");
			const isBlock = directiveOpensBlock(text, call);
			const symbol = new vscode.DocumentSymbol(
				call.name,
				args,
				isSection ? vscode.SymbolKind.File : vscode.SymbolKind.Function,
				range,
				selectionRange,
			);

			if (isSection) {
				while (
					stack.length > 0 &&
					stack[stack.length - 1]!.kind === vscode.SymbolKind.File
				) {
					const closed = stack.pop()!;
					stackNames.pop();
					closed.range = createContainedRange(
						new vscode.Range(
							closed.range.start,
							document.lineAt(Math.max(0, start.line - 1)).range.end,
						),
						closed.selectionRange,
					);
				}
			}

			if (stack.length > 0) {
				stack[stack.length - 1]!.children.push(symbol);
			} else {
				rootSymbols.push(symbol);
			}

			if (isSection || isBlock) {
				symbol.range = createContainedRange(
					new vscode.Range(selectionRange.start, documentEnd),
					selectionRange,
				);
				stack.push(symbol);
				stackNames.push(call.name);
			}
		}

		return rootSymbols;
	}
}
