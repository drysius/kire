import * as vscode from 'vscode';
import { provider } from './utils';

export class TypescriptCompletionItemProvider implements vscode.CompletionItemProvider {
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        
        const { virtualUri, mapper } = provider.update(document);
        
        const mappedPos = mapper.toGenerated(position.line, position.character);
        if (!mappedPos) {
            return [];
        }
        
        const virtualPosition = new vscode.Position(mappedPos.line, mappedPos.character);

        try {
            const result = await vscode.commands.executeCommand<vscode.CompletionList | vscode.CompletionItem[]>(
                'vscode.executeCompletionItemProvider',
                virtualUri,
                virtualPosition,
                context.triggerCharacter
            );
            
            if (!result) return [];
            const items = Array.isArray(result) ? result : result.items;

            return items.map(item => {
                if (item.range) {
                    if (item.range instanceof vscode.Range) {
                        const start = mapper.toOriginal(item.range.start.line, item.range.start.character);
                        const end = mapper.toOriginal(item.range.end.line, item.range.end.character);
                        if (start && end) {
                            item.range = new vscode.Range(start.line, start.character, end.line, end.character);
                        }
                    } else if ((item.range as any).inserting) {
                        const r = item.range as { inserting: vscode.Range, replacing: vscode.Range };
                        const iStart = mapper.toOriginal(r.inserting.start.line, r.inserting.start.character);
                        const iEnd = mapper.toOriginal(r.inserting.end.line, r.inserting.end.character);
                        const pStart = mapper.toOriginal(r.replacing.start.line, r.replacing.start.character);
                        const pEnd = mapper.toOriginal(r.replacing.end.line, r.replacing.end.character);
                        
                        if (iStart && iEnd && pStart && pEnd) {
                            item.range = {
                                inserting: new vscode.Range(iStart.line, iStart.character, iEnd.line, iEnd.character),
                                replacing: new vscode.Range(pStart.line, pStart.character, pEnd.line, pEnd.character)
                            };
                        }
                    }
                }
                return item;
            });
        } catch (e) {
            return [];
        }
    }
}