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

    if (isProduction) {
        return "INTERNAL SERVER ERROR";
    }

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

		if (kire && ctx.$file.source) {
			try {
				const ast = kire.parse(ctx.$file.source);
				astJson = JSON.stringify(ast, null, 2);
			} catch (_) {}
		}
	}

    if (kire) {
        cachedFiles = Array.from((kire as any).$files?.keys() || []);
    }

	const stack = (e.stack || "")
		.split("\n")
		.filter((l: string) => !l.includes("kire-generated.js") && !l.includes("new AsyncFunction"))
		.map(l => `<div class="kire-stack-line">${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`)
		.join("");

	const styles = `
        :root { 
            --kire-bg: #09090b; 
            --kire-card: #111111; 
            --kire-text: #ffffff; 
            --kire-muted: #71717a; 
            --kire-danger: #ef4444; 
            --kire-accent: #38bdf8; 
            --kire-border: #27272a;
            --kire-code-bg: #000000;
        }
        
        .kire-error-root { font-family: 'Inter', system-ui, sans-serif; background: var(--kire-bg); color: var(--kire-text); min-height: 100vh; padding: 2rem; }
        .kire-container { max-width: 1400px; margin: 0 auto; }
        
        .kire-tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--kire-border); margin-bottom: 2rem; }
        .kire-tab { padding: 0.75rem 1.5rem; cursor: pointer; border-bottom: 2px solid transparent; color: var(--kire-muted); font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
        .kire-tab.active { border-color: var(--kire-accent); color: var(--kire-text); }
        
        .kire-tab-content { display: none; }
        .kire-tab-content.active { display: block; animation: kire-fadeIn 0.3s ease; }

        .kire-header { margin-bottom: 2rem; }
        .kire-err-500 { color: var(--kire-danger); font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
        .kire-err-msg { font-size: 1.75rem; font-weight: 800; margin: 0; line-height: 1.2; letter-spacing: -0.02em; }
        .kire-err-loc { margin-top: 1rem; color: var(--kire-accent); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; opacity: 0.8; }
        
        .kire-section { margin-bottom: 3rem; }
        .kire-section-title { font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem; color: var(--kire-muted); display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .kire-snippet { background: var(--kire-code-bg); border-radius: 8px; padding: 1rem 0; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; border: 1px solid var(--kire-border); overflow-x: auto; }
        .kire-line { display: flex; gap: 1rem; padding: 0.15rem 1.5rem; color: #52525b; }
        .kire-line.kire-active { background: #18181b; color: #ffffff; border-left: 3px solid var(--kire-danger); padding-left: calc(1.5rem - 3px); }
        .kire-ln { width: 30px; text-align: right; user-select: none; opacity: 0.3; }
        .kire-code-text { white-space: pre; }

        .kire-advanced-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; height: calc(100vh - 250px); }
        .kire-scroll-box { background: var(--kire-code-bg); border-radius: 8px; border: 1px solid var(--kire-border); overflow: auto; padding: 1rem; }
        .kire-pre { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #d4d4d8; line-height: 1.5; }
        
        .kire-stack-trace { background: var(--kire-code-bg); border-radius: 8px; padding: 1rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; line-height: 1.6; color: #a1a1aa; border: 1px solid var(--kire-border); }
        .kire-stack-line { padding: 0.3rem 0; border-bottom: 1px solid #18181b; }
        .kire-stack-line:last-child { border: none; }

        .kire-file-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .kire-file-tag { padding: 0.25rem 0.75rem; background: var(--kire-card); border: 1px solid var(--kire-border); border-radius: 4px; font-size: 0.75rem; color: var(--kire-muted); }

        @keyframes kire-fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
	`;

	const content = `
    <div class="kire-error-root" id="${prefix}">
        <style>${styles}</style>
        <div class="kire-container">
            <div class="kire-tabs">
                <div class="kire-tab active" onclick="kireToggleTab('${prefix}', 'general')">General</div>
                <div class="kire-tab" onclick="kireToggleTab('${prefix}', 'advanced')">Advanced Debug</div>
            </div>

            <div id="${prefix}-general" class="kire-tab-content active">
                <div class="kire-header">
                    <div class="kire-err-500">Error 500</div>
                    <h2 class="kire-err-msg">${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
                    <div class="kire-err-loc">Detected at ${location || "unknown location"}</div>
                </div>

                ${snippet ? `
                <div class="kire-section">
                    <div class="kire-section-title">Source Context</div>
                    <div class="kire-snippet">${snippet}</div>
                </div>
                ` : ""}

                <div class="kire-section">
                    <div class="kire-section-title">Stack Trace</div>
                    <div class="kire-stack-trace">${stack}</div>
                </div>

                <div class="kire-section">
                    <div class="kire-section-title">Cached Files (${cachedFiles.length})</div>
                    <div class="kire-file-list">
                        ${cachedFiles.map(f => `<span class="kire-file-tag">${f}</span>`).join("")}
                    </div>
                </div>
            </div>

            <div id="${prefix}-advanced" class="kire-tab-content">
                <div class="kire-advanced-grid">
                    <div class="kire-section">
                        <div class="kire-section-title">Execution AST</div>
                        <div class="kire-scroll-box">
                            <pre class="kire-pre">${astJson.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                        </div>
                    </div>
                    <div class="kire-section">
                        <div class="kire-section-title">Generated JS Code</div>
                        <div class="kire-scroll-box">
                            <pre class="kire-pre">${(ctx?.$file?.code || "// No code available").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            function kireToggleTab(prefix, tab) {
                const root = document.getElementById(prefix);
                root.querySelectorAll('.kire-tab').forEach(t => t.classList.remove('active'));
                root.querySelectorAll('.kire-tab-content').forEach(c => c.classList.remove('active'));
                
                event.currentTarget.classList.add('active');
                document.getElementById(prefix + '-' + tab).classList.add('active');
            }
        </script>
    </div>`;

	if (isChild) {
		return content;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kire - Internal Server Error</title>
</head>
<body style="margin:0; padding:0; background:#09090b;">
    ${content}
</body>
</html>`;
}