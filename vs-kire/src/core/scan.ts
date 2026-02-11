import * as vscode from "vscode";
import {
	type DirectiveDefinition,
	type ElementDefinition,
	kireStore,
} from "./store";

export async function loadSchemas(): Promise<void> {
	kireStore.getState().clear();

	try {
		// Busca todos os arquivos kire-schema.json em paralelo
		const [workspaceFiles, nodeModuleFiles] = await Promise.all([
			// Arquivos do workspace (exclui node_modules por padrão)
			vscode.workspace.findFiles("**/kire-schema.json", "**/node_modules/**"),
			// Arquivos dentro de node_modules (sem exclusões)
			vscode.workspace.findFiles("**/node_modules/**/kire-schema.json", null),
		]);

		// Combina e remove duplicados usando Map para preservar ordem
		const uniqueFiles = new Map<string, vscode.Uri>();

		// Adiciona workspace files primeiro (mais importantes)
		for (const uri of workspaceFiles) {
			uniqueFiles.set(uri.toString(), uri);
		}

		// Adiciona node modules depois
		for (const uri of nodeModuleFiles) {
			const key = uri.toString();
			if (!uniqueFiles.has(key)) {
				uniqueFiles.set(key, uri);
			}
		}

		// Processa arquivos em paralelo com limite de concorrência
		const batchSize = 5;
		const uris = Array.from(uniqueFiles.values());

		for (let i = 0; i < uris.length; i += batchSize) {
			const batch = uris.slice(i, i + batchSize);
			await Promise.all(batch.map(loadSchemaFile));
		}
	} catch (error) {
		console.error("Error loading Kire schemas:", error);
	}
}

async function loadSchemaFile(uri: vscode.Uri): Promise<void> {
	try {
		const content = await vscode.workspace.fs.readFile(uri);
		const json = JSON.parse(Buffer.from(content).toString("utf8"));

		const state = kireStore.getState();

		if (json.directives) {
			state.addDirectives(json.directives);
		}

		if (json.elements) {
			state.addElements(json.elements);
		}

		if (json.attributes) {
			state.addAttributes(json.attributes);
		}

        if (json.globals) {
            state.addGlobals(json.globals);
        }

        if (json.package || json.version) {
            state.setMetadata({
                name: json.package,
                version: json.version,
                author: json.author,
                repository: typeof json.repository === 'string' ? json.repository : json.repository?.url
            });
        }
	} catch (error) {
		console.warn(
			`Failed to load schema from ${uri.fsPath}:`,
			error instanceof Error ? error.message : "Unknown error",
		);
	}
}