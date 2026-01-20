import * as vscode from "vscode";
import { kireStore } from "../../store";

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

		const text = document.getText();
		const lines = text.split("\n");

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const dirMatch = /@([a-zA-Z0-9_\\.\\/:-]+)(?:\s*\(([^)]*)\))?/.exec(line);

			if (dirMatch) {
				const fullMatch = dirMatch[0];
				const dirName = dirMatch[1];
				const args = dirMatch[2] || "";
				
				const selectionRange = new vscode.Range(
					i,
					dirMatch.index,
					i,
					dirMatch.index + fullMatch.length
				);
				
				// Default range extends to end of line, will be updated if it's a block
				const range = new vscode.Range(i, dirMatch.index, i, line.length);

				if (dirName === "end") {
					// Close the current block
					if (stack.length > 0) {
						const last = stack.pop()!;
						// Update the range of the closed block to include this @end line
						last.range = new vscode.Range(last.range.start, range.end);
					}
					continue;
				}

				// Check if it's a "Section" directive (file path)
				const isSection = dirName.includes("/") || dirName.includes("\\");
				
				// Check definition for standard blocks
				const def = kireStore.getState().directives.get(dirName);
				const isBlock = def?.children === true || def?.children === "auto";

				const symbol = new vscode.DocumentSymbol(
					dirName,
					args,
					isSection ? vscode.SymbolKind.File : vscode.SymbolKind.Function,
					range,
					selectionRange
				);

				if (isSection) {
					// Implicitly close previous open section if it's at the top of the stack
					if (stack.length > 0 && (stack[stack.length - 1].kind === vscode.SymbolKind.File)) {
						const closedSection = stack.pop()!;
						// Previous section ends at the line before this one
						closedSection.range = new vscode.Range(closedSection.range.start, new vscode.Position(Math.max(0, i - 1), 9999));
					}
				}

				// Add to tree
				if (stack.length > 0) {
					const parent = stack[stack.length - 1];
					parent.children.push(symbol);
				} else {
					rootSymbols.push(symbol);
				}

				// Push to stack if it's a container
				if (isSection || isBlock) {
					// For blocks, we assume they go until @end or implicit close
					// We set the initial range to end of document as fallback
					symbol.range = new vscode.Range(selectionRange.start, new vscode.Position(document.lineCount - 1, 9999));
					stack.push(symbol);
				}
			}
		}

		return rootSymbols;
	}
}
