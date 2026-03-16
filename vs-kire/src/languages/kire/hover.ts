import type * as vscode from "vscode";
import { provideKireSchemaHover } from "./schemaHover";

export class KireHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.Hover | undefined {
		return provideKireSchemaHover(document, position);
	}
}
