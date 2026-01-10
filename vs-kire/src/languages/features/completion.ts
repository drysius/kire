import * as vscode from "vscode";
import { kireStore } from "../../store";
import { parseParamDefinition } from "../../utils/params";

export class KireCompletionItemProvider
	implements vscode.CompletionItemProvider
{
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		context: vscode.CompletionContext,
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const items: vscode.CompletionItem[] = [];
		const char = context.triggerCharacter;
		const linePrefix = document
			.lineAt(position)
			.text.substr(0, position.character);

		// Check if next char is '>'
		const lineText = document.lineAt(position).text;
		const nextChar =
			position.character < lineText.length ? lineText[position.character] : "";
		const hasClosingAngle = nextChar === ">";

		// Define replacement range to consume '>' if present
		const range = hasClosingAngle
			? new vscode.Range(position, position.translate(0, 1))
			: undefined;

		// 1. Triggered by '<' -> Elements
		if (char === "<" || linePrefix.endsWith("<")) {
			// <?js (triggered by ?)
			const jsItem = new vscode.CompletionItem(
				"?js",
				vscode.CompletionItemKind.Snippet,
			);
			jsItem.detail = "Server-side JavaScript Block";
			jsItem.insertText = new vscode.SnippetString("?js\n\t$0\n?>");
			if (range) jsItem.range = range;
			items.push(jsItem);

			// js (triggered by typing js after <)
			const jsItem2 = new vscode.CompletionItem(
				"js",
				vscode.CompletionItemKind.Snippet,
			);
			jsItem2.detail = "Server-side JavaScript Block (<?js ... ?>)";
			jsItem2.filterText = "js";
			jsItem2.insertText = new vscode.SnippetString("?js\n\t$0\n?>");
			if (range) jsItem2.range = range;
			items.push(jsItem2);

			kireStore.getState().elements.forEach((def) => {
				const item = new vscode.CompletionItem(
					def.name,
					vscode.CompletionItemKind.Class,
				);
				item.detail = "Kire Element";
				item.documentation = new vscode.MarkdownString(def.description || "");
				if (range) item.range = range;

				if (def.void) {
					item.insertText = new vscode.SnippetString(`${def.name} $0>`);
				} else {
					item.insertText = new vscode.SnippetString(
						`${def.name}>$0</${def.name}>`,
					);
				}
				items.push(item);
			});
		}

		// 2. Triggered by '@' -> Directives
		if (char === "@" || linePrefix.endsWith("@")) {
			if (linePrefix.endsWith("@@")) return []; // Escaped

			kireStore.getState().directives.forEach((def) => {
				const item = new vscode.CompletionItem(
					def.name,
					vscode.CompletionItemKind.Keyword,
				);
				item.detail = `Kire Directive (${def.type || "general"})`;
				item.documentation = new vscode.MarkdownString(def.description || "");

				let snippet = def.name;
				if (def.params && def.params.length > 0) {
					snippet += "(";
					snippet += def.params
						.map((p, i) => {
							let label = p;
							try {
								const parsed = parseParamDefinition(p);
								label = parsed.name;
								// If pattern match, maybe use the pattern as placeholder if name is generic?
								if (label === "pattern_match" || label === "regex_match") {
									// Try to use a cleaner version of the raw definition if possible
									label = parsed.rawDefinition;
								}
							} catch (_e) {
								// Fallback
								if (p.includes("|")) {
									label = p
										.split("|")
										.map((opt) => opt.split(":")[0])
										.join(" or ");
								} else {
									label = p.split(":")[0];
								}
							}
							return `\${{${i + 1}:${label}}}`;
						})
						.join(", ");
					snippet += ")";
				}

				if (def.children) {
					snippet += "\n\t$0\n@end";
				}

				item.insertText = new vscode.SnippetString(snippet);
				items.push(item);
			});

			if (!kireStore.getState().directives.has("end")) {
				const endItem = new vscode.CompletionItem(
					"end",
					vscode.CompletionItemKind.Keyword,
				);
				endItem.documentation = "Closes the current directive block.";
				items.push(endItem);
			}
		}

		// 3. Attributes (Inside element tag)
		// Heuristic: line has <tagName, and we are not inside quotes (simplified)
		const tagMatch = linePrefix.match(/<[a-zA-Z0-9_-]+/);
		if (tagMatch && !linePrefix.includes(">")) {
			// Check if we are inside a directive param or something else
			// If last char is space, or we are typing an attribute name
			const isAttributeContext = /\s[a-zA-Z0-9_\-:]*$/.test(linePrefix);

			if (isAttributeContext) {
				kireStore.getState().attributes.forEach((def, name) => {
					const item = new vscode.CompletionItem(
						name,
						vscode.CompletionItemKind.Property,
					);
					item.detail = `Attribute (${def.type})`;

					const doc = new vscode.MarkdownString(def.comment || "");
					if (def.example) {
						doc.appendCodeblock(def.example, "html");
					}
					item.documentation = doc;

					item.insertText = new vscode.SnippetString(`${name}="$0"`);
					items.push(item);
				});
			}
		}

		return items;
	}
}
