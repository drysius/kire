import type { KireContext, KireFileMeta } from "../types";
import { resolveSourceLocation } from "./source-map";

export class KireError extends Error {
	public originalError: Error;
	public fileMeta?: KireFileMeta;

	constructor(message: string | Error, fileMeta?: KireFileMeta) {
		const originalError =
			message instanceof Error ? message : new Error(message);
		super(originalError.message);

		this.name = "KireError";
		this.originalError = originalError;
		this.fileMeta = fileMeta;

		const originalStack = originalError.stack || "";
		this.stack = this.formatStack(originalStack);
	}

	private formatStack(stack: string): string {
		const lines = stack.split("\n");
		const messageLine = lines[0] || `${this.name}: ${this.message}`;
		const mappedLines = [];

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i]!;
			const mappedLine = this.mapStackLine(line);
			mappedLines.push(mappedLine);
		}

		let finalMessage = messageLine;
		if (finalMessage.startsWith("Error:")) {
			finalMessage = `KireError:${finalMessage.slice(6)}`;
		} else if (!finalMessage.includes("KireError")) {
			finalMessage = `KireError: ${finalMessage}`;
		}

		return `${finalMessage}\n${mappedLines.join("\n")}`;
	}

	private mapStackLine(line: string): string {
		const match = line.match(/^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);

		if (match) {
			const functionName = match[1];
			const filename = match[2]!;
			const genLine = parseInt(match[3]!);
			const genCol = parseInt(match[4]!);

			if (this.fileMeta) {
				const isTemplateFile =
					filename.includes(this.fileMeta.path) ||
					filename.includes("template.kire") ||
					filename.includes("<anonymous>") ||
					filename.includes("eval") ||
					filename.includes("AsyncFunction");

				if (isTemplateFile) {
					if (this.fileMeta.code) {
						const generatedLines = this.fileMeta.code.split("\n");
						const codeGenLine = genLine - 2;

						for (let offset = 0; offset >= -10; offset--) {
							const idx = codeGenLine + offset - 1;
							if (idx >= 0 && idx < generatedLines.length) {
								const gl = generatedLines[idx];
								if (gl && gl.trim().startsWith("// kire-line:")) {
									const sourceLine = parseInt(gl.split(":")[1]!.trim());
									return `    at ${functionName ? `${functionName} ` : ""}(${this.fileMeta.path}:${sourceLine}:${genCol})`;
								}
							}
						}
					}

					if (this.fileMeta.map) {
						const resolved = resolveSourceLocation(this.fileMeta.map, genLine, genCol);
						if (resolved) {
							return `    at ${functionName ? `${functionName} ` : ""}(${resolved.source}:${resolved.line}:${resolved.column})`;
						}
					}
				}
			}
		}
		return line;
	}
}

