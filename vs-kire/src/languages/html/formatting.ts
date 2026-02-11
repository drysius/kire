import * as vscode from "vscode";
import { getLanguageService } from "vscode-html-languageservice";
import { toLspDocument, toVsCodeRange } from "./utils";

const htmlLanguageService = getLanguageService();

export class HtmlDocumentFormattingEditProvider
	implements vscode.DocumentFormattingEditProvider
{
	provideDocumentFormattingEdits(
		document: vscode.TextDocument,
		options: vscode.FormattingOptions,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.TextEdit[]> {
		const lspDoc = toLspDocument(document);

		const formatOptions = {
			tabSize: options.tabSize,
			insertSpaces: options.insertSpaces,
			indentScripts: "keep" as any,
			unformatted: "",
		};

		const textEdits = htmlLanguageService.format(
			lspDoc,
			undefined,
			formatOptions,
		);

		return textEdits.map(
			(edit) => new vscode.TextEdit(toVsCodeRange(edit.range), edit.newText),
		);
	}
}
