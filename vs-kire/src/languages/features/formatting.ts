import * as vscode from "vscode";
import { kireStore } from "../../store";

export class KireFormattingProvider
	implements vscode.DocumentFormattingEditProvider
{
	provideDocumentFormattingEdits(
		document: vscode.TextDocument,
		options: vscode.FormattingOptions,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.TextEdit[]> {
		const edits: vscode.TextEdit[] = [];
		const text = document.getText();
		const lines = text.split("\n");

		let indentLevel = 0;
		const indentString = options.insertSpaces
			? " ".repeat(options.tabSize)
			: "\t";

		// Helper to check if a line is a block opener/closer
		// This is a naive line-based formatter. For production HTML mixing, a tokenizer approach is better.
		// But for Kire structure specifically, this helps.

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			const originalLine = lines[i];

			if (!line) continue; // Skip empty lines indentation adjustment? Or keep them empty.

			// Adjust indentation level BEFORE processing the line (for closing tags)
			if (this.shouldUnindent(line)) {
				indentLevel = Math.max(0, indentLevel - 1);
			} else if (this.isMiddleDirective(line)) {
				// @else, @elseif should be at the same level as the opening @if
				// So effectively unindent temporarily for this line
				indentLevel = Math.max(0, indentLevel - 1);
			}

			// Apply indentation
			const newIndentation = indentString.repeat(indentLevel);
			if (originalLine !== newIndentation + line) {
				const range = new vscode.Range(i, 0, i, originalLine.length);
				edits.push(vscode.TextEdit.replace(range, newIndentation + line));
			}

			// Adjust indentation level AFTER processing the line (for opening tags)
			if (this.shouldIndent(line)) {
				indentLevel++;
			} else if (this.isMiddleDirective(line)) {
				// Restore indent for the content following @else
				indentLevel++;
			}
		}

		return edits;
	}

	private shouldIndent(line: string): boolean {
		// 1. Kire Directives
		// Check for directives that have children
		const directiveMatch = line.match(/^@([a-zA-Z0-9_]+)/);
		if (directiveMatch) {
			const name = directiveMatch[1];

			// Exclude "end" and middle directives
			if (["end", "else", "elseif", "elif", "case", "default"].includes(name)) {
				return false;
			}

			const def = kireStore.getState().directives.get(name);
			// If definition says it has children, we indent
			if (def?.children) {
				// Check if it's self-closing or single-line?
				// Kire directives are blocks ending with @end usually.
				// Assuming standard block syntax.
				return true;
			}
			// If unknown directive, maybe assume block if not explicitly known void?
			// Safer to only indent known blocks.
		}

		// 2. HTML Tags
		// Simple regex for opening tags not self-closing and not void
		if (/^<[a-zA-Z0-9-]+[^>]*>$/.test(line) && !line.includes("/>")) {
			const tagNameMatch = line.match(/^<([a-zA-Z0-9-]+)/);
			if (tagNameMatch) {
				const tagName = tagNameMatch[1].toLowerCase();
				const voidTags = [
					"area",
					"base",
					"br",
					"col",
					"embed",
					"hr",
					"img",
					"input",
					"link",
					"meta",
					"param",
					"source",
					"track",
					"wbr",
				];
				if (!voidTags.includes(tagName)) {
					// Check if it has a closing tag on the same line
					if (!new RegExp(`</${tagName}>$`).test(line)) {
						return true;
					}
				}
			}
		}

		return false;
	}

	private shouldUnindent(line: string): boolean {
		// @end
		if (line.startsWith("@end")) return true;

		// @case / @default (act like they close the previous case?)
		// Switch/Case indentation is tricky.
		// Typically:
		// @switch
		//   @case
		//     content
		//   @end (case end?) Or does case just fall through visually?
		// Kire directives: @case has children: true. So it expects @end?
		// Checking natives.ts: @case has children: true. @switch has children: true.
		// Example:
		// @switch(val)
		//   @case('A') ... @end
		// @end
		// So @case Indents, @end Unindents.

		// HTML Closing tags
		if (/^<\/[a-zA-Z0-9-]+>/.test(line)) return true;

		return false;
	}

	private isMiddleDirective(line: string): boolean {
		// These share the parent's indentation level
		return /^@(else|elseif|elif|case|default)\b/.test(line);
	}
}
