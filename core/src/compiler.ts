import type { Kire } from "./kire";
import type { CompilerContext, DirectiveDefinition, Node } from "./types";
import { parseParamDefinition } from "./utils/params";
import { SourceMapGenerator } from "./utils/source-map";

export class Compiler {
	private preBuffer: string[] = [];
	private resBuffer: string[] = [];
	private posBuffer: string[] = [];
	private usedDirectives: Set<string> = new Set();
	private generator: SourceMapGenerator;
	private resMappings: { index: number; node: Node; col: number }[] = [];
	private counters: Record<string, number> = {};

	constructor(
		private kire: Kire,
		private filename = "template.kire",
	) {
		this.generator = new SourceMapGenerator(filename);
		this.generator.addSource(filename);
	}

	/**
	 * Compiles a list of AST nodes into a JavaScript function body string.
	 * @param nodes The root nodes of the AST.
	 * @returns The compiled JavaScript code as a string.
	 */
	public async compile(nodes: Node[]): Promise<string> {
		this.preBuffer = [];
		this.resBuffer = [];
		this.posBuffer = [];
		this.resMappings = [];
		this.usedDirectives.clear();
		this.counters = {};

		// 2. Define Locals Alias (default 'it')
		const varLocals = this.kire.$var_locals || "it";

		await this.compileNodes(nodes);

		const pre = this.preBuffer.join("\n");
		const res = this.resBuffer.join("\n");
		const pos = this.posBuffer.join("\n");

		// Filter keys to ensure they are valid JS identifiers
		const sanitizedKeys = Array.from(this.kire.$globals.keys()).filter((key) =>
			/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key),
		);
		const destructuring =
			sanitizedKeys.length > 0
				? `var { ${sanitizedKeys.join(", ")} } = $ctx.$globals;`
				: "";

		const startCode = `
${destructuring}
let ${varLocals} = $ctx.$props;
${pre}
`;
		const startCodeLines = startCode.split("\n");
        let currentGenLine = startCodeLines.length;

		if (!this.kire.production) {
			// Map buffer index to line number
			const bufferLineOffsets = new Map<number, number>();
			for (let i = 0; i < this.resBuffer.length; i++) {
				bufferLineOffsets.set(i, currentGenLine);
				const entry = this.resBuffer[i]!;
				// Calculate lines occupied by this entry
				// join('\n') adds a newline after each entry (except last, but we account for next start)
				// Each entry occupies (newlines + 1) lines.
				// The join adds 1 newline, moving start of next entry by 1 line.
				// Wait. "a" -> 1 line. Next starts at +1.
				// "a\nb" -> 2 lines. Next starts at +2.
				// So increment = (newlines in entry) + 1.
				currentGenLine += (entry.match(/\n/g) || []).length + 1;
			}

			for (const mapping of this.resMappings) {
				const genLine = bufferLineOffsets.get(mapping.index);
				if (genLine !== undefined) {
					this.generator.addMapping({
						genLine: genLine,
						genCol: mapping.col,
						sourceLine: mapping.node.loc!.start.line,
						sourceCol: mapping.node.loc!.start.column,
					});
				}
			}
		}

		// Main function body code
		let code = `
${destructuring}
let ${varLocals} = $ctx.$props;
${pre}
${res}
${pos}
return $ctx;
//# sourceURL=${this.filename}`;

		if (!this.kire.production) {
			code += `\n//# sourceMappingURL=${this.generator.toDataUri()}`;
		}

