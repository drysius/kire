import * as vscode from "vscode";
import * as path from "node:path";
import { kireStore } from "../../core/store";
import { parseParamDefinition } from "../../utils/params";

export class KireCompletionItemProvider
	implements vscode.CompletionItemProvider
{
	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		context: vscode.CompletionContext,
	): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
		const items: vscode.CompletionItem[] = [];
		const char = context.triggerCharacter;
		const linePrefix = document
			.lineAt(position)
			.text.substr(0, position.character);
        const text = document.getText();

		// Check if next char is '>'
		const lineText = document.lineAt(position).text;
		const nextChar =
			position.character < lineText.length ? lineText[position.character] : "";
		const hasClosingAngle = nextChar === ">";

		// Define replacement range to consume '>' if present
		const range = hasClosingAngle
			? new vscode.Range(position, position.translate(0, 1))
			: undefined;

        // -------------------------------------------------------------
        // 0. File Path Completion (Specific for filepath types)
        // -------------------------------------------------------------
        const stringMatch = linePrefix.match(/["']([^"']*)$/);
        if (stringMatch) {
            const currentString = stringMatch[1] as string;
            let isFilepathContext = false;

            // Check Context A: Attribute value
            const attrMatch = linePrefix.match(/([a-zA-Z0-9-:@.]+)\s*=\s*["']([^"']*)$/);
            if (attrMatch) {
                const attrName = attrMatch[1] as string;
                const def = kireStore.getState().attributes.get(attrName);
                if (def && (def.type === 'filepath' || (Array.isArray(def.type) && def.type.includes('filepath')))) {
                    isFilepathContext = true;
                }
            }

            // Check Context B: Directive Param
            const dirMatch = linePrefix.match(/@([a-zA-Z0-9_]+)\(([^)]*)$/);
            if (dirMatch) {
                const dirName = dirMatch[1] as string;
                const paramsStr = dirMatch[2] as string;
                const params = paramsStr.split(',');
                const paramIndex = params.length - 1;
                
                const def = kireStore.getState().directives.get(dirName);
                if (def && def.params && def.params[paramIndex]) {
                    const paramDef = parseParamDefinition(def.params[paramIndex] as string);
                    if (paramDef.type === 'filepath') {
                        isFilepathContext = true;
                    }
                }
            }

            if (isFilepathContext) {
                return this.provideFileCompletions(document, currentString);
            }
        }

        // -------------------------------------------------------------
        // 1. Variable Completion (Inside {{ }} or :attr="" or wire:attr="")
        // -------------------------------------------------------------
        // Simple check if we are likely in an expression context
        const isInInterp = linePrefix.lastIndexOf("{{") > linePrefix.lastIndexOf("}}");
        const isInJsAttr = /[:@]?[a-zA-Z0-9-.]+="[^"]*$/.test(linePrefix) || /[:@]?[a-zA-Z0-9-.]+=.[^.]*$/.test(linePrefix); // Rough check

        if (isInInterp || isInJsAttr) {
            // Check for dot trigger: object.property
            const dotMatch = linePrefix.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\.$/);
            if (dotMatch) {
                const objectName = dotMatch[1] as string;
                const globals = kireStore.getState().globals;
                
                globals.forEach((def, key) => {
                    if (key.startsWith(objectName + ".")) {
                        const propName = key.slice(objectName.length + 1);
                        if (!propName.includes(".")) { // Only direct children
                            const item = new vscode.CompletionItem(propName, vscode.CompletionItemKind.Field);
                            if (def.description || def.comment) item.documentation = def.description || def.comment;
                            items.push(item);
                        }
                    }
                });
                
                if (items.length > 0) return items;
            }

            const vars = this.extractVariables(text);
            vars.forEach(v => {
                const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Variable);
                item.detail = "Defined in <?js ?> block";
                items.push(item);
            });
            
            // Add globals if known (could come from schema)
            const globals = kireStore.getState().globals;
            if (globals) {
                globals.forEach((val, key) => {
                    if (!key.includes(".") && !key.includes(":")) { // Only top-level
                        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Variable);
                        item.detail = "Kire Global";
                        if (val.description || val.comment) item.documentation = val.description || val.comment;
                        items.push(item);
                    }
                });
            }
            
            // For now, let's just add common Kire globals if not present
            ["$ctx", "$props", "$slots", "$refs", "$wire"].forEach(g => {
                if (!globals || !globals.has(g)) {
                    const item = new vscode.CompletionItem(g, vscode.CompletionItemKind.Variable);
                    item.detail = "Kire Global";
                    items.push(item);
                }
            });
        }

        // -------------------------------------------------------------
        // 2. Colon / Namespace Completion (e.g. wire:|)
        // -------------------------------------------------------------
        const colonMatch = linePrefix.match(/([a-zA-Z0-9_-]+):$/);
        if (colonMatch) {
            const namespace = colonMatch[1] as string;
            const state = kireStore.getState();
            
            // Check Attributes
            state.attributes.forEach((def, key) => {
                if (key.startsWith(namespace + ":")) {
                    const subName = key.slice(namespace.length + 1);
                    if (!subName.includes(":") && !subName.includes(".")) {
                        const item = new vscode.CompletionItem(subName, vscode.CompletionItemKind.Property);
                        if (def.comment) item.documentation = def.comment;
                        items.push(item);
                    }
                }
            });
            
            // Check Elements
            state.elements.forEach((def, key) => {
                if (key.startsWith(namespace + ":")) {
                    const subName = key.slice(namespace.length + 1);
                    if (!subName.includes(":") && !subName.includes(".")) {
                        const item = new vscode.CompletionItem(subName, vscode.CompletionItemKind.Class);
                        if (def.description) item.documentation = def.description;
                        items.push(item);
                    }
                }
            });
            
            if (items.length > 0) return items;
        }

        // -------------------------------------------------------------
        // 3. Attribute Modifiers (e.g. wire:model.|)
        // -------------------------------------------------------------
        const modifierMatch = linePrefix.match(/([a-zA-Z0-9-:@]+)\.$/);
        if (modifierMatch) {
            const attrName = modifierMatch[1];
            if (attrName.startsWith("wire:")) {
                const modifiers = [
                    { name: "live", doc: "Updates the property in real-time." },
                    { name: "defer", doc: "Updates the property only on action (default)." },
                    { name: "debounce", doc: "Debounces the update (e.g. .debounce.500ms)." },
                    { name: "lazy", doc: "Updates on change event." },
                    { name: "blur", doc: "Updates on blur event." },
                    { name: "prevent", doc: "Prevents default event action." },
                    { name: "stop", doc: "Stops event propagation." },
                    { name: "self", doc: "Only triggers if event target is self." },
                    { name: "window", doc: "Listens on window." },
                    { name: "document", doc: "Listens on document." },
                    { name: "once", doc: "Runs only once." },
                ];

                modifiers.forEach(m => {
                    const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.EnumMember);
                    item.documentation = m.doc;
                    items.push(item);
                });
                return items;
            }
        }

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
				const name = def.name as string;
				const item = new vscode.CompletionItem(
					name,
					vscode.CompletionItemKind.Class,
				);
				item.detail = "Kire Element";
				item.documentation = new vscode.MarkdownString(
					(def.description || "") as string,
				);
				if (range) item.range = range;

				if (def.void) {
					item.insertText = new vscode.SnippetString(`${name} $0>`);
				} else {
					item.insertText = new vscode.SnippetString(`${name}>$0</${name}>`);
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
				const name = match[1] as string;
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
				const name = def.name as string;
				const item = new vscode.CompletionItem(
					name,
					vscode.CompletionItemKind.Keyword,
				);
				item.detail = `Kire Directive (${def.type || "general"})`;
				item.documentation = new vscode.MarkdownString(
					(def.description || "") as string,
				);

				// Prioritize if valid child of active parent
				if (activeParent) {
					const validParents = kireStore.getState().parentDirectives.get(name);
					if (validParents && validParents.includes(activeParent as string)) {
						item.sortText = `0_${name}`; // Top priority
						item.preselect = true;
					} else {
						item.sortText = `1_${name}`;
					}
				} else {
					item.sortText = `1_${name}`;
				}

				let snippet = name;
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
										.map((opt) => opt.split(":")[0] as string)
										.join(" or ");
								} else {
									label = p.split(":")[0] as string;
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
			const tagName = lastTagMatch[1] as string;

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
					const def = typeof rawDef === "string" ? { type: rawDef } : rawDef;
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

    private extractVariables(text: string): string[] {
        const vars = new Set<string>();
        const jsBlockRegex = /<\?js\b([\s\S]*?)\?>/g;
        let match;
        while ((match = jsBlockRegex.exec(text)) !== null) {
            const content = match[1];
            const varRegex = /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
            let vMatch;
            while ((vMatch = varRegex.exec(content)) !== null) {
                vars.add(vMatch[1]);
            }
        }
        return Array.from(vars);
    }

    private async provideFileCompletions(document: vscode.TextDocument, currentPath: string): Promise<vscode.CompletionItem[]> {
        const items: vscode.CompletionItem[] = [];
        
        let searchDir = ".";
        if (currentPath.includes("/") || currentPath.includes("\\")) {
            searchDir = path.dirname(currentPath);
        }
        
        const currentFileDir = path.dirname(document.uri.fsPath);
        const absoluteSearchDir = path.resolve(currentFileDir, searchDir);
        
        try {
            const uri = vscode.Uri.file(absoluteSearchDir);
            const entries = await vscode.workspace.fs.readDirectory(uri);
            
            for (const [name, type] of entries) {
                const isDir = type === vscode.FileType.Directory;
                const item = new vscode.CompletionItem(name, isDir ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File);
                
                if (isDir) {
                    item.command = { command: "editor.action.triggerSuggest", title: "Re-trigger completions" };
                    item.insertText = name + "/";
                }
                
                items.push(item);
            }
        } catch (e) {
            // Directory might not exist yet or no permissions
        }
        
        return items;
    }
}
