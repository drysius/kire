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

		// Attribute
		const attrDef = kireStore.getState().attributes.get(word);
		if (attrDef) {
			const md = new vscode.MarkdownString();
			md.appendCodeblock(`${word}="${attrDef.type}"`, "html");
			if (attrDef.comment) md.appendMarkdown(`\n\n${attrDef.comment}`);
			if (attrDef.example) {
				md.appendMarkdown("\n\n**Example:**");
				md.appendCodeblock(attrDef.example, "html");
			}
			return new vscode.Hover(md);
		}

		return undefined;
	}
}
