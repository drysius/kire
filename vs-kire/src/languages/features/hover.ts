import * as vscode from "vscode";
import { kireStore } from "../../store";

export class KireHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Hover> {
		const range = document.getWordRangeAtPosition(
			position,
			/(@?[a-zA-Z0-9_\-:]+)/,
		);
		if (!range) return undefined;

		const word = document.getText(range);

		// Directive
		if (word.startsWith("@")) {
			const directiveName = word.substring(1);
			const def = kireStore.getState().directives.get(directiveName);
			if (def) {
				const md = new vscode.MarkdownString();
				md.appendCodeblock(
					`@${def.name}${def.params ? `(${def.params.join(", ")})` : ""}`,
					"kire",
				);
				if (def.description) md.appendMarkdown(`\n\n${def.description}`);
				return new vscode.Hover(md);
			}
		}

		// Element
		const elementDef = kireStore.getState().elements.get(word);
		if (elementDef) {
			const line = document.lineAt(position.line).text;
			const preceding = line.substring(0, range.start.character);
			if (/<(\/)?\s*$/.test(preceding)) {
				const md = new vscode.MarkdownString();
				md.appendCodeblock(`<${elementDef.name}>`, "html");
				if (elementDef.description)
					md.appendMarkdown(`\n\n${elementDef.description}`);
				return new vscode.Hover(md);
			}
		}

		return undefined;
	}
}
