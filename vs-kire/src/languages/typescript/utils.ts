import * as vscode from 'vscode';
import { SourceMapper } from '../../utils/sourceMap';
import { kireStore } from '../../core/store';

export const KIRE_TS_SCHEME = 'kire-ts';

function generateGlobals(): string {
    const globals = kireStore.getState().globals;
    const roots: Record<string, any> = {};

    // 1. Build Tree
    globals.forEach((def, key) => {
        if (def.type === 'directive') return;

        const parts = key.split('.');
        const rootName = parts[0];
        
        if (!roots[rootName]) roots[rootName] = { _children: {} };
        
        if (parts.length === 1) {
            roots[rootName]._def = def;
        } else {
            let current = roots[rootName];
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                if (!current._children[part]) current._children[part] = { _children: {} };
                current = current._children[part];
                if (i === parts.length - 1) {
                    current._def = def;
                }
            }
        }
    });

    // 2. Generate Declarations
    let decls = "";

    // Add default known globals if missing from schema
    if (!roots['kire']) roots['kire'] = { _def: { type: 'any' }, _children: {} };
    if (!roots['$ctx']) roots['$ctx'] = { _def: { type: 'any' }, _children: {} };
    if (!roots['it']) roots['it'] = { _def: { type: 'Record<string, any>', comment: "Kire extends variable of locals values" }, _children: {} };

    const genType = (node: any, indent: string): string => {
        // If node has children, it's an object type with properties
        const childrenKeys = Object.keys(node._children);
        if (childrenKeys.length > 0) {
            let s = "{\n";
            childrenKeys.forEach(k => {
                const child = node._children[k];
                const def = child._def;
                
                if (def && (def.description || def.comment)) {
                    s += `${indent}  /** ${def.description || def.comment} */\n`;
                }
                
                s += `${indent}  ${k}: ${genType(child, indent + "  ")};\n`;
            });
            s += `${indent}}`;
            
            // If explicit type is provided (e.g. import(...)), intersection?
            // Usually we prefer the object structure we built.
            return s;
        }
        
        // Leaf
        if (node._def) {
            let t = node._def.tstype || node._def.type || "any";
            if (Array.isArray(t)) t = t.join(" | ");
            if (t.includes("path:")) t = "string";
            if (t === "function") t = "(...args: any[]) => any";
            return t;
        }
        return "any";
    };

    Object.keys(roots).forEach(rootName => {
        const node = roots[rootName];
        const def = node._def;
        
        if (def && (def.description || def.comment)) {
            decls += `/** ${def.description || def.comment} */\n`;
        }
        
        const typeStr = genType(node, "");
        decls += `declare const ${rootName}: ${typeStr};\n`;
    });

    return decls;
}

export class KireTsDocumentProvider implements vscode.TextDocumentContentProvider {
    private virtualContent = new Map<string, string>();
    private sourceMaps = new Map<string, SourceMapper>();
    
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidChange = this._onDidChange.event;

    public provideTextDocumentContent(uri: vscode.Uri): string {
        const path = uri.path.slice(0, -3); // remove .ts
        const originalUri = uri.with({ scheme: 'file', path });
        return this.virtualContent.get(originalUri.toString()) || '';
    }

    public update(document: vscode.TextDocument): { virtualUri: vscode.Uri, mapper: SourceMapper } {
        const text = document.getText();
        const originalUri = document.uri;
        const virtualUri = originalUri.with({ scheme: KIRE_TS_SCHEME, path: originalUri.path + '.ts' });
        
        let content = generateGlobals();
        if (!content.endsWith('\n')) content += '\n';

        const mapper = new SourceMapper(originalUri.toString(), virtualUri.toString());
        
        let generatedLine = content.split('\n').length - 1; 
        
        const combinedRegex = /<\?js\b([\s\S]*?)\?>|\{\{([\s\S]*?)\}\}|([:@a-zA-Z0-9.\-]+)\s*=\s*(["'])([\s\S]*?)\4/g;
        let match;
        
        while ((match = combinedRegex.exec(text)) !== null) {
            let blockContent = "";
            let startOffset = 0;
            
            if (match[1] !== undefined) { 
                blockContent = match[1];
                startOffset = match.index + 4;
            } else if (match[2] !== undefined) { 
                blockContent = match[2];
                startOffset = match.index + 2;
            } else if (match[3] !== undefined) { 
                const attrName = match[3];
                if (attrName.startsWith(':') || attrName.startsWith('@') || attrName.startsWith('x-') || attrName.startsWith('wire:')) {
                    blockContent = match[5];
                    startOffset = match.index + match[0].indexOf(match[5]);
                }
            }

            if (!blockContent) continue;
            
            const isStatement = match[1] !== undefined;
            const suffix = isStatement ? '\n' : ';\n';
            
            content += blockContent + suffix;
            
            const lines = blockContent.split('\n');
            lines.forEach((line, i) => {
                mapper.addMapping(
                    startPos(document, startOffset).line + i,
                    (i === 0 ? startPos(document, startOffset).character : 0),
                    generatedLine + i,
                    0,
                    line.length
                );
            });
            
            generatedLine += lines.length;
        }

        this.virtualContent.set(originalUri.toString(), content);
        this.sourceMaps.set(originalUri.toString(), mapper);
        this._onDidChange.fire(virtualUri);
        
        return { virtualUri, mapper };
    }

    public getMapper(originalUri: vscode.Uri): SourceMapper | undefined {
        return this.sourceMaps.get(originalUri.toString());
    }
}

function startPos(doc: vscode.TextDocument, offset: number) {
    return doc.positionAt(offset);
}

export const provider = new KireTsDocumentProvider();
