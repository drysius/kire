import * as vscode from "vscode";
import {
	directiveAllowsStandalone,
	directiveOpensBlock,
} from "../../core/directiveLogic";
import { scanDirectives } from "../../core/directiveScan";
import { getStructuralProblems } from "../../core/engineParse";
import { kireLog } from "../../core/log";
import { kireStore } from "../../core/store";
import { isHtmlVoidElement } from "../../utils/html";
import { HtmlDiagnosticProvider } from "../html/diagnostic";

const VALIDATE_DEBOUNCE_MS = 150;

export class KireDiagnosticProvider {
	private diagnosticCollection: vscode.DiagnosticCollection;
	private htmlDiagnosticProvider: HtmlDiagnosticProvider;
	private pendingValidations = new Map<string, NodeJS.Timeout>();

	constructor() {
		this.diagnosticCollection =
			vscode.languages.createDiagnosticCollection("kire");
		this.htmlDiagnosticProvider = new HtmlDiagnosticProvider();
	}

	dispose() {
		for (const timer of this.pendingValidations.values()) clearTimeout(timer);
		this.pendingValidations.clear();
		this.diagnosticCollection.dispose();
	}

	register(_context: vscode.ExtensionContext): vscode.Disposable {
		const disposables: vscode.Disposable[] = [];
		disposables.push(this.diagnosticCollection);
		disposables.push({ dispose: () => this.dispose() });
		let refreshTimer: NodeJS.Timeout | undefined;

		const isKireDocument = (document: vscode.TextDocument) =>
			document.languageId === "kire" || document.fileName.endsWith(".kire");

		const updateDiagnostics = (document: vscode.TextDocument) => {
			if (isKireDocument(document)) void this.validateDocument(document);
		};
		// Typing triggers a change per keystroke; coalesce them per document.
		const scheduleUpdate = (document: vscode.TextDocument) => {
			if (!isKireDocument(document)) return;
			const key = document.uri.toString();
			const existing = this.pendingValidations.get(key);
			if (existing) clearTimeout(existing);
			this.pendingValidations.set(
				key,
				setTimeout(() => {
					this.pendingValidations.delete(key);
					void this.validateDocument(document);
				}, VALIDATE_DEBOUNCE_MS),
			);
		};
		const refreshOpenDocuments = () => {
			for (const document of vscode.workspace.textDocuments) {
				updateDiagnostics(document);
			}
		};

		disposables.push(
			vscode.workspace.onDidChangeTextDocument((e) =>
				scheduleUpdate(e.document),
			),
			vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
			vscode.workspace.onDidCloseTextDocument((doc) => {
				const key = doc.uri.toString();
				const pending = this.pendingValidations.get(key);
				if (pending) clearTimeout(pending);
				this.pendingValidations.delete(key);
				this.diagnosticCollection.delete(doc.uri);
			}),
		);
		disposables.push({
			dispose: kireStore.subscribe((state, previousState) => {
				if (state.revision === previousState.revision) return;
				if (refreshTimer) clearTimeout(refreshTimer);
				refreshTimer = setTimeout(() => {
					kireLog(
						"debug",
						`Refreshing Kire diagnostics after store mutation: ${kireStore.getState().lastMutation || "unknown"}`,
					);
					refreshOpenDocuments();
				}, 100);
			}),
		});
		disposables.push({
			dispose: () => {
				if (refreshTimer) clearTimeout(refreshTimer);
			},
		});

		vscode.workspace.textDocuments.forEach(updateDiagnostics);
		return vscode.Disposable.from(...disposables);
	}

	async validateDocument(document: vscode.TextDocument): Promise<void> {
		const diagnostics: vscode.Diagnostic[] = [];
		const text = document.getText();

		// Prefer the engine's own lexer for block/tag structure; the regex
		// validators are only a fallback for runtimes without parseDetailed.
		const structural = getStructuralProblems(text);
		if (structural) {
			for (const problem of structural) {
				diagnostics.push(
					new vscode.Diagnostic(
						new vscode.Range(
							document.positionAt(problem.start),
							document.positionAt(problem.end),
						),
						problem.message,
						problem.severity === "error"
							? vscode.DiagnosticSeverity.Error
							: vscode.DiagnosticSeverity.Warning,
					),
				);
			}
			this.validateDirectives(document, text, diagnostics, false);
		} else {
			this.validateDirectives(document, text, diagnostics, true);
			this.validateHtmlTags(document, text, diagnostics);
		}
		this.validateInterpolations(document, text, diagnostics);
		diagnostics.push(
			...this.htmlDiagnosticProvider.createAttributeDiagnostics(document),
		);

		this.diagnosticCollection.set(document.uri, diagnostics);
	}

