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

			// Determine active parent directive
			const textBefore = document.getText(
				new vscode.Range(new vscode.Position(0, 0), position),
			);
			const directiveStack: string[] = [];
			const directiveRegex = /@([a-zA-Z0-9_]+)/g;
			let match: RegExpExecArray | null;

			// Re-scan to find context (simplified stack logic)
			while ((match = directiveRegex.exec(textBefore)) !== null) {
				const name = match[1];
				// Ignore "end" for stack pushing, but use it to pop
				if (name === "end") {
					directiveStack.pop();
				} else {
					const def = kireStore.getState().directives.get(name);
					// Logic: if it has children and is NOT a sub-directive (no parents defined), push.
					// Or if it simply has children. (Simplified: block starters push)
					// We need to avoid pushing intermediate directives like @else if they don't start NEW blocks in Kire structure
					// But for completion context, we generally want to know the "surrounding" block.
					// Safe heuristic: if definition has children=true/"auto", push.
					// AND if it has 'parents', we might not push? (Like @else).
					// Actually, standard Diagnostic logic: if (allowedParents) don't push.
					const allowedParents = kireStore
						.getState()
						.parentDirectives.get(name);
					if (allowedParents && allowedParents.length > 0) {
						// It's a sub-directive (e.g. else), doesn't start a new nesting context usually
					} else if (def?.children) {
						directiveStack.push(name);
					}
				}
			}
			const activeParent =
				directiveStack.length > 0
					? directiveStack[directiveStack.length - 1]
					: undefined;

			kireStore.getState().directives.forEach((def) => {
				const item = new vscode.CompletionItem(
					def.name,
					vscode.CompletionItemKind.Keyword,
				);
				item.detail = `Kire Directive (${def.type || "general"})`;
				item.documentation = new vscode.MarkdownString(def.description || "");

				// Prioritize if valid child of active parent
				if (activeParent) {
					const validParents = kireStore
						.getState()
						.parentDirectives.get(def.name);
					if (validParents && validParents.includes(activeParent)) {
						item.sortText = `0_${def.name}`; // Top priority
						item.preselect = true;
					} else {
						item.sortText = `1_${def.name}`;
					}
				} else {
					item.sortText = `1_${def.name}`;
				}

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
				// Prioritize closing if stack is not empty
				if (directiveStack.length > 0) {
					endItem.sortText = "0_end";
				}
				items.push(endItem);
			}
		}

		// 3. Attributes (Inside element tag)
		// Heuristic: line starts with <tagName ... (handling multiline is harder with linePrefix, assuming single line or simple context)
		// Better regex: Find last <TAG that isn't closed
		const lastTagMatch = linePrefix.match(/<([a-zA-Z0-9_-]+)(?:\s+[^>]*?)?$/);
		
		if (lastTagMatch) {
			const tagName = lastTagMatch[1];
			
			// Check if we are inside quotes (simple toggle check)
			const quoteCount = (linePrefix.match(/['"]/g) || []).length;
			if (quoteCount % 2 !== 0) return items; // Inside attribute value

			// Global Attributes
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

			// Element-specific Attributes
			const elementDef = kireStore.getState().elements.get(tagName);
			if (elementDef && elementDef.attributes) {
				Object.entries(elementDef.attributes).forEach(([name, rawDef]) => {
					const def = typeof rawDef === 'string' ? { type: rawDef } : rawDef;
					const item = new vscode.CompletionItem(
						name,
						vscode.CompletionItemKind.Property,
					);
					item.detail = `Attribute (${def.type}) [${tagName}]`;
					item.sortText = `0_${name}`; // Prioritize specific attributes

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
