import * as vscode from "vscode";
import { getLanguageService, type HoverSettings } from "vscode-html-languageservice";
import { toLspDocument, toLspPosition, toVsCodeRange } from "./utils";

const htmlLanguageService = getLanguageService();

export class HtmlHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.Hover> {
		const lspDoc = toLspDocument(document);
		const htmlDoc = htmlLanguageService.parseHTMLDocument(lspDoc);

		const hoverSettings: HoverSettings = {
			documentation: true,
			references: true,
		};

		const hover = htmlLanguageService.doHover(
			lspDoc,
			toLspPosition(position),
			htmlDoc,
			hoverSettings,
		);

		if (!hover || !hover.contents) {
			return undefined;
		}

		const markdown = new vscode.MarkdownString();
		markdown.isTrusted = true;

		if (typeof hover.contents === "string") {
			markdown.appendMarkdown(hover.contents);
		} else if (Array.isArray(hover.contents)) {
			hover.contents.forEach((c, index) => {
				if (typeof c === "string") {
					markdown.appendMarkdown(c);
				} else if ("language" in c) {
					markdown.appendCodeblock(c.value, c.language);
				} else {
					markdown.appendMarkdown((c as any).value);
				}
				if (index < (hover.contents as any[]).length - 1) {
					markdown.appendText("\n\n");
				}
			});
		} else if ("kind" in hover.contents) {
			if (hover.contents.kind === "markdown") {
				markdown.appendMarkdown(hover.contents.value);
			} else {
				markdown.appendCodeblock(
					hover.contents.value,
					hover.contents.kind || "",
				);
			}
		} else {
			markdown.appendCodeblock(
				hover.contents.value,
				hover.contents.language || "",
			);
		}

		const range = hover.range ? toVsCodeRange(hover.range) : undefined;
		return new vscode.Hover(markdown, range);
	}
}
