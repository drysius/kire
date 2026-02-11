import * as vscode from "vscode";
import { kireStore } from "../../core/store";

export class KireHoverProvider implements vscode.HoverProvider {
	async provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): Promise<vscode.Hover | undefined> {
		const range = document.getWordRangeAtPosition(
			position,
			/(@?[a-zA-Z0-9_\-:\.]+)/,
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

		// Attribute (Schema Driven)
        const parts = word.split('.');
        let attrDef = undefined;
        let matchedName = "";

        // Try exact match first
        attrDef = kireStore.getState().attributes.get(word);
        matchedName = word;

        // If not found, try base name (wire:model)
        if (!attrDef && parts.length > 1) {
            matchedName = parts[0] as string;
            attrDef = kireStore.getState().attributes.get(matchedName);
        }
        
		if (attrDef) {
			const md = new vscode.MarkdownString();
			md.appendCodeblock(`${matchedName}="${attrDef.type}"`, "html");
            
            // Extract description (remove Modifiers section for cleaner view, usually they are at bottom)
            let description = attrDef.comment || "";
            const modifiersIndex = description.indexOf("### Modifiers");
            if (modifiersIndex !== -1) {
                description = description.substring(0, modifiersIndex).trim();
            }
            
			if (description) {
                md.appendMarkdown(`\n\n${description}`);
            }

            // Modifiers Parsing
            const modifiersMap = new Map<string, string>();
            if (attrDef.comment) {
                const modMatch = attrDef.comment.match(/### Modifiers([\s\S]*?)(?:###|$)/);
                if (modMatch) {
                    // Show full modifiers list? User asked "mostre ... Modifiers ... Current"
                    md.appendMarkdown(`\n\n**Modifiers**`);
                    md.appendMarkdown(modMatch[1] as string); // Add the list as is (markdown)
                    
                    // Parse for "Current" check
                    const lines = modMatch[1].split('\n');
                    lines.forEach(l => {
                        const m = l.match(/- `\.([a-zA-Z0-9.]+)`: (.*)/); // Handle dots in modifier name if any, usually just word
                        if (m) {
                            modifiersMap.set(m[1] as string, m[2] as string);
                        }
                    });
                }
            }

            // Current Modifier
            if (parts.length > 1) {
                const offsetInWord = position.character - range.start.character;
                let runningLength = 0;
                let currentModifier = "";
                
                for (const part of parts) {
                    if (offsetInWord >= runningLength && offsetInWord <= runningLength + part.length) {
                        currentModifier = part;
                        break;
                    }
                    runningLength += part.length + 1; // +1 for dot
                }

                if (currentModifier && currentModifier !== matchedName) { // Don't show for base attribute
                    const desc = modifiersMap.get(currentModifier);
                    if (desc) {
                        md.appendMarkdown(`\n\n**Current**`);
                        md.appendMarkdown(`\n\n\`.${currentModifier}\`: ${desc}`);
                    }
                }
            }
            
            // Module Info
            const meta = kireStore.getState().metadata;
            if (meta && meta.name) {
                md.appendMarkdown(`\n\n---\n`);
                md.appendMarkdown(`**Module**\n`);
                if (meta.author) md.appendMarkdown(`@author "${meta.author}"\n`);
                
                let pkgLabel = meta.name;
                if (meta.repository) {
                    pkgLabel = `[${meta.name}](${meta.repository})`;
                }
                md.appendMarkdown(`${pkgLabel} - ${meta.version || "0.0.0"}`);
            }

			return new vscode.Hover(md);
		}

		return undefined;
	}
}