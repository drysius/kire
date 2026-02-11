import * as vscode from "vscode";
import { TextDocument } from "vscode-languageserver-textdocument";

export function toLspDocument(document: vscode.TextDocument) {
	return TextDocument.create(
		document.uri.toString(),
		document.languageId,
		document.version,
		document.getText(),
	);
}

export function toVsCodeRange(range: {
	start: { line: number; character: number };
	end: { line: number; character: number };
}) {
	return new vscode.Range(
		range.start.line,
		range.start.character,
		range.end.line,
		range.end.character,
	);
}

export function toLspPosition(position: vscode.Position) {
	return { line: position.line, character: position.character };
}
