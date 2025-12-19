import * as vscode from 'vscode';
import { kireStore, DirectiveDefinition, ElementDefinition } from './store';

export async function loadSchemas() {
	// console.log('Loading Kire schemas...');
    kireStore.getState().clear();

    const pattern = '**/{kire-schema.json,node_modules/**/kire-schema.json}';
    // Passing null as second argument disables default excludes (like node_modules)
    const files = await vscode.workspace.findFiles('**/kire-schema.json', '**/node_modules/**'); 
    // Wait, if I exclude node_modules, I won't find them. 
    // But searching ONLY in node_modules is also needed.
    // Let's do two searches to be safe and clearer.

    // 1. Workspace files (respecting ignores, so skipping node_modules usually)
    const workspaceFiles = await vscode.workspace.findFiles('**/kire-schema.json');

    // 2. Node modules explicitly (ignoring default excludes)
    // We want to find files inside node_modules.
    // pattern: '**/node_modules/**/kire-schema.json'
    // exclude: null (don't exclude node_modules)
    const nodeModuleFiles = await vscode.workspace.findFiles('**/node_modules/**/kire-schema.json', null);

    const uniqueUris = new Set([...workspaceFiles.map(u => u.toString()), ...nodeModuleFiles.map(u => u.toString())]);
    
    // console.log(`Found ${uniqueUris.size} schema files.`);

    for (const uriStr of uniqueUris) {
        const uri = vscode.Uri.parse(uriStr);
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const json = JSON.parse(new TextDecoder().decode(content));
            
            if (json.directives) {
                kireStore.getState().addDirectives(json.directives as DirectiveDefinition[]);
            }
            if (json.elements) {
                kireStore.getState().addElements(json.elements as ElementDefinition[]);
            }
        } catch (e) {
            console.error(`Failed to load schema from ${uri.fsPath}:`, e);
        }
    }
}
