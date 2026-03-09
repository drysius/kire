
export interface SourceMap {
    originalLine: number;
    originalCharacter: number;
    generatedLine: number;
    generatedCharacter: number;
    length: number;
}

export class SourceMapper {
    private maps: SourceMap[] = [];

    constructor(
        public originalUri: string,
        public generatedUri: string
    ) {}

    addMapping(
        originalLine: number,
        originalCharacter: number,
        generatedLine: number,
        generatedCharacter: number,
        length: number
    ) {
        this.maps.push({
            originalLine,
            originalCharacter,
            generatedLine,
            generatedCharacter,
            length
        });
    }

    /**
     * Maps a position from the generated document back to the original document.
     */
    toOriginal(line: number, character: number): { line: number, character: number } | undefined {
        let mapping: SourceMap | undefined;
        for (let i = this.maps.length - 1; i >= 0; i--) {
            const current = this.maps[i]!;
            if (
                current.generatedLine === line &&
                character >= current.generatedCharacter &&
                character <= current.generatedCharacter + current.length
            ) {
                mapping = current;
                break;
            }
        }

        if (mapping) {
            const offset = character - mapping.generatedCharacter;
            return {
                line: mapping.originalLine,
                character: mapping.originalCharacter + offset
            };
        }

        return undefined;
    }

    /**
     * Maps a position from the original document to the generated document.
     */
    toGenerated(line: number, character: number): { line: number, character: number } | undefined {
        let mapping: SourceMap | undefined;
        for (let i = this.maps.length - 1; i >= 0; i--) {
            const current = this.maps[i]!;
            if (
                current.originalLine === line &&
                character >= current.originalCharacter &&
                character <= current.originalCharacter + current.length
            ) {
                mapping = current;
                break;
            }
        }

        if (mapping) {
            const offset = character - mapping.originalCharacter;
            return {
                line: mapping.generatedLine,
                character: mapping.generatedCharacter + offset
            };
        }

        return undefined;
    }
}
