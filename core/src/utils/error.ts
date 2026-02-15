import type { KireContext, CompiledTemplate } from "../types";

export class KireError extends Error {
    public originalError: Error;
    public template?: CompiledTemplate;

    constructor(message: string | Error, template?: CompiledTemplate) {
        const originalError = message instanceof Error ? message : new Error(message);
        super(originalError.message);

        this.name = "KireError";
        this.originalError = originalError;
        this.template = template;

        const originalStack = originalError.stack || "";
        this.stack = this.formatStack(originalStack);
    }

    private formatStack(stack: string): string {
        const lines = stack.split("\n");
        const messageLine = lines[0] || `${this.name}: ${this.message}`;
        const mappedLines = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]!;
            // Aqui poderíamos adicionar lógica de Source Map se necessário
            mappedLines.push(line);
        }

        return `${messageLine}\n${mappedLines.join("\n")}`;
    }
}

/**
 * Renderiza uma página de erro HTML (apenas em desenvolvimento).
 */
export function renderErrorHtml(e: any, ctx?: KireContext): string {
    const isProduction = ctx?.$kire?.production ?? true;
    if (isProduction) return "INTERNAL SERVER ERROR";

    const error = e instanceof KireError ? e : new KireError(e);
    const stack = (error.stack || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
        <div style="font-family: sans-serif; padding: 20px; background: #fff1f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px;">Kire Render Error</h1>
            <p style="margin: 0 0 20px 0;">${error.message}</p>
            <pre style="background: #ffffff; padding: 15px; border-radius: 4px; overflow: auto; font-size: 14px; border: 1px solid #fecaca;">${stack}</pre>
            ${error.template ? `<p style="font-size: 12px; color: #ef4444;">File: ${error.template.path}</p>` : ""}
        </div>
    `;
}
