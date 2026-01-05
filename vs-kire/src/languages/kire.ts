import * as vscode from 'vscode';
import { kireStore, type DirectiveDefinition } from '../store';

// Semantic Tokens Legend
const tokenTypes = ['keyword', 'class', 'type', 'parameter', 'variable', 'property'];
const tokenModifiers = ['declaration', 'documentation'];
export const semanticTokensLegend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

export class KireCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const items: vscode.CompletionItem[] = [];
        const char = context.triggerCharacter;
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        // 1. Triggered by '<' -> Elements
        if (char === '<' || linePrefix.endsWith('<')) {
            const jsItem = new vscode.CompletionItem('?js', vscode.CompletionItemKind.Snippet);
            jsItem.detail = "Server-side JavaScript Block";
            jsItem.insertText = new vscode.SnippetString('?js $0 ?>');
            items.push(jsItem);

            kireStore.getState().elements.forEach((def) => {
                const item = new vscode.CompletionItem(def.name, vscode.CompletionItemKind.Class);
                item.detail = "Kire Element";
                item.documentation = new vscode.MarkdownString(def.description || '');
                if (def.void) {
                     item.insertText = new vscode.SnippetString(`${def.name} $0>`);
                } else {
                     item.insertText = new vscode.SnippetString(`${def.name}>$0</${def.name}>`);
                }
                items.push(item);
            });
        }

        // 2. Triggered by '@' -> Directives
        if (char === '@' || linePrefix.endsWith('@')) {
            if (linePrefix.endsWith('@@')) return []; // Escaped

            kireStore.getState().directives.forEach((def) => {
                const item = new vscode.CompletionItem(def.name, vscode.CompletionItemKind.Keyword);
                item.detail = `Kire Directive (${def.type || 'general'})`;
                item.documentation = new vscode.MarkdownString(def.description || '');
                
                let snippet = def.name;
                if (def.params && def.params.length > 0) {
                     snippet += '(';
                     snippet += def.params.map((p, i) => `\${${i+1}:${p.split(':')[0]}}`).join(', ');
                     snippet += ')';
                }
                
                if (def.children) {
                    snippet += "\n\t$0\n@end";
                }
                
                item.insertText = new vscode.SnippetString(snippet);
                items.push(item);
            });
            
            if (!kireStore.getState().directives.has('end')) {
                const endItem = new vscode.CompletionItem('end', vscode.CompletionItemKind.Keyword);
                endItem.documentation = "Closes the current directive block.";
                items.push(endItem);
            }
        }

        return items;
    }
}

class KireDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    
    // HTML void elements (self-closing)
    private readonly htmlVoidElements = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr',
        'img', 'input', 'link', 'meta', 'param',
        'source', 'track', 'wbr', 'command', 'keygen'
    ]);

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('kire');
    }

    dispose() {
        this.diagnosticCollection.dispose();
    }

    register(context: vscode.ExtensionContext): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        disposables.push(this.diagnosticCollection);
        
        // Update diagnostics when document changes
        const updateDiagnostics = (document: vscode.TextDocument) => {
            if (document.languageId === 'kire' || document.fileName.endsWith('.kire')) {
                this.validateDocument(document);
            }
        };
        
        disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document)),
            vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
            vscode.workspace.onDidCloseTextDocument(doc => this.diagnosticCollection.delete(doc.uri))
        );
        
        // Validate all open documents
        vscode.workspace.textDocuments.forEach(updateDiagnostics);
        
        return vscode.Disposable.from(...disposables);
    }

    async validateDocument(document: vscode.TextDocument): Promise<void> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        // Validate all aspects
        this.validateDirectives(document, text, diagnostics);
        this.validateElements(document, text, diagnostics);
        this.validateInterpolations(document, text, diagnostics);
        this.validateHtmlSyntax(document, text, diagnostics);
        this.validateElementAttributes(document, text, diagnostics);

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private validateDirectives(document: vscode.TextDocument, text: string, diagnostics: vscode.Diagnostic[]) {
        const directiveStack: Array<{ name: string, line: number, char: number }> = [];
        const directiveRegex = /@([a-zA-Z0-9_]+)(?:\s*\(([^)]*)\))?/g;
        
        // Find JS blocks to ignore directives inside them
        const jsBlocks: [number, number][] = [];
        const jsBlockRegex = /<\?js[\s\S]*?\?>/g;
        let jsMatch: RegExpExecArray | null;
        while ((jsMatch = jsBlockRegex.exec(text)) !== null) {
            jsBlocks.push([jsMatch.index, jsMatch.index + jsMatch[0].length]);
        }
        
        let match: RegExpExecArray | null;
        while ((match = directiveRegex.exec(text)) !== null) {
            // Check if inside JS block
            const matchIndex = match.index;
            const isInsideJs = jsBlocks.some(([start, end]) => matchIndex >= start && matchIndex < end);
            if (isInsideJs) continue;

            const fullMatch = match[0];
            const name = match[1];
            const argsStr = match[2];
            const position = document.positionAt(match.index);
            
            // Skip escaped directives @@
            if (match.index > 0 && text[match.index - 1] === '@') {
                continue;
            }

            // Check if directive exists
            const directiveDef = kireStore.getState().directives.get(name);
            
            if (directiveDef) {
                // Validate parameters
                if (argsStr !== undefined && directiveDef.params) {
                    this.validateDirectiveParams(document, position, name, argsStr, directiveDef, diagnostics);
                } else if (argsStr === undefined && directiveDef.params && directiveDef.params.length > 0) {
                    // Missing required parameters
                    const paramText = directiveDef.params.map(p => p.split(':')[0]).join(', ');
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(position, position.translate(0, fullMatch.length)),
                        `Directive @${name} requires parameters: (${paramText})`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
                
                // Handle block directives
                if (directiveDef.children) {
                    if (directiveDef.children === "auto") {
                        // Check if it has @end
                        const nextChars = text.substring(match.index, text.length); 
                        const hasEnd = nextChars.includes('@end');
                        
                        if (hasEnd) {
                            directiveStack.push({
                                name,
                                line: position.line,
                                char: position.character
                            });
                        }
                    } else if (directiveDef.children === true) {
                        directiveStack.push({
                            name,
                            line: position.line,
                            char: position.character
                        });
                    }
                }
                
                // Check for parent directives (elseif, else)
                if (directiveDef.parents) {
                    const parentDirective = directiveDef.parents.find(p => p.name === name);
                    if (parentDirective && directiveStack.length === 0) {
                         // Logic omitted
                    }
                }
            }
            
            // Handle @end
            if (name === 'end') {
                if (directiveStack.length === 0) {
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(position, position.translate(0, fullMatch.length)),
                        `Unexpected @end without opening directive`,
                        vscode.DiagnosticSeverity.Error
                    ));
                } else {
                    directiveStack.pop();
                }
            }
        }
        
        // Check for unclosed directives
        directiveStack.forEach(({ name, line, char }) => {
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, char, line, char + 1),
                `Directive @${name} is not closed with @end`,
                vscode.DiagnosticSeverity.Error
            ));
        });
    }
    
    private validateDirectiveParams(
        _document: vscode.TextDocument,
        position: vscode.Position,
        name: string,
        argsStr: string,
        directiveDef: DirectiveDefinition,
        diagnostics: vscode.Diagnostic[]
    ) {
        // Simple parameter count validation
        const args = this.parseDirectiveArgs(argsStr);
        const paramCount = directiveDef.params?.length || 0;
        
        if (args.length < paramCount) {
            const missingParams = directiveDef.params!.slice(args.length).map(p => p.split(':')[0]);
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(position, position.translate(0, `@${name}(${argsStr})`.length)),
                `Missing parameters for @${name}: ${missingParams.join(', ')}`,
                vscode.DiagnosticSeverity.Error
            ));
        }
        
        // Check for type hints if available
        directiveDef.params?.forEach((paramDef, index) => {
            if (index < args.length) {
                const [paramName, paramType] = paramDef.split(':');
                const argValue = args[index];
                
                // Basic type validation
                if (paramType === 'string') {
                    if (!argValue.startsWith('"') && !argValue.startsWith("'")) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(position, position.translate(0, `@${name}(${argsStr})`.length)),
                            `Parameter "${paramName}" should be a string (use quotes)`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                } else if (paramType === 'object') {
                    if (!argValue.startsWith('{')) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(position, position.translate(0, `@${name}(${argsStr})`.length)),
                            `Parameter "${paramName}" should be an object`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                } else if (paramType === 'number') {
                    if (isNaN(Number(argValue)) && !argValue.includes('$')) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(position, position.translate(0, `@${name}(${argsStr})`.length)),
                            `Parameter "${paramName}" should be a number`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                }
            }
        });
    }
    
    private parseDirectiveArgs(argsStr: string): string[] {
        const args: string[] = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';
        let braceDepth = 0;
        let bracketDepth = 0;
        let parenDepth = 0;
        
        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];
            
            // Handle quotes
            if ((char === '"' || char === "'") && (i === 0 || argsStr[i - 1] !== '\\')) {
                if (inQuote && char === quoteChar) {
                    inQuote = false;
                } else if (!inQuote) {
                    inQuote = true;
                    quoteChar = char;
                }
            }
            
            if (!inQuote) {
                if (char === '{') braceDepth++;
                else if (char === '}') braceDepth--;
                else if (char === '[') bracketDepth++;
                else if (char === ']') bracketDepth--;
                else if (char === '(') parenDepth++;
                else if (char === ')') parenDepth--;
            }
            
            if (char === ',' && !inQuote && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
                args.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            args.push(current.trim());
        }
        
        return args;
    }

    private validateElements(document: vscode.TextDocument, text: string, diagnostics: vscode.Diagnostic[]) {
        const elementRegex = /<([a-zA-Z][a-zA-Z0-9_-]*)([^>]*?)(\/?)>/g;
        
        let match: RegExpExecArray | null;
        while ((match = elementRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const name = match[1];
            const attributes = match[2];
            const isSelfClosing = match[3] === '/';
            const position = document.positionAt(match.index);
            
            // Check if it's a Kire element
            const elementDef = Array.from(kireStore.getState().elements.values())
                .find(def => {
                    if (typeof def.name === 'string') {
                        return def.name === name;
                    } else if ((def as any).name instanceof RegExp) {
                        return (def as any).name.test(name);
                    }
                    return false;
                });
            
            if (elementDef) {
                // Validate void element usage
                if (elementDef.void === true) {
                    if (!isSelfClosing) {
                        // Check if it has separate closing tag (error)
                        const nextChars = text.substring(match.index, Math.min(match.index + 500, text.length));
                        const closingTagRegex = new RegExp(`</${name}\s*>`, 'i');
                        const closingMatch = closingTagRegex.exec(nextChars);
                        
                        if (closingMatch) {
                            const closingPos = document.positionAt(match.index + closingMatch.index);
                            diagnostics.push(new vscode.Diagnostic(
                                new vscode.Range(closingPos, closingPos.translate(0, name.length + 3)),
                                `Void element <${name}> should not have a separate closing tag. Use <${name} /> instead.`,
                                vscode.DiagnosticSeverity.Error
                            ));
                        }
                        
                        // Suggest using self-closing syntax
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(position, position.translate(0, fullMatch.length)),
                            `Element <${name}> is void. Consider using self-closing syntax: <${name}${attributes}/>`,
                            vscode.DiagnosticSeverity.Information
                        ));
                    }
                } else if (isSelfClosing && !this.htmlVoidElements.has(name.toLowerCase())) {
                    // Non-void element with self-closing tag (error)
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(position, position.translate(0, fullMatch.length)),
                        `Element <${name}> is not void and should not use self-closing syntax`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }
    }

    private validateElementAttributes(document: vscode.TextDocument, text: string, diagnostics: vscode.Diagnostic[]) {
        // Validate Kire element attributes based on their definitions
        const elementRegex = /<([a-zA-Z][a-zA-Z0-9_-]*)([^>]*)>/g;
        
        let match: RegExpExecArray | null;
        while ((match = elementRegex.exec(text)) !== null) {
            const name = match[1];
            const attrsStr = match[2];
            const position = document.positionAt(match.index);
            
            // Find element definition
            const elementDef = Array.from(kireStore.getState().elements.values())
                .find(def => {
                    if (typeof def.name === 'string') {
                        return def.name === name;
                    } else if ((def as any).name instanceof RegExp) {
                        return (def as any).name.test(name);
                    }
                    return false;
                });
            
            if (elementDef) {
                // Extract attributes
                const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*["']?([^"'\s>]*)["']?/g;
                const attributes: Record<string, string> = {};
                let attrMatch: RegExpExecArray | null;
                
                while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
                    const attrName = attrMatch[1];
                    const attrValue = attrMatch[2];
                    attributes[attrName] = attrValue;
                }
                
                // Check for required attributes if element has params definition
                if ((elementDef as any).params) {
                    const requiredParams = (elementDef as any).params as string[];
                    requiredParams.forEach(paramName => {
                        if (!attributes[paramName.split(':')[0]]) {
                            diagnostics.push(new vscode.Diagnostic(
                                new vscode.Range(position, position.translate(0, name.length + 1)),
                                `Element <${name}> requires attribute "${paramName.split(':')[0]}"`,
                                vscode.DiagnosticSeverity.Warning
                            ));
                        }
                    });
                }
            }
        }
    }

    private validateInterpolations(document: vscode.TextDocument, text: string, diagnostics: vscode.Diagnostic[]) {
        // Validate {{ }} interpolations
        const interpolationRegex = /\{\{([^}]*)\}\}/g;
        let match: RegExpExecArray | null;
        
        while ((match = interpolationRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const content = match[1];
            const position = document.positionAt(match.index);
            
            // Check for empty interpolations
            if (!content.trim()) {
                diagnostics.push(new vscode.Diagnostic(
                    new vscode.Range(position, position.translate(0, fullMatch.length)),
                    `Empty interpolation`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
        
        // Validate {{{ }}} raw interpolations
        const rawInterpolationRegex = /\{\{\{([^}]*)\}\}\}/g;
        while ((match = rawInterpolationRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const content = match[1];
            const position = document.positionAt(match.index);
            
            if (!content.trim()) {
                diagnostics.push(new vscode.Diagnostic(
                    new vscode.Range(position, position.translate(0, fullMatch.length)),
                    `Empty raw interpolation`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
        
        // Check for unclosed interpolations
        const lines = text.split('\n');
        lines.forEach((line, lineIndex) => {
            const openBraces = (line.match(/\{\{/g) || []).length;
            const closeBraces = (line.match(/\}\}/g) || []).length;
            
            if (openBraces > closeBraces) {
                const charIndex = line.lastIndexOf('{{');
                if (charIndex !== -1) {
                    // Check if it continues on next line
                    const remainingText = lines.slice(lineIndex).join('\n');
                    const hasClosing = remainingText.includes('}}');
                    
                    if (!hasClosing) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + 2),
                            `Unclosed interpolation {{`,
                            vscode.DiagnosticSeverity.Error
                        ));
                    }
                }
            }
        });
    }

    private validateHtmlSyntax(document: vscode.TextDocument, text: string, diagnostics: vscode.Diagnostic[]) {
        // Simple HTML tag validation (ignores Kire elements and directives)
        const stack: Array<{ tag: string, line: number, char: number }> = [];
        const tagRegex = /<(\/?)(\w+)(?:\s|>|\/)/g;
        
        let match: RegExpExecArray | null;
        while ((match = tagRegex.exec(text)) !== null) {
            const isClosing = match[1] === '/';
            const tagName = match[2];
            const position = document.positionAt(match.index);
            
            const isKireElement = Array.from(kireStore.getState().elements.values())
                .some(def => {
                    if (typeof def.name === 'string') {
                        return def.name === tagName;
                    } else if ((def as any).name instanceof RegExp) {
                        return (def as any).name.test(tagName);
                    }
                    return false;
                });
            
            if (isKireElement) {
                continue; // Skip Kire elements, they're validated elsewhere
            }
            
            const isVoid = this.htmlVoidElements.has(tagName.toLowerCase());
            
            if (!isClosing && !isVoid) {
                stack.push({
                    tag: tagName,
                    line: position.line,
                    char: position.character
                });
            } else if (isClosing) {
                if (stack.length === 0) {
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(position, position.translate(0, tagName.length + 2)),
                        `Closing tag </${tagName}> has no corresponding opening tag`,
                        vscode.DiagnosticSeverity.Error
                    ));
                } else {
                    const last = stack[stack.length - 1];
                    if (last.tag !== tagName) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(position, position.translate(0, tagName.length + 2)),
                            `Closing tag </${tagName}> does not match opening tag <${last.tag}>`,
                            vscode.DiagnosticSeverity.Error
                        ));
                        stack.pop();
                    } else {
                        stack.pop();
                    }
                }
            }
            
            // Check for void elements with separate closing tag
            if (isVoid && !isClosing) {
                const nextChars = text.substring(match.index, Math.min(match.index + 200, text.length));
                const closingTagPattern = new RegExp(`</${tagName}\s*>`, 'i');
                const closingMatch = closingTagPattern.exec(nextChars);
                
                if (closingMatch) {
                    const closingPos = document.positionAt(match.index + closingMatch.index);
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(closingPos, closingPos.translate(0, tagName.length + 3)),
                        `Void element <${tagName}> should not have a separate closing tag`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }
        
        // Check for unclosed HTML tags
        stack.forEach(({ tag, line, char }) => {
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line, char, line, char + tag.length + 1),
                `Unclosed tag <${tag}>`,
                vscode.DiagnosticSeverity.Warning
            ));
        });
        
        // Validate attribute syntax
        const unquotedAttrRegex = /\s([a-zA-Z-]+)=([^"'\s>]+)(?=\s|\/?>)/g;
        while ((match = unquotedAttrRegex.exec(text)) !== null) {
            const attrName = match[1];
            const attrValue = match[2];
            const position = document.positionAt(match.index + match[0].indexOf(attrValue));
            
            // Check if value needs quotes
            if (attrValue.includes(' ') || attrValue.includes('=') || attrValue.includes('>')) {
                diagnostics.push(new vscode.Diagnostic(
                    new vscode.Range(position, position.translate(0, attrValue.length)),
                    `Attribute "${attrName}" value should be quoted`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
    }
}

export class KireHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position, /(@?[a-zA-Z0-9_\-:]+)/);
        if (!range) return undefined;

        const word = document.getText(range);

        // Directive
        if (word.startsWith('@')) {
            const directiveName = word.substring(1);
            const def = kireStore.getState().directives.get(directiveName);
            if (def) {
                const md = new vscode.MarkdownString();
                md.appendCodeblock(`@${def.name}${def.params ? `(${def.params.join(', ')})` : ''}`, 'kire');
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
                 md.appendCodeblock(`<${elementDef.name}>`, 'html');
                 if (elementDef.description) md.appendMarkdown(`\n\n${elementDef.description}`);
                 return new vscode.Hover(md);
             }
        }
        
        return undefined;
    }
}

export class KireDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const dirMatch = /@([a-zA-Z0-9_]+)/.exec(line);
            if (dirMatch) {
                const dirName = dirMatch[1];
                if (dirName !== 'end') {
                    const range = new vscode.Range(i, dirMatch.index, i, dirMatch.index + dirMatch[0].length);
                    symbols.push(new vscode.DocumentSymbol(
                        dirName, 'Directive', vscode.SymbolKind.Function, range, range
                    ));
                }
            }
        }
        return symbols;
    }
}

