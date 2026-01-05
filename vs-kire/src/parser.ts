import { Parser } from '../../core/src/parser';
import { kireStore } from './store';
import * as vscode from 'vscode';

export interface ParseError {
    message: string;
    range: vscode.Range;
    severity?: vscode.DiagnosticSeverity;
}

export const parseFile = async (template: string): Promise<ParseError[]> => {
    const store = kireStore.getState();
    
    // Mock Kire object to match what Parser expects
    const kire = {
        getDirective: (name: string) => store.directives.get(name),
        $directives: store.directives
    };

    const parser = new Parser(template, kire as any);
    
    // Run parser
    parser.parse();

    const errors: ParseError[] = [];

    // Check for unclosed directives (items remaining on stack)
    if (parser.stack && parser.stack.length > 0) {
        for (const node of parser.stack) {
             const loc = node.loc;
             // Parser uses 1-based indexing, VS Code uses 0-based
             const startLine = (loc.start.line || 1) - 1;
             const startCol = (loc.start.column || 1) - 1;
             const endLine = (loc.end.line || 1) - 1;
             const endCol = (loc.end.column || 1) - 1;

             const range = new vscode.Range(startLine, startCol, endLine, endCol);
             
             errors.push({
                 message: `Unclosed directive @${node.name}`,
                 range,
                 severity: vscode.DiagnosticSeverity.Error
             });
        }
    }

    return errors;
}
