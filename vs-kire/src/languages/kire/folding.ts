import * as vscode from "vscode";
import { kireStore } from "../../core/store";

export class KireFoldingRangeProvider implements vscode.FoldingRangeProvider {
	provideFoldingRanges(
		document: vscode.TextDocument,
		_context: vscode.FoldingContext,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.FoldingRange[]> {
		const ranges: vscode.FoldingRange[] = [];
		const stack: { name: string; line: number }[] = [];

		const state = kireStore.getState();
		const directives = state.directives;

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const text = line.text.trim();

			if (!text.startsWith("@")) continue;

			const match = text.match(/^@([a-zA-Z0-9_]+)/);
			if (!match) continue;

			const name = match[1] as string;

			// -------------------------
			// Fecha bloco: @end
			// -------------------------
			if (name === "end") {
				if (stack.length > 0) {
					const current = stack.pop()!;
					const endLine = i - 1; // NÃO incluir o @end, para ele continuar visível

					if (endLine > current.line) {
						ranges.push(new vscode.FoldingRange(current.line, endLine));
					}
				}
				continue;
			}

			const def = directives.get(name);
			if (!def) continue;

			// -------------------------
			// Middle directives (ex: @else, @elseif...)
			// devem "quebrar" a seção, mas não fecham o bloco inteiro.
			// -------------------------
			const isMiddle = state.parentDirectives.has(name);
			if (isMiddle) {
				if (stack.length > 0) {
					const current = stack[stack.length - 1]!;
					const endLine = i - 1; // dobra até a linha anterior do @else/@elseif

					if (endLine > current.line) {
						ranges.push(new vscode.FoldingRange(current.line, endLine));
					}

					// Recomeça a seção a partir do middle (@else fica visível como "header" do fold)
					current.line = i;
				}
				continue;
			}

			// -------------------------
			// Abertura de bloco (ex: @if, @for, ...)
			// -------------------------
			if (def.children) {
				stack.push({ name, line: i });
			}
		}

		return ranges;
	}
}
