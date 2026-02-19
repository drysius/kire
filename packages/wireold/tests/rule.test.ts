import { describe, it, expect } from "bun:test";
import { rule, validateRule } from "../src/core/rule";

describe("Validation Rules", () => {
    describe("String Rules", () => {
        it("validates required string", () => {
            expect(validateRule("hello", "string|required").success).toBe(true);
            expect(validateRule("", "string|required").success).toBe(false);
            expect(validateRule(null, "string|required").success).toBe(false);
        });

        it("validates min length", () => {
            expect(validateRule("abc", "string|min:3").success).toBe(true);
            expect(validateRule("ab", "string|min:3").success).toBe(false);
        });

        it("validates max length", () => {
            expect(validateRule("abc", "string|max:3").success).toBe(true);
            expect(validateRule("abcd", "string|max:3").success).toBe(false);
        });

        it("validates email", () => {
            expect(validateRule("test@example.com", "string|email").success).toBe(true);
            expect(validateRule("invalid-email", "string|email").success).toBe(false);
        });

        it("validates alpha_dash", () => {
            expect(validateRule("user_name-123", "string|alpha_dash").success).toBe(true);
            expect(validateRule("user name", "string|alpha_dash").success).toBe(false);
        });
    });

    describe("Numeric Rules", () => {
        it("validates integer", () => {
            expect(validateRule(123, "integer").success).toBe(true);
            expect(validateRule(12.3, "integer").success).toBe(false);
        });

        it("validates number range", () => {
            expect(validateRule(5, "number|min:5|max:10").success).toBe(true);
            expect(validateRule(10, "number|min:5|max:10").success).toBe(true);
            expect(validateRule(4, "number|min:5|max:10").success).toBe(false);
            expect(validateRule(11, "number|min:5|max:10").success).toBe(false);
        });
    });

    describe("File Rules", () => {
        const mockFile = { name: "test.jpg", size: 1024 * 500, type: "image/jpeg" };

        it("validates file presence", () => {
            expect(validateRule(mockFile, "file").success).toBe(true);
            expect(validateRule(null, "file|required").success).toBe(false);
        });

        it("validates file mimes", () => {
            // Caso de sucesso: JPG permitido
            expect(validateRule(mockFile, "file|mimes:jpg,png").success).toBe(true);
            
            // Caso de falha: TXT não permitido (mudando tipo e nome)
            expect(validateRule({ 
                name: "test.txt", 
                size: 1024, 
                type: "text/plain" 
            }, "file|mimes:jpg,png").success).toBe(false);
        });

        it("validates file size (KB)", () => {
            expect(validateRule(mockFile, "file|size:1024").success).toBe(true); // 500KB < 1024KB
            expect(validateRule(mockFile, "file|size:100").success).toBe(false); // 500KB > 100KB
        });

        it("validates max file count", () => {
            const files = [mockFile, mockFile];
            expect(validateRule(files, "file|max:2").success).toBe(true);
            expect(validateRule(files, "file|max:1").success).toBe(false);
        });
    });

    describe("Nullable/Optional", () => {
        it("allows null when nullable", () => {
            expect(validateRule(null, "string|nullable").success).toBe(true);
            expect(validateRule(undefined, "string|optional").success).toBe(true);
        });
    });
});