	/**
	 * @param structural when false, only the "allowed parent" rule is checked
	 * (block balance already came from the engine lexer).
	 */
	private validateDirectives(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
		structural: boolean,
	) {
		const state = kireStore.getState();
		const calls = scanDirectives(text);
		const stack: Array<{ name: string; start: number; end: number }> = [];

		for (let index = 0; index < calls.length; index++) {
			const call = calls[index]!;
			const range = new vscode.Range(
				document.positionAt(call.start),
				document.positionAt(call.end),
			);

			if (call.name === "end") {
				if (stack.length === 0) {
					if (structural) diagnostics.push(
						new vscode.Diagnostic(
							range,
							"Unexpected @end without an opening directive block",
							vscode.DiagnosticSeverity.Error,
						),
					);
				} else {
					stack.pop();
				}
				continue;
			}

			if (call.name.startsWith("end") && call.name.length > 3) {
				const target = call.name.slice(3);
				const top = stack[stack.length - 1];
				if (!top) {
					if (structural) diagnostics.push(
						new vscode.Diagnostic(
							range,
							`Unexpected @${call.name} without an opening @${target}`,
							vscode.DiagnosticSeverity.Error,
						),
					);
					continue;
				}
				if (top.name !== target) {
					if (structural) diagnostics.push(
						new vscode.Diagnostic(
							range,
							`@${call.name} closes @${target}, but current block is @${top.name}`,
							vscode.DiagnosticSeverity.Error,
						),
					);
					continue;
				}
				stack.pop();
				continue;
			}

			const allowedParents = state.parentDirectives.get(call.name) || [];
			const current = stack[stack.length - 1];

			if (allowedParents.length > 0) {
				const isBranch = !!current && allowedParents.includes(current.name);
				if (isBranch) continue;
				// e.g. `@empty(items) ... @end` is valid outside a loop
				if (!directiveAllowsStandalone(call.name)) {
					diagnostics.push(
						new vscode.Diagnostic(
							range,
							`Directive @${call.name} must be inside one of: ${allowedParents.map((p) => `@${p}`).join(", ")}`,
							vscode.DiagnosticSeverity.Error,
						),
					);
					continue;
				}
			}

			if (directiveOpensBlock(text, call, calls.slice(index + 1))) {
				stack.push({
					name: call.name,
					start: call.start,
					end: call.end,
				});
			}
		}

		if (!structural) return;
		for (const unclosed of stack) {
			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(
						document.positionAt(unclosed.start),
						document.positionAt(unclosed.end),
					),
					`Directive @${unclosed.name} is not closed`,
					vscode.DiagnosticSeverity.Error,
				),
			);
		}
	}

	private validateHtmlTags(
		document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		const state = kireStore.getState();
		const stack: Array<{ name: string; start: number; end: number }> = [];
		const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)([^>]*?)(\/?)>/g;

		for (let match: RegExpExecArray | null; (match = tagRegex.exec(text)); ) {
			const closing = match[1] === "/";
			const tag = match[2]!;
			const selfClosing = match[4] === "/";
			const isKireElement = state.elements.has(tag);
			const isVoid = isKireElement
				? !!state.elements.get(tag)?.void
				: isHtmlVoidElement(tag);

			if (!closing && !selfClosing && !isVoid) {
				stack.push({
					name: tag,
					start: match.index,
					end: match.index + match[0]!.length,
				});
				continue;
			}

			if (closing) {
				const top = stack[stack.length - 1];
				if (!top) {
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								document.positionAt(match.index),
								document.positionAt(match.index + match[0]!.length),
							),
							`Closing tag </${tag}> has no opening tag`,
							vscode.DiagnosticSeverity.Error,
						),
					);
					continue;
				}

				if (top.name !== tag) {
					diagnostics.push(
						new vscode.Diagnostic(
							new vscode.Range(
								document.positionAt(match.index),
								document.positionAt(match.index + match[0]!.length),
							),
							`Closing tag </${tag}> does not match <${top.name}>`,
							vscode.DiagnosticSeverity.Error,
						),
					);
					continue;
				}

				stack.pop();
			}
		}

		for (const unclosed of stack) {
			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(
						document.positionAt(unclosed.start),
						document.positionAt(unclosed.end),
					),
					`Tag <${unclosed.name}> is not closed`,
					vscode.DiagnosticSeverity.Warning,
				),
			);
		}
	}

	private validateInterpolations(
		_document: vscode.TextDocument,
		text: string,
		diagnostics: vscode.Diagnostic[],
	) {
		const lines = text.split("\n");
		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex]!;
			const opens = (line.match(/\{\{/g) || []).length;
			const closes = (line.match(/\}\}/g) || []).length;
			if (opens <= closes) continue;

			const openPos = line.lastIndexOf("{{");
			if (openPos === -1) continue;

			const tail = lines.slice(lineIndex).join("\n");
			if (tail.includes("}}")) continue;

			diagnostics.push(
				new vscode.Diagnostic(
					new vscode.Range(lineIndex, openPos, lineIndex, openPos + 2),
					"Unclosed interpolation",
					vscode.DiagnosticSeverity.Error,
				),
			);
		}
	}
}
