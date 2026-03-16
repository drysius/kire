import * as vscode from "vscode";
import { KIRE_TS_SCHEME, provider } from "./utils";

export class TypescriptDiagnosticProvider {
	private collection: vscode.DiagnosticCollection;
	private disposables: vscode.Disposable[] = [];

	constructor() {
		this.collection = vscode.languages.createDiagnosticCollection("kire-ts");
		this.disposables.push(
			vscode.languages.onDidChangeDiagnostics(
				this.onDidChangeDiagnostics,
				this,
			),
			vscode.workspace.onDidOpenTextDocument((doc) =>
				this.refreshForDocument(doc),
			),
			vscode.workspace.onDidChangeTextDocument((e) =>
				this.refreshForDocument(e.document),
			),
			vscode.workspace.onDidCloseTextDocument((doc) =>
				this.collection.delete(doc.uri),
			),
		);

		vscode.workspace.textDocuments.forEach((doc) =>
			this.refreshForDocument(doc),
		);
	}

	private async refreshForDocument(document: vscode.TextDocument) {
		if (document.languageId !== "kire" && !document.fileName.endsWith(".kire"))
			return;
		const { virtualUri } = provider.update(document);
		try {
			await vscode.commands.executeCommand(
				"vscode.executeDiagnosticProvider",
				virtualUri,
			);
		} catch {
			// Fallback on passive diagnostic updates
		}
	}

	private onDidChangeDiagnostics(e: vscode.DiagnosticChangeEvent) {
		e.uris.forEach((uri) => {
			if (uri.scheme === KIRE_TS_SCHEME) {
				this.updateDiagnostics(uri);
			}
		});
	}

	private updateDiagnostics(virtualUri: vscode.Uri) {
		const diagnostics = vscode.languages.getDiagnostics(virtualUri);

		const path = virtualUri.path.slice(0, -3);
		const originalUri = virtualUri.with({ scheme: "file", path });

		const mapper = provider.getMapper(originalUri);
		if (!mapper) return;

		const kireDiagnostics: vscode.Diagnostic[] = [];

		for (const diag of diagnostics) {
			const start = mapper.toOriginal(
				diag.range.start.line,
				diag.range.start.character,
			);
			const end = mapper.toOriginal(
				diag.range.end.line,
				diag.range.end.character,
			);

			if (start && end) {
				const range = new vscode.Range(
					start.line,
					start.character,
					end.line,
					end.character,
				);
				const kireDiag = new vscode.Diagnostic(
					range,
					diag.message,
					diag.severity,
				);
				kireDiag.code = diag.code;
				kireDiag.source = "TypeScript";
				kireDiagnostics.push(kireDiag);
			}
		}

		this.collection.set(originalUri, kireDiagnostics);
	}

	dispose() {
		this.collection.dispose();
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
	}
}
