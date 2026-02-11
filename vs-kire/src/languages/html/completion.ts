import * as vscode from "vscode";
import { getLanguageService } from "vscode-html-languageservice";
import { toLspDocument, toLspPosition, toVsCodeRange } from "./utils";

const htmlLanguageService = getLanguageService();

export class HtmlCompletionItemProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext,
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		const completionConfig = {
			hideAutoCompleteProposals: false,
		};

		const htmlList = htmlLanguageService.doComplete(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
			completionConfig,
		);

		return htmlList.items.map((item) => {
			const newItem = new vscode.CompletionItem(item.label);
			newItem.kind = item.kind as unknown as vscode.CompletionItemKind;

			if (item.detail) newItem.detail = item.detail;
			if (item.documentation) {
				newItem.documentation = (
					typeof item.documentation === "string"
						? new vscode.MarkdownString(item.documentation)
						: item.documentation
				) as any;
			}

			newItem.insertText = item.insertText
				? typeof item.insertText === "string"
					? item.insertText
					: (item.insertText as any).value
				: item.label;

			if (item.filterText) newItem.filterText = item.filterText;
			if (item.sortText) newItem.sortText = item.sortText;
			if (item.preselect !== undefined) newItem.preselect = item.preselect;
			if (item.commitCharacters)
				newItem.commitCharacters = item.commitCharacters;

			if (item.textEdit) {
				if ("range" in item.textEdit && "newText" in item.textEdit) {
					newItem.range = toVsCodeRange(item.textEdit.range);
					newItem.insertText = item.textEdit.newText;
				}
			}

			if (item.additionalTextEdits) {
				newItem.additionalTextEdits = item.additionalTextEdits.map(
					(edit) =>
						new vscode.TextEdit(toVsCodeRange(edit.range), edit.newText),
				);
			}

			return newItem;
		});
	}
}
