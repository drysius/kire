import * as vscode from 'vscode';
import { provider } from './utils';

export class TypescriptHoverProvider implements vscode.HoverProvider {
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        
        const { virtualUri, mapper } = provider.update(document);
        
        const mappedPos = mapper.toGenerated(position.line, position.character);
        if (!mappedPos) {
            return undefined;
        }
        
        const virtualPosition = new vscode.Position(mappedPos.line, mappedPos.character);

        try {
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                virtualUri,
                virtualPosition
            );
            
            if (hovers && hovers.length > 0) {
                const hover = hovers[0];
                if (hover.range) {
                    const start = mapper.toOriginal(hover.range.start.line, hover.range.start.character);
                    const end = mapper.toOriginal(hover.range.end.line, hover.range.end.character);
                    if (start && end) {
                        hover.range = new vscode.Range(start.line, start.character, end.line, end.character);
                    }
                }
                return hover;
            }
        } catch (e) {
            return undefined;
        }
        return undefined;
    }
}
