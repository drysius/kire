export interface ValidationResult {
    success: boolean;
    error?: string;
}

/**
 * Optimized Rule Engine for Wire.
 */
export const RuleEngine = {
    rules: {
        required: (v: any) => (v !== null && v !== undefined && String(v).trim() !== '') || 'The field is required.',
        email: (v: any) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || 'Invalid email format.',
        numeric: (v: any) => (!v || !isNaN(Number(v))) || 'Must be a numeric value.',
        min: (v: any, p: string) => {
            if (typeof v === 'string') return v.length >= Number(p) || `Minimum ${p} characters required.`;
            if (typeof v === 'number') return v >= Number(p) || `Must be at least ${p}.`;
            return true;
        },
        max: (v: any, p: string) => {
            if (typeof v === 'string') return v.length <= Number(p) || `Maximum ${p} characters allowed.`;
            if (typeof v === 'number') return v <= Number(p) || `Must not exceed ${p}.`;
            return true;
        },
        confirmed: (v: any, p: string, state: any) => v === state[`${p}_confirmation`] || 'Confirmation does not match.'
    } as Record<string, Function>,

    validate(value: any, ruleStr: string, state: any = {}): ValidationResult {
        const parts = ruleStr.split('|');
        for (const r of parts) {
            const [name, param] = r.split(':');
            const handler = this.rules[name];
            if (handler) {
                const result = handler(value, param, state);
                if (typeof result === 'string') return { success: false, error: result };
            }
        }
        return { success: true };
    }
};
