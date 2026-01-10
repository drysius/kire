import * as vscode from "vscode";

export class KireDocumentSymbolProvider
	implements vscode.DocumentSymbolProvider
{
	provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<
		vscode.SymbolInformation[] | vscode.DocumentSymbol[]
	> {
		const symbols: vscode.DocumentSymbol[] = [];
		const text = document.getText();
		const lines = text.split("\n");

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const dirMatch = /@([a-zA-Z0-9_]+)/.exec(line);
			if (dirMatch) {
				const dirName = dirMatch[1];
				if (dirName !== "end") {
					const range = new vscode.Range(
						i,
						dirMatch.index,
						i,
						dirMatch.index + dirMatch[0].length,
					);
					symbols.push(
						new vscode.DocumentSymbol(
							dirName,
							"Directive",
							vscode.SymbolKind.Function,
							range,
							range,
						),
					);
				}
			}
		}
		return symbols;
	}
}
