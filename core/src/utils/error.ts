import type { Kire } from "../kire";
import type { KireTplFunction } from "../types";
import { resolveSourceLocation } from "./source-map";

export class KireError extends Error {
	public originalError: Error;
	public template?: KireTplFunction['meta'];

	constructor(message: string | Error, template?: KireTplFunction | KireTplFunction['meta']) {
		const originalError = message instanceof Error ? message : new Error(message);
		super(originalError.message);
		this.name = "KireError";
		this.originalError = originalError;
		// Handle KireTplFunction or direct meta object
		this.template = template && 'meta' in template ? template.meta : template;
		this.stack = this.formatStack(originalError.stack || "");
	}

    /**
     * Lazy-loads/parses the source map from the code if not already available.
     */
    private getMap() {
        if (!this.template) return null;
        if (this.template.map) return this.template.map;
        
        // Try to extract from code
        if (this.template.code) {
            // Match typical source mapping URL
            const mapUrlIndex = this.template.code.lastIndexOf('//# sourceMappingURL=data:application/json;charset=utf-8;base64,');
            if (mapUrlIndex !== -1) {
                try {
                    const base64 = this.template.code.slice(mapUrlIndex + 64).trim();
                    this.template.map = JSON.parse(Buffer.from(base64, 'base64').toString());
                    return this.template.map;
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
        return null;
    }

	private formatStack(stack: string): string {
		const lines = stack.split("\n");
		const messageLine = lines[0] || `${this.name}: ${this.message}`;
		const mappedLines = [];
		for (let i = 1; i < lines.length; i++) {
			mappedLines.push(this.mapStackLine(lines[i]!));
		}
		let finalMessage = messageLine;
		if (finalMessage.startsWith("Error:")) finalMessage = `KireError:${finalMessage.slice(6)}`;
		else if (!finalMessage.includes("KireError")) finalMessage = `KireError: ${finalMessage}`;
		return `${finalMessage}\n${mappedLines.join("\n")}`;
	}

	private mapStackLine(line: string): string {
		const match = line.match(/^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
		if (match && this.template) {
			const [_, fn, file, l, c] = match;
			const filename = file!.replace(/\\/g, '/');
            const genLine = parseInt(l!), genCol = parseInt(c!);
            // Check if error matches template path or internal names
            if (filename.includes(this.template.path.replace(/\\/g, '/')) || filename.includes("template.kire") || /anonymous|eval|AsyncFunction/.test(filename)) {
                
                // Strategy 1: Use explicit line comments in code (// kire-line: X)
                if (this.template.code) {
                    const generatedLines = this.template.code.split("\n");
                    // Search backwards from the error line for the source mapping comment
                    for (let i = genLine - 1; i >= Math.max(0, genLine - 15); i--) {
                        const gl = generatedLines[i];
                        if (gl?.trim().startsWith("// kire-line:")) {
                            return `    at ${fn ? `${fn} ` : ""}(${this.template.path}:${gl.split(":")[1]!.trim()}:${genCol})`;
                        }
                    }
                }

                // Strategy 2: Use Source Map
                const map = this.getMap();
                if (map) {
                    const resolved = resolveSourceLocation(map, genLine, genCol);
                    if (resolved) return `    at ${fn ? `${fn} ` : ""}(${resolved.source}:${resolved.line}:${resolved.column})`;
                }
            }
		}
		return line;
	}
}

export function renderErrorHtml(e: any, kire?: Kire<any>, ctx?: any): string {
	const isProduction = kire?.production ?? false;
    if (isProduction) return `<html><body style="background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><h1 style="font-size:1.5rem;margin-top:1rem;letter-spacing:0.05em">INTERNAL SERVER ERROR</h1></body></html>`;

    // Support KireError or generic Error with context
    // ctx is now arbitrary locals, it might not have $template info unless we attached it.
    // If e is KireError, it has template.
    const template = (e instanceof KireError && e.template) || (ctx?.$template ? ctx.$template.meta : undefined);
	let snippet = "", location = "", astJson = "null";
    
	if (template && e.stack) {
        // ... (Similar logic to extract location for HTML display)
		const safePath = template.path.replace(/\\/g, '/').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const match = e.stack.match(new RegExp(`${safePath}:(\\d+):(\\d+)`)) || e.stack.match(/template\.kire:(\d+):(\d+)/) || e.stack.match(/(?:eval|anonymous):(\d+):(\d+)/);
		
        if (match) {
			const rawLine = parseInt(match[1]!), genCol = parseInt(match[2]!);
			let sourceLine = -1;
            
            // Try to match source line from path match
            if (match[0].includes(template.path.replace(/\\/g, '/'))) sourceLine = rawLine - 1;
			
            // Try Source Map
            if (sourceLine === -1) {
                let map = template.map;
                if (!map && template.code) {
                     const mapUrlIndex = template.code.lastIndexOf('//# sourceMappingURL=data:application/json;charset=utf-8;base64,');
                     if (mapUrlIndex !== -1) try { 
                         const base64 = template.code.slice(mapUrlIndex + 64).trim();
                         map = JSON.parse(Buffer.from(base64, 'base64').toString()); 
                     } catch(_){}
                }

                if (map) {
				    const res = resolveSourceLocation(map, rawLine, genCol);
				    if (res) sourceLine = res.line - 1;
                }
			}

            // Try comments
			if (sourceLine === -1 && template.code) {
				const lines = template.code.split("\n");
				for (let i = rawLine - 1; i >= 0; i--) {
					if (lines[i]?.trim().startsWith("// kire-line:")) {
						sourceLine = parseInt(lines[i]!.split(":")[1]!.trim()) - 1;
						break;
					}
				}
			}

			if (sourceLine !== -1 && template.source) {
				location = `${template.path}:${sourceLine + 1}`;
				const sourceLines = template.source.split("\n");
				const start = Math.max(0, sourceLine - 5), end = Math.min(sourceLines.length, sourceLine + 6);
				snippet = sourceLines.slice(start, end).map((l, i) => {
					const cur = start + i + 1;
					return `<div class="line ${cur === sourceLine + 1 ? "active" : ""}"><span>${cur}</span><pre>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>`;
				}).join("");
			}
		}
		if (kire && template.source) try { astJson = JSON.stringify(kire.parse(template.source), null, 2); } catch (_) {}
	}
	const stack = (e.stack || "").split("\n").filter((l: string) => !l.includes("new AsyncFunction")).map((l: string) => `<div>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`).join("");

    // HTML Template ...
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Kire Error</title><style>
        :root { --bg: #000; --card: #09090b; --text: #fff; --muted: #71717a; --danger: #ef4444; --accent: #38bdf8; --border: #27272a; }
        body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 4rem 2rem; line-height: 1.5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { border-bottom: 1px solid var(--border); padding-bottom: 2rem; margin-bottom: 3rem; }
        .err-code { color: var(--danger); font-weight: 700; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; }
        .err-msg { font-size: 2.25rem; font-weight: 800; margin: .5rem 0; letter-spacing: -0.02em; }
        .err-loc { color: var(--accent); font-family: monospace; font-size: .9rem; }
        .section { margin-bottom: 3rem; }
        .section-title { font-size: .75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 1rem; }
        .snippet { background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; font-family: monospace; font-size: .85rem; }
        .line { display: flex; gap: 1rem; padding: 0 1rem; color: #52525b; }
        .line.active { background: #18181b; color: #fff; border-left: 3px solid var(--danger); padding-left: calc(1rem - 3px); }
        .line span { width: 30px; text-align: right; opacity: .3; user-select: none; padding: .2rem 0; }
        .line pre { margin: 0; padding: .2rem 0; white-space: pre-wrap; }
        .box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; max-height: 300px; overflow: auto; font-size: .75rem; color: #d4d4d8; margin-bottom: 2rem; }
        .stack { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: .8rem; color: #a1a1aa; white-space: pre-wrap; }
        .stack div { padding: .2rem 0; border-bottom: 1px solid #18181b; }
        details summary { cursor: pointer; color: var(--muted); font-size: .75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 1rem; outline: none; }
        details summary:hover { color: var(--text); }
    </style></head><body><div class="container">
        <div class="header">
            <div class="err-code">Error 500</div>
            <h1 class="err-msg">${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
            <div class="err-loc">Detected at ${location || "unknown location"}</div>
        </div>
        ${snippet ? `<div class="section"><div class="section-title">Source Context</div><div class="snippet">${snippet}</div></div>` : ""}
        <details><summary>View Execution AST</summary><div class="box"><pre style="margin:0">${astJson.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div></details>
        <div class="section"><div class="section-title">Stack Trace</div><div class="stack">${stack}</div></div>
    </div></body></html>`;
}
