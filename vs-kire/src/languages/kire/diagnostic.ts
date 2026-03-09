import * as vscode from "vscode";
import { scanDirectives } from "../../core/directiveScan";
import { kireStore } from "../../core/store";

const HTML_VOID = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

export class KireDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection("kire");
    }

    dispose() {
        this.diagnosticCollection.dispose();
    }

    register(_context: vscode.ExtensionContext): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        disposables.push(this.diagnosticCollection);

        const updateDiagnostics = (document: vscode.TextDocument) => {
            if (document.languageId === "kire" || document.fileName.endsWith(".kire")) {
                void this.validateDocument(document);
            }
        };

        disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => updateDiagnostics(e.document)),
            vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
            vscode.workspace.onDidCloseTextDocument((doc) => this.diagnosticCollection.delete(doc.uri)),
        );

        vscode.workspace.textDocuments.forEach(updateDiagnostics);
        return vscode.Disposable.from(...disposables);
    }

    async validateDocument(document: vscode.TextDocument): Promise<void> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        this.validateDirectives(document, text, diagnostics);
        this.validateHtmlTags(document, text, diagnostics);
        this.validateInterpolations(document, text, diagnostics);

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private validateDirectives(
        document: vscode.TextDocument,
        text: string,
        diagnostics: vscode.Diagnostic[],
    ) {
        const state = kireStore.getState();
        const calls = scanDirectives(text);
        const stack: Array<{ name: string; start: number; end: number }> = [];

        for (const call of calls) {
            const range = new vscode.Range(document.positionAt(call.start), document.positionAt(call.end));

            if (call.name === "end") {
                if (stack.length === 0) {
                    diagnostics.push(
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
                    diagnostics.push(
                        new vscode.Diagnostic(
                            range,
                            `Unexpected @${call.name} without an opening @${target}`,
                            vscode.DiagnosticSeverity.Error,
                        ),
                    );
                    continue;
                }
                if (top.name !== target) {
                    diagnostics.push(
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

            const def = state.directives.get(call.name);
            const allowedParents = state.parentDirectives.get(call.name) || [];
            const current = stack[stack.length - 1];

            if (allowedParents.length > 0) {
                if (!current || !allowedParents.includes(current.name)) {
                    diagnostics.push(
                        new vscode.Diagnostic(
                            range,
                            `Directive @${call.name} must be inside one of: ${allowedParents.map((p) => `@${p}`).join(", ")}`,
                            vscode.DiagnosticSeverity.Error,
                        ),
                    );
                }
                continue;
            }

            if (def?.children) {
                stack.push({
                    name: call.name,
                    start: call.start,
                    end: call.end,
                });
            }
        }

        for (const unclosed of stack) {
            diagnostics.push(
                new vscode.Diagnostic(
                    new vscode.Range(document.positionAt(unclosed.start), document.positionAt(unclosed.end)),
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
                : HTML_VOID.has(tag.toLowerCase());

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
                    new vscode.Range(document.positionAt(unclosed.start), document.positionAt(unclosed.end)),
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
