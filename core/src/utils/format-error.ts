import type { KireContext } from "src/types";

/**
 * Formats a runtime error with source code context and visual markers.
 * Attempts to map the error from the generated JavaScript back to the original Kire template line.
 */
export const formatKireError = (
    e: any,
    $ctx:KireContext
) => {
    const root = (typeof process !== "undefined" ? process.cwd() : "").replace(/\\/g, "/"); // Normalize root
    let displayPath = $ctx.$file.path ? $ctx.$file.path.replace(/\\/g, "/") : "<anonymous>";

    // Make path relative
    if ($ctx.$file.path && displayPath.startsWith(root)) {
        displayPath = displayPath.slice(root.length + 1);
    }

    let loc = "";
    let contextSnippet = "";

    if (e.stack && e.kireGeneratedCode) {
        const lines = e.kireGeneratedCode.split("\n");
        // Attempt to extract line number from stack
        const match = e.stack.match(/kire-generated\.js:(\d+):(\d+)/);
        if (match) {
            const genLineNo = parseInt(match[1], 10) - 1;

            if (lines[genLineNo]) {
                let sourceLineNo = -1;

                // Scan backwards for source mapping comment
                for (let i = genLineNo; i >= 0; i--) {
                    const line = lines[i];
                    const mapMatch = line.match(/\/\/ kire-line: (\d+)/);
                    if (mapMatch) {
                        sourceLineNo = parseInt(mapMatch[1], 10) - 1; // 0-based index
                        break;
                    }
                }

                if (sourceLineNo !== -1 && $ctx.$file.code) {
                    // Show source code context
                    const sourceLines = $ctx.$file.code.split("\n");
                    loc = `:${sourceLineNo + 1}:1`; // Approximate column

                    const start = Math.max(0, sourceLineNo - 3);
                    const end = Math.min(sourceLines.length, sourceLineNo + 4);

                    for (let i = start; i < end; i++) {
                        const isErrorLine = i === sourceLineNo;
                        const gutter = `${`${i + 1}`.padStart(4, " ")} | `;
                        contextSnippet += `${gutter}${sourceLines[i]}\n`;
                        if (isErrorLine) {
                            contextSnippet += "     | ^\n";
                        }
                    }
                } else {
                    // Fallback to generated code context
                    const colNo = parseInt(match[2], 10);
                    loc = `:${genLineNo + 1}:${colNo} (generated)`;

                    const start = Math.max(0, genLineNo - 3);
                    const end = Math.min(lines.length, genLineNo + 4);

                    for (let i = start; i < end; i++) {
                        const isErrorLine = i === genLineNo;
                        const gutter = `${`${i + 1}`.padStart(4, " ")} | `;
                        contextSnippet += `${gutter}${lines[i]}\n`;
                        if (isErrorLine) {
                            contextSnippet += `     | ${"^".padStart(colNo, " ")}\n`;
                        }
                    }
                }
            }
        }
    }

    const message = `
-------------------------------------
Kire Error: ${e.message}
-------------------------------------
${displayPath}${loc}

${contextSnippet}
-------------------------------------
trace:
${e.stack ? e.stack.split("\n").slice(0, 3).join("\n") : 'no stack trace'}
-------------------------------------
`;
    e.message = message + e.message;
    console.error(message);
}