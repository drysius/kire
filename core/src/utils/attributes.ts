import { NullProtoObj } from "./regex";

export class Attributes {
    private attributes: Record<string, any>;

    constructor(attributes: Record<string, any> = new NullProtoObj()) {
        this.attributes = attributes;
    }

    /**
     * Get a specific attribute value.
     */
    public get(key: string, defaultValue?: any): any {
        return this.attributes[key] ?? defaultValue;
    }

    /**
     * Check if an attribute exists.
     */
    public has(key: string): boolean {
        return key in this.attributes;
    }

    /**
     * Merge new attributes with existing ones.
     * Special handling for 'class' and 'style' to append instead of overwrite.
     */
    public merge(newAttributes: Record<string, any>): Attributes {
        const merged = { ...this.attributes };

        for (const [key, value] of Object.entries(newAttributes)) {
            if (key === 'class') {
                const prev = merged[key] || '';
                const next = value || '';
                merged[key] = `${prev} ${next}`.trim();
            } else if (key === 'style') {
                const prev = merged[key] || '';
                const next = value || '';
                const sep = prev && !prev.trim().endsWith(';') ? ';' : '';
                merged[key] = `${prev}${sep}${next}`;
            } else {
                merged[key] = value;
            }
        }
        
        // Return a new instance to avoid mutating the original if desired, 
        // or mutate this one. Immutability is usually safer for render chains.
        return new Attributes(merged);
    }

    /**
     * Output all attributes as a HTML string key="value".
     * Automatically excludes internal properties or those starting with _.
     */
    public toString(): string {
        return Object.entries(this.attributes)
            .filter(([key]) => !key.startsWith('_') && key !== 'slots')
            .map(([key, value]) => {
                if (value === true) return key;
                if (value === false || value === null || value === undefined) return '';
                return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
            })
            .filter(Boolean)
            .join(' ');
    }

    /**
     * Return the raw object.
     */
    public toObject(): Record<string, any> {
        return this.attributes;
    }
}
