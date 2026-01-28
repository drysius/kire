/**
 * Simple container for error messages, mimicking Laravel's MessageBag.
 */
export class MessageBag {
    constructor(private messages: Record<string, string[]> = {}) {}

    /**
     * Get the first error message for a given key.
     */
    first(key: string, format?: string): string {
        const msgs = this.get(key);
        return msgs.length > 0 ? (format ? format.replace(':message', msgs[0]!) : msgs[0]!) : '';
    }

    /**
     * Get all error messages for a given key.
     */
    get(key: string): string[] {
        if (this.messages[key]) {
            return this.messages[key]!;
        }
        // Handle dot notation if needed or just return empty
        return [];
    }
    
    /**
     * Get all error messages.
     */
    all(): string[] {
        return Object.values(this.messages).flat();
    }
    
    /**
     * Determine if messages exist for a given key.
     */
    has(key: string): boolean {
        return this.get(key).length > 0;
    }
    
    any(): boolean {
        return Object.keys(this.messages).length > 0;
    }
}
