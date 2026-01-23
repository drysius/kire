import * as vscode from "vscode";
import { kireStore } from "../../store";
import { HtmlDiagnosticProvider } from "../html";

export class TagAutoCloseProvider {
	private disposable: vscode.Disposable;

	constructor() {
		this.disposable = vscode.workspace.onDidChangeTextDocument(
			this.onDidChangeTextDocument,
			this,
		);
	}

	dispose() {
		this.disposable.dispose();
	}

	private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
		if (event.contentChanges.length === 0) return;

		const change = event.contentChanges[0];
		// Check if the user typed '>'
		if (change?.text !== ">") return;

		const document = event.document;
		// Only active for kire or html
		if (document.languageId !== "kire" && document.languageId !== "html")
			return;

		const selection = new vscode.Selection(
			change.range.start.translate(0, 1),
			change.range.start.translate(0, 1),
		);
		const offset = document.offsetAt(selection.active);
		const textBefore = document.getText().slice(0, offset); // Text up to and including the '>'

		// Check if it's a self-closing tag (/>)
		if (textBefore.endsWith("/>")) return;

		// Find the start of the tag
		const lastOpen = textBefore.lastIndexOf("<");
		if (lastOpen === -1) return;

		// Content between < and > (excluding the >)
		const textBetween = textBefore.slice(lastOpen + 1, -1);

		// Ensure no other '>' between < and current position
		if (textBetween.includes(">")) return; // Nested or previous tag or malformed

		// Extract tag name
		const match = textBetween.match(/^([a-zA-Z0-9:\-_]+)/);
		if (!match) return;

		const tagName = match[1];
		if (!tagName) return;

		// Check if void
		if (HtmlDiagnosticProvider.htmlVoidElements.has(tagName.toLowerCase())) return;

		// Check Kire elements definition
		const kireElement = kireStore.getState().elements.get(tagName);
		if (kireElement?.void) return;

		// We use a snippet string to place cursor between tags if we want,
		// but typically auto-close just appends closing tag and keeps cursor inside.
		// VS Code HTML behavior: <div>|</div>
		// So we insert </tagName> and keep cursor before it.

		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document === document) {
			editor.insertSnippet(
				new vscode.SnippetString(`$0</${tagName}>`),
				selection,
			);
		}
	}
}