export function renderErrorHtml(e: any, ctx?: KireContext): string {
	const kire = ctx?.$kire;
	const isProduction = kire?.production ?? true;
	const isChild = ctx?.$file?.children ?? false;
	const errorId = Math.random().toString(36).substring(2, 9);
    const prefix = `kire-err-${errorId}`;
    
	let snippet = "";
	let location = "";
	let astJson = "null";
    let cachedFiles: string[] = [];

	if (ctx && ctx.$file && e.stack) {
		const safePath = ctx.$file.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const match =
			e.stack.match(new RegExp(`${safePath}:(\\d+):(\\d+)`)) ||
			e.stack.match(/kire-generated\.js:(\d+):(\d+)/) ||
			e.stack.match(/eval:(\d+):(\d+)/) ||
			e.stack.match(/<anonymous>:(\d+):(\d+)/);

		if (match) {
			const rawLine = parseInt(match[1]!);
			const genCol = parseInt(match[2]!);
			let sourceLine = -1;

            if (match[0].includes(ctx.$file.path)) {
                sourceLine = rawLine - 1;
            }

			if (sourceLine === -1 && ctx.$file.map) {
				const resolved = resolveSourceLocation(ctx.$file.map, rawLine, genCol);
				if (resolved) sourceLine = resolved.line - 1;
			}

			if (sourceLine === -1 && ctx.$file.code) {
				const lines = ctx.$file.code.split("\n");
				for (let i = rawLine - 1; i >= 0; i--) {
					const line = lines[i];
					if (line?.trim().startsWith("// kire-line:")) {
						sourceLine = parseInt(line.split(":")[1]!.trim()) - 1;
						break;
					}
				}
			}

			if (sourceLine !== -1 && ctx.$file.source) {
				location = `${ctx.$file.path}:${sourceLine + 1}`;
				const sourceLines = ctx.$file.source.split("\n");
				const start = Math.max(0, sourceLine - 5);
				const end = Math.min(sourceLines.length, sourceLine + 6);

				snippet = sourceLines
					.slice(start, end)
					.map((l, i) => {
						const currentLine = start + i + 1;
						const isCurrent = currentLine === sourceLine + 1;
						return `<div class="kire-line ${isCurrent ? "kire-active" : ""}">
                            <span class="kire-ln">${currentLine}</span>
                            <span class="kire-code-text">${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                        </div>`;
					})
					.join("");
			}
		}

		if (!isProduction && kire && ctx.$file.source) {
			try {
				const ast = kire.parse(ctx.$file.source);
				astJson = JSON.stringify(ast, null, 2);
			} catch (_) {}
		}
	}

    if (!isProduction && kire) {
        cachedFiles = Array.from((kire as any).$files?.keys() || []);
    }

	const stack = (e.stack || "")
		.split("\n")
		.filter((l: string) => !l.includes("kire-generated.js") && !l.includes("new AsyncFunction"))
		.map(l => `<div class="kire-stack-line">${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`)
		.join("");

	const styles = `
        :root { 
            --kire-bg: #000000; 
            --kire-card: #111111; 
            --kire-text: #ffffff; 
            --kire-muted: #71717a; 
            --kire-danger: #ef4444; 
            --kire-accent: #38bdf8; 
            --kire-border: #27272a;
        }
        
        .kire-error-root { all: initial; font-family: 'Inter', system-ui, sans-serif; }
        .kire-error-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; min-height: 200px; height: 100%; text-align: center; background: #000; color: #fff; position: relative; }
        .kire-icon-box { width: 60px; height: 60px; color: var(--kire-muted); margin-bottom: 1rem; }
        .kire-icon-box svg { width: 100%; height: 100%; stroke-width: 1.5; }
        .kire-error-title { font-size: 1.25rem; font-weight: 500; color: #a1a1aa; margin: 0; }
        .kire-debug-btn { margin-top: 1.5rem; padding: 0.5rem 1rem; background: #ffffff; color: #000000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s ease; }
        .kire-debug-btn:hover { opacity: 0.9; }

        .kire-modal { display: none; position: fixed; inset: 0; z-index: 99999; background: #000000; padding: 0; overflow-y: auto; color: #ffffff; text-align: left; }
        .kire-modal.kire-open { display: block; animation: kire-slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        .kire-modal-container { max-width: 1200px; margin: 0 auto; min-height: 100%; padding: 4rem 2rem; }
        .kire-modal-header { margin-bottom: 4rem; border-bottom: 1px solid var(--kire-border); padding-bottom: 2.5rem; }
        .kire-err-500 { color: var(--kire-danger); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 1rem; }
        .kire-err-msg { font-size: clamp(1.5rem, 4vw, 2.75rem); font-weight: 800; margin: 0; line-height: 1.1; letter-spacing: -0.03em; }
        .kire-err-loc { margin-top: 2rem; color: var(--kire-accent); font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; opacity: 0.8; }
        
        .kire-modal-body { display: flex; flex-direction: column; gap: 4rem; }
        .kire-section-title { font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; color: var(--kire-muted); display: flex; align-items: center; gap: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .kire-snippet { background: #09090b; border-radius: 12px; padding: 1.5rem 0; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; border: 1px solid var(--kire-border); overflow-x: auto; }
        .kire-line { display: flex; gap: 1.5rem; padding: 0.2rem 2rem; color: #52525b; }
        .kire-line.kire-active { background: #18181b; color: #ffffff; border-left: 4px solid var(--kire-danger); padding-left: calc(2rem - 4px); }
        .kire-ln { width: 40px; text-align: right; user-select: none; opacity: 0.3; }
        .kire-code-text { white-space: pre; }

        .kire-grid-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 3rem; }
        .kire-data-box { background: #09090b; border-radius: 12px; padding: 1.5rem; border: 1px solid var(--kire-border); max-height: 400px; overflow-y: auto; }
        .kire-pre { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #d4d4d8; line-height: 1.6; }
        
        .kire-stack-trace { background: #09090b; border-radius: 12px; padding: 1.5rem; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; line-height: 1.8; color: #a1a1aa; border: 1px solid var(--kire-border); }
        .kire-stack-line { padding: 0.4rem 0; border-bottom: 1px solid #18181b; }
        .kire-stack-line:last-child { border: none; }

        @keyframes kire-slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .kire-close-modal { position: fixed; top: 2rem; right: 2rem; background: #ffffff; color: #000000; border: none; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 100000; }
        .kire-close-modal:hover { transform: scale(1.1) rotate(90deg); }
	`;

	const content = `
    <div class="kire-error-root" id="${prefix}">
        <style>${styles}</style>
        <div class="kire-error-wrapper">
            <div class="kire-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
            <h1 class="kire-error-title">Internal Server Error</h1>
            ${!isProduction ? `<button class="kire-debug-btn" onclick="document.getElementById('${prefix}-modal').classList.add('kire-open'); document.body.style.overflow='hidden'">Analyze Debug Data</button>` : ""}
        </div>

        ${!isProduction ? `
        <div id="${prefix}-modal" class="kire-modal">
            <button class="kire-close-modal" onclick="document.getElementById('${prefix}-modal').classList.remove('kire-open'); document.body.style.overflow='auto'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="kire-modal-container">
                <div class="kire-modal-header">
                    <div class="kire-err-500">Error 500</div>
                    <h2 class="kire-err-msg">${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
                    <div class="kire-err-loc">Detected at ${location || "unknown location"}</div>
                </div>
                <div class="kire-modal-body">
                    ${snippet ? `
                    <div class="kire-section">
                        <div class="kire-section-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path></svg>
                            Source Context
                        </div>
                        <div class="kire-snippet">${snippet}</div>
                    </div>
                    ` : ""}

                    <div class="kire-grid-info">
                        <div class="kire-section">
                            <div class="kire-section-title">Execution AST</div>
                            <div class="kire-data-box">
                                <pre class="kire-pre">${astJson.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                            </div>
                        </div>
                        <div class="kire-section">
                            <div class="kire-section-title">Instance Cache (${cachedFiles.length})</div>
                            <div class="kire-data-box">
                                <pre class="kire-pre">${cachedFiles.length > 0 ? cachedFiles.join("\n") : "Cache is empty"}</pre>
                            </div>
                        </div>
                    </div>
                    
                    <div class="kire-section">
                        <div class="kire-section-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M4 12h16M4 18h7"></path></svg>
                            Stack Trace
                        </div>
                        <div class="kire-stack-trace">${stack}</div>
                    </div>
                </div>
            </div>
        </div>
        ` : ""}
    </div>`;

	if (isChild) {
		return content;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kire - ${isProduction ? "Error" : "Internal Server Error"}</title>
</head>
<body style="margin:0; padding:0; background:#000;">
    ${content}
</body>
</html>`;
}
