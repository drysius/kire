import * as vscode from "vscode";
import {
	directiveOpensBlock,
	getDirectiveCloseTokens,
	isDirectiveCloseToken,
} from "../../core/directiveLogic";
import { scanDirectives } from "../../core/directiveScan";
import { kireStore } from "../../core/store";

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
			symbol.range = new vscode.Range(symbol.range.start, endRange.end);
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
			const selectionRange = new vscode.Range(start, end);
			const lineEnd = document.lineAt(start.line).range.end;
			const range = new vscode.Range(start, lineEnd);

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
					closed.range = new vscode.Range(
						closed.range.start,
						document.lineAt(Math.max(0, start.line - 1)).range.end,
					);
				}
			}

			if (stack.length > 0) {
				stack[stack.length - 1]!.children.push(symbol);
			} else {
				rootSymbols.push(symbol);
			}

			if (isSection || isBlock) {
				symbol.range = new vscode.Range(
					selectionRange.start,
					documentEnd,
				);
				stack.push(symbol);
				stackNames.push(call.name);
			}
		}

		return rootSymbols;
	}
}
