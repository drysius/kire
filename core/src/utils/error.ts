import type { KireFileMeta } from "../types";
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

		// Preserve original stack but map it
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

		// Use the original message line but ensure it starts with KireError if appropriate
		let finalMessage = messageLine;
		if (finalMessage.startsWith("Error:")) {
			finalMessage = `KireError:${finalMessage.slice(6)}`;
		} else if (!finalMessage.includes("KireError")) {
			finalMessage = `KireError: ${finalMessage}`;
		}

		return `${finalMessage}\n${mappedLines.join("\n")}`;
	}

	private mapStackLine(line: string): string {
		// regex for: at functionName (filename:line:col) OR at filename:line:col
		// Supports [eval], <anonymous>, etc.
		const match = line.match(/^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);

		if (match) {
			const functionName = match[1];
			const filename = match[2]!;
			const genLine = parseInt(match[3]!);
			const genCol = parseInt(match[4]!);

			if (this.fileMeta) {
                const isTemplateFile = filename.includes(this.fileMeta.path) || 
                                     filename.includes("template.kire") || 
                                     filename.includes("<anonymous>") || 
                                     filename.includes("eval") ||
                                     filename.includes("AsyncFunction");

				if (isTemplateFile) {
                    // 1. Try Fallback to kire-line comments first (more precise for multiline JS blocks)
                    if (this.fileMeta.code) {
                        const generatedLines = this.fileMeta.code.split("\n");
                        
                        // AsyncFunction wrapper adds 2 lines of offset (function header).
                        // We need to look at the line in the code string, not the function body line.
                        const codeGenLine = genLine - 2;

                        for (let offset = 0; offset >= -10; offset--) {
                            const idx = codeGenLine + offset - 1;
                            if (idx >= 0 && idx < generatedLines.length) {
                                const gl = generatedLines[idx];
                                if (gl && gl.trim().startsWith("// kire-line:")) {
                                    const sourceLine = parseInt(gl.split(":")[1]!.trim());
                                    // Since we now map line-by-line in the compiler, the comment 
                                    // immediately preceding the code block (or line) contains the exact source line.
                                    // We trust this value directly.
                                    const finalLine = sourceLine;
                                    
                                    return `    at ${functionName ? functionName + " " : ""}(${this.fileMeta.path}:${finalLine}:${genCol})`;
                                }
                            }
                        }
                    }

					// 2. Try Source Map
					if (this.fileMeta.map) {
						const resolved = resolveSourceLocation(
							this.fileMeta.map,
							genLine,
							genCol,
						);

						if (resolved) {
							return `    at ${functionName ? functionName + " " : ""}(${resolved.source}:${resolved.line}:${resolved.column})`;
						}
                    }
				}
			}
		}

		return line;
	}
}
