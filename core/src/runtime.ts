import type { Kire } from "./kire";

/**
 * Executes the compiled template function within a prepared runtime context.
 *
 * Execution Flow:
 * 1. Initialize context with globals and locals.
 * 2. Run directive `onInit` hooks.
 * 3. Execute `mainFn` (the compiled template). This populates `~res` and collects `~$pre`/`~$pos` hooks.
 * 4. Execute `~$pre` hooks (deferred logic that runs immediately after main render).
 * 5. Execute `~$pos` hooks (final post-processing).
 * 6. Process custom elements (if not in a child block).
 *
 * @param kire The Kire instance.
 * @param mainFn The compiled async function of the template.
 * @param locals Local variables passed to the template.
 * @param children Whether this runtime is executing a child block (nested).
 * @returns The final rendered HTML string.
 */
export async function kireRuntime(
	kire: Kire,
	mainFn: Function,
	locals: Record<string, any>,
	children = false,
) {
	const rctx: any = { kire };
	for (const [k, v] of kire.$globals) {
		rctx[k] = v;
	}
	for (const [k, v] of kire.$app_globals) {
		rctx[k] = v;
	}
	Object.assign(rctx, locals);

	if (kire.$expose_locals) {
		rctx[kire.$var_locals] = locals;
	}

	rctx["~res"] = "";
	rctx["~$pre"] = [];
	rctx["~$pos"] = [];

	rctx.res = function (this: any, str: any) {
		rctx["~res"] += str;
	};

	rctx.$res = () => rctx["~res"];

	rctx.$resolve = (path: string) => {
		return kire.resolvePath(path);
	};

	rctx.$merge = async (func: Function) => {
		const parentRes = rctx["~res"];
		rctx["~res"] = "";
		await func(rctx);
		rctx["~res"] = parentRes + rctx["~res"];
	};

	// Execute onInit for all directives
	if (kire.$directives.size > 0) {
		for (const directive of kire.$directives.values()) {
			if (directive.onInit) {
				await directive.onInit(rctx);
			}
		}
	}

	let finalCtx: any;
	try {
		finalCtx = await mainFn(rctx);
	} catch (e: any) {
		const generatedCode = (mainFn as any)._code;
		const sourceCode = (mainFn as any)._source;
		if (generatedCode) {
			e.kireGeneratedCode = generatedCode;
			formatKireError(e, kire, (mainFn as any)._path, sourceCode);
			e.toString = () => e.message;
		}
		throw e;
	}
	finalCtx.$typed = (key: string) => finalCtx[key];

	// Execute ~$pre functions collected during execution
	if (finalCtx["~$pre"] && finalCtx["~$pre"].length > 0) {
		for (const preFn of finalCtx["~$pre"]) {
			await preFn(finalCtx);
		}
	}

	let resultHtml = finalCtx["~res"];

	// Execute ~$pos functions (deferred logic)
	if (finalCtx["~$pos"] && finalCtx["~$pos"].length > 0) {
		for (const posFn of finalCtx["~$pos"]) {
			await posFn(finalCtx);
		}
		resultHtml = finalCtx["~res"];
	}

	if (kire.$elements.size > 0) {
		resultHtml = await processElements(kire, resultHtml, finalCtx);
	}

	return resultHtml;
}

/**
 * Formats a runtime error with source code context and visual markers.
 * Attempts to map the error from the generated JavaScript back to the original Kire template line.
 *
 * @param e The error object.
 * @param kire The Kire instance.
 * @param filePath Optional path to the template file.
 * @param sourceCode Optional original template source code.
 */