		return code;
	}

	/**
	 * Iterates over AST nodes and delegates compilation based on node type.
	 * @param nodes List of nodes to compile.
	 */
	private async compileNodes(nodes: Node[]) {
		let i = 0;
		while (i < nodes.length) {
			const node = nodes[i]!;
			switch (node.type) {
				case "text":
					this.compileText(node);
					break;
				case "variable":
					this.compileVariable(node);
					break;
				case "javascript":
					this.compileJavascript(node);
					break;
				case "directive":
					await this.processDirective(node);
					break;
			}
			i++;
		}
	}

	/**
	 * Compiles a text node, appending it to the result buffer.
	 * @param node The text node.
	 */
	private compileText(node: Node) {
		if (node.content) {
			if (node.loc) {
                const currentLine = node.loc.start.line;
                this.resMappings.push({
                    index: this.resBuffer.length + 1,
                    node,
                    col: this.resBuffer[this.resBuffer.length - 1]?.length || 0
                });
                this.resBuffer.push(`// kire-line: ${currentLine}`);
            }
			this.resBuffer.push(`$ctx.$add(${JSON.stringify(node.content)});`);
		}
	}

	/**
	 * Compiles a variable node, dealing with raw vs escaped output.
	 * @param node The variable node.
	 */
	private compileVariable(node: Node) {
		if (node.content) {
			if (node.loc) {
                const currentLine = node.loc.start.line;
                this.resMappings.push({
                    index: this.resBuffer.length + 1,
                    node,
                    col: this.resBuffer[this.resBuffer.length - 1]?.length || 0
                });
                this.resBuffer.push(`// kire-line: ${currentLine}`);
            }
			if (node.raw) {
				this.resBuffer.push(`$ctx.$add(${node.content});`);
			} else {
				this.resBuffer.push(`$ctx.$add($ctx.$escape(${node.content}));`);
			}
		}
	}

	/**
	 * Compiles a server-side JS node, injecting code directly into the buffer.
	 * @param node The javascript node.
	 */
	private compileJavascript(node: Node) {
		if (node.content) {
			const lines = node.content.split("\n");
			for (let i = 0; i < lines.length; i++) {
				const lineContent = lines[i]!;
				if (node.loc) {
                    const currentLine = node.loc.start.line + i;
					this.resMappings.push({
						index: this.resBuffer.length + 1, // +1 because we will push the comment first
						node: {
							...node,
							loc: {
								start: {
									line: currentLine,
									column: i === 0 ? node.loc.start.column + 4 : 1, // +4 for <?js
								},
								end: node.loc.end,
							},
						},
						col: 0,
					});
                    this.resBuffer.push(`// kire-line: ${currentLine}`);
				}
				this.resBuffer.push(lineContent);
			}
		}
	}

	/**
	 * Processes a directive node, executing its 'onCall' handler with a specific context.
	 * @param node The directive node.
	 */
	private async processDirective(node: Node) {
		const name = node.name;
		if (!name) return;

		const directive = this.kire.getDirective(name);

		if (!directive) {
			console.warn(`Directive @${name} not found.`);
			return;
		}

		if (node.loc) this.resMappings.push({ index: this.resBuffer.length, node, col: this.resBuffer[this.resBuffer.length - 1]?.length || 0 });
		const compiler = this.createCompilerContext(node, directive);
		await directive.onCall(compiler);
	}

	/**
	 * Creates the CompilerContext API that is exposed to directive handlers.
	 * @param node The current directive node.
	 * @param directive The directive definition.
	 * @returns The context object.
	 */
	private createCompilerContext(
		node: Node,
		directive: DirectiveDefinition,
	): CompilerContext {
		const paramsMap: Record<string, any> = {};

		// Process and validate parameters
		if (directive.params && node.args) {
			directive.params.forEach((paramDefStr, index) => {
				const argValue = node.args![index];
				// Skip if argument is missing (optional params handling could be improved here)
				if (argValue === undefined) return;

				const definition = parseParamDefinition(paramDefStr);
				const validation = definition.validate(argValue);

				if (!validation.valid) {
					throw new Error(
						`Invalid parameter for directive @${node.name}: ${validation.error}`,
					);
				}

				// Store the main parameter value by its name (e.g., 'expr' in 'expr:string')
				paramsMap[definition.name] = argValue;

				// Store any extracted variables from patterns (e.g., 'item' and 'list' from '{item} in {list}')
				if (validation.extracted) {
					Object.assign(paramsMap, validation.extracted);
				}
			});
		}

		return {
			kire: this.kire,
			node: node,
			count: (name: string) => {
				if (this.counters[name] === undefined) this.counters[name] = 0;
				return `$${this.counters[name]++}${name}`;
			},
			param: (key: string | number) => {
				if (typeof key === "number") {
					return node.args?.[key];
				}
				// Lookup in the processed params map first
				if (paramsMap[key] !== undefined) {
					return paramsMap[key];
				}
				// Fallback to legacy index-based lookup if not found in map (e.g. if definition didn't match perfectly or wasn't provided)
				if (directive.params && node.args) {
					const index = directive.params.findIndex(
						(p) => p.split(":")[0] === key,
					);
					if (index !== -1) return node.args[index];
				}
				return undefined;
			},
			children: node.children,
			parents: node.related,
			set: async (nodes: Node[]) => {
				if (!nodes) return;
				await this.compileNodes(nodes);
			},
			render: async (content: string) => {
				return await this.kire.compile(content);
			},
			resolve: (path: string) => {
				return this.kire.resolvePath(path);
			},
			func: (code: string) => {
				return `async function($ctx) { ${code} }`;
			},
			error: (msg: string) => {
				throw new Error(`Error in directive @${node.name}: ${msg}`);
			},
			// Legacy/Standard Directive API
			pre: (code: string) => {
				this.preBuffer.push(code);
			},
			res: (content: string) => {
				this.resBuffer.push(`$ctx.$add(${JSON.stringify(content)});`);
			},
			raw: (code: string) => {
				this.resBuffer.push(code);
			},
			pos: (code: string) => {
				this.posBuffer.push(code);
			},
			$pre: (code: string) => {
				this.resBuffer.push(`$ctx.$on('before', async ($ctx) => { ${code} });`);
			},
			$pos: (code: string) => {
				this.resBuffer.push(`$ctx.$on('after', async ($ctx) => { ${code} });`);
			},
		};
	}
}
