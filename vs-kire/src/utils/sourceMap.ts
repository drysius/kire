
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
        // Find the mapping that covers this position
        const mapping = this.maps.find(m => 
            m.generatedLine === line && 
            character >= m.generatedCharacter && 
            character <= m.generatedCharacter + m.length
        );

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
        const mapping = this.maps.find(m => 
            m.originalLine === line && 
            character >= m.originalCharacter && 
            character <= m.originalCharacter + m.length
        );

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