function formatKireError(
	e: any,
	_kire: Kire,
	filePath?: string,
	sourceCode?: string,
) {
	const root = process.cwd().replace(/\\/g, "/"); // Normalize root
	let displayPath = filePath ? filePath.replace(/\\/g, "/") : "<anonymous>";

	// Make path relative
	if (filePath && displayPath.startsWith(root)) {
		displayPath = displayPath.slice(root.length + 1);
	}

	let loc = "";
	let contextSnippet = "";

	if (e.stack && e.kireGeneratedCode) {
		const lines = e.kireGeneratedCode.split("\n");
		// Attempt to extract line number from stack
		// Matches: kire-generated.js:6:49
		const match = e.stack.match(/kire-generated\.js:(\d+):(\d+)/);
		if (match) {
			const genLineNo = parseInt(match[1], 10) - 2; // Adjust for "with($ctx) {" wrapper usually

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

				if (sourceLineNo !== -1 && sourceCode) {
					// Show source code context
					const sourceLines = sourceCode.split("\n");
					loc = `:${sourceLineNo + 1}:1`; // Approximate column

					const start = Math.max(0, sourceLineNo - 3);
					const end = Math.min(sourceLines.length, sourceLineNo + 4);

					for (let i = start; i < end; i++) {
						const isErrorLine = i === sourceLineNo;
						const gutter = `${`${i + 1}`.padStart(4, " ")} | `;
						contextSnippet += `${gutter}${sourceLines[i]}\n`;
						if (isErrorLine) {
							// We don't have exact column mapping, so just point to the line start
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
${e.stack.split("\n").slice(0, 3).join("\n")}
-------------------------------------
`;
	e.message = message + e.message;
	console.error(message);
}

/**
 * Processes custom elements (components/tags) in the rendered HTML.
 * Uses an offset-based replacement strategy to safely handle multiple identical elements.
 *
 * @param kire The Kire instance.
 * @param html The current HTML string.
 * @param ctx The runtime context.
 * @returns The HTML string with elements processed.
 */
async function processElements(kire: Kire, html: string, ctx: any) {
	let resultHtml = html;
	for (const def of kire.$elements) {
		const tagName = def.name instanceof RegExp ? def.name.source : def.name;

		const isVoid =
			def.void ||
			(typeof def.name === "string" &&
				/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(
					def.name,
				));

		const regex = isVoid
			? new RegExp(`<(${tagName})([^>]*)>`, "gi")
			: new RegExp(`<(${tagName})([^>]*)(\/>|>(?:([^]*?))<\\/\\1>)`, "gi");

		const matches = [];
		let match: RegExpExecArray | null;
		while ((match = regex.exec(resultHtml)) !== null) {
			matches.push({
				full: match[0],
				tagName: match[1],
				attrs: match[2],
				inner: isVoid ? "" : (match[4] ?? ""),
				index: match.index,
			});
		}

		let offset = 0;
		for (const m of matches) {
			const currentStart = m.index + offset;
			const currentEnd = currentStart + m.full.length;

			const attributes: Record<string, string> = {};
			const attrRegex = /([a-zA-Z0-9_-]+)(?:="([^"]*)")?/g;
			let attrMatch: RegExpExecArray | null;
			while ((attrMatch = attrRegex.exec(m.attrs!)) !== null) {
				attributes[attrMatch[1]!] = attrMatch[2] ?? "";
			}

			const elCtx: any = Object.create(ctx);
			elCtx.content = resultHtml;
			elCtx.element = {
				tagName: m.tagName,
				attributes,
				inner: m.inner,
				outer: m.full,
			};

			let isModified = false;
			elCtx.update = (newContent: string) => {
				resultHtml = newContent;
				elCtx.content = newContent;
			};

			elCtx.replace = (replacement: string) => {
				const pre = resultHtml.slice(0, currentStart);
				const pos = resultHtml.slice(currentEnd);
				resultHtml = pre + replacement + pos;
				elCtx.content = resultHtml;
				offset += replacement.length - m.full.length;
				isModified = true;
			};

			elCtx.replaceElement = (replacement: string) => {
				elCtx.replace(replacement);
			};

			elCtx.replaceContent = (replacement: string) => {
				if (!isVoid) {
					const newOuter = m.full.replace(m.inner!, replacement);
					elCtx.replace(newOuter);
				}
			};

			await def.onCall(elCtx);

			if (!isModified && elCtx.content !== resultHtml) {
				resultHtml = elCtx.content;
			}
		}
	}
	return resultHtml;
}
