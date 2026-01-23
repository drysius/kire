/**
 * Simplified parameter parser with enhanced pattern matching
 */
export interface ParamDefinition {
    name: string;
    rawDefinition: string;
    validate: (value: any) => ValidationResult;
}
export interface ValidationResult {
    valid: boolean;
    extracted?: Record<string, any>;
    error?: string;
}
type TypeChecker = (value: any) => boolean;
/**
 * Registry for custom validators
 */
export declare const validators: {
    register(type: string, validator: TypeChecker): void;
    list(): string[];
};
/**
 * Check if definition is a pattern
 */
export declare function isPatternDefinition(def: string): boolean;
/**
 * Parse parameter definition
 */
export declare function parseParamDefinition(def: string): ParamDefinition;
export {};