export class KireSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.SemanticTokens> {
        const builder = new vscode.SemanticTokensBuilder(semanticTokensLegend);
        const text = document.getText();
        
        // Regex for directives: @directive
        const directiveRegex = /@([a-zA-Z0-9_-]+)/g;
        
        // Regex for elements: <Element> or </Element>
        const elementRegex = /<\/?([a-zA-Z0-9_-]+)/g;

        let match:RegExpExecArray;

        // Find Directives
        while ((match = directiveRegex.exec(text))) {
            const startPos = document.positionAt(match.index);
            const value = match[0]; // Includes @
            builder.push(
                startPos.line,
                startPos.character,
                value.length,
                0, // index of 'keyword' in tokenTypes
                0
            );
        }

        // Find Elements
        while ((match = elementRegex.exec(text))) {
            const fullMatch = match[0];
            const tagName = match[1];
            const startOffset = match.index + (fullMatch.startsWith('</') ? 2 : 1);
            const startPos = document.positionAt(startOffset);
            
            if (kireStore.getState().elements.has(tagName)) {
                builder.push(
                    startPos.line,
                    startPos.character,
                    tagName.length,
                    1, // index of 'class' in tokenTypes
                    0
                );
            }
        }

        return builder.build();
    }
}

// biome-ignore lint/complexity/noStaticOnlyClass: ignore not need
export class KireLanguageFeatures {
    static register(context: vscode.ExtensionContext): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        const selector = [{ language: 'kire', scheme: 'file' }, { language: 'html', scheme: 'file', pattern: '**/*.kire' }];

        // Register diagnostic provider
        disposables.push(new KireDiagnosticProvider().register(context));
        
        // Register Providers
        disposables.push(
            vscode.languages.registerCompletionItemProvider(selector, new KireCompletionItemProvider(), '@', '<', '{'),
            vscode.languages.registerHoverProvider(selector, new KireHoverProvider()),
            vscode.languages.registerDocumentSymbolProvider(selector, new KireDocumentSymbolProvider()),
            vscode.languages.registerDocumentSemanticTokensProvider(selector, new KireSemanticTokensProvider(), semanticTokensLegend)
        );

        return vscode.Disposable.from(...disposables);
    }
}