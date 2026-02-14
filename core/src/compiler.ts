import type { Kire } from "./kire";
import type { CompilerContext, DirectiveDefinition, Node } from "./types";
import { parseParamDefinition } from "./utils/params";
import { SourceMapGenerator } from "./utils/source-map";
import { TAG_NAME_REGEX, JS_IDENTIFIER_REGEX } from "./utils/regex";

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
        private usedElements: Set<string> = new Set()
	) {
		this.generator = new SourceMapGenerator(filename);
		this.generator.addSource(filename);
	}

	/**
	 * Compiles a list of AST nodes into a JavaScript function body string.
	 * @param nodes The root nodes of the AST.
	 * @returns The compiled JavaScript code as a string.
	 */
	public compile(nodes: Node[], extraGlobals: string[] = [], usedElements?: Set<string>): string {
		this.preBuffer = [];
		this.resBuffer = [];
		this.posBuffer = [];
		this.resMappings = [];
		this.usedDirectives.clear();
		this.counters = {};
        if (usedElements) this.usedElements = usedElements;

		const varLocals = this.kire.$var_locals || "it";
		this.compileNodesSync(nodes);

		// Optimized destructuring
		let startCode = "";
        
        // 1. Destructure Locals first (highest priority for shadowing)
        const localSet = new Set<string>();
        const sanitizedLocals = extraGlobals.filter(k => {
            if (JS_IDENTIFIER_REGEX.test(k) && k !== varLocals && k !== "$ctx") {
                localSet.add(k);
                return true;
            }
            return false;
        });
        if (sanitizedLocals.length > 0) startCode += `const { ${sanitizedLocals.join(", ")} } = $ctx.$props;\n`;

		// 2. Destructure Globals (only those not already in locals)
		const sanitizedGlobals = Object.keys(this.kire.$globals).filter(k => 
            JS_IDENTIFIER_REGEX.test(k) && !localSet.has(k) && k !== varLocals && k !== "$ctx"
        );
        if (sanitizedGlobals.length > 0) startCode += `const { ${sanitizedGlobals.join(", ")} } = $ctx.$globals;\n`;
        
        if (varLocals !== "none") startCode += `const ${varLocals} = $ctx.$props;\n`;
        if (usedElements?.size) startCode += `// kire-elements: ${Array.from(usedElements).join(",")}\n`;
		
        if (this.preBuffer.length > 0) startCode += this.preBuffer.join("\n") + "\n";

		if (!this.kire.production) {
            let currentGenLine = startCode.split("\n").length;
			const bufferLineOffsets = new Map<number, number>();
			for (let i = 0; i < this.resBuffer.length; i++) {
				bufferLineOffsets.set(i, currentGenLine);
				currentGenLine += (this.resBuffer[i]!.match(/\n/g) || []).length + 1;
			}

			for (const mapping of this.resMappings) {
				const genLine = bufferLineOffsets.get(mapping.index);
				if (genLine !== undefined) {
					this.generator.addMapping({
						genLine,
						genCol: mapping.col,
						sourceLine: mapping.node.loc!.start.line,
						sourceCol: mapping.node.loc!.start.column,
					});
				}
			}
		}

		let code = `\n${startCode}\n${this.resBuffer.join("\n")}\n${this.posBuffer.join("\n")}\nreturn $ctx.$response;\n//# sourceURL=${this.filename}`;

		if (!this.kire.production) {
			code += `\n//# sourceMappingURL=${this.generator.toDataUri()}`;
		}

		return code;
	}

	/**
	 * Iterates over AST nodes and delegates compilation based on node type.
	 * @param nodes List of nodes to compile.
	 */
	private compileNodesSync(nodes: Node[]) {
		let pending: string[] = [];

		const flush = () => {
			if (pending.length === 0) return;
			this.resBuffer.push(`$ctx.$add(${pending.join(" + ")});`);
			pending = [];
		};

		let i = 0;
		while (i < nodes.length) {
			const node = nodes[i]!;

			if (node.type === "text") {
				let content = node.content || "";
				let j = i + 1;
				while (j < nodes.length && nodes[j]!.type === "text") {
					content += nodes[j]!.content || "";
					j++;
				}
				
                if (this.kire.production) {
                    pending.push(JSON.stringify(content));
                } else {
                    this.compileText({ ...node, content });
                }
				i = j;
				continue;
			}

            if (node.type === "variable") {
                if (this.kire.production && node.content) {
                    const expr = node.raw ? `(${node.content})` : `$ctx.$escape(${node.content})`;
                    pending.push(expr);
                } else {
                    this.compileVariable(node);
                }
                i++;
                continue;
            }

            flush();

			switch (node.type) {
				case "javascript":
					this.compileJavascript(node);
					break;
				case "directive":
					this.processDirective(node);
					break;
			}
			i++;
		}
        flush();
	}

	private isAsyncNodes(nodes: Node[]): boolean {
		return nodes.some((node) => this.isAsyncNode(node));
	}

	private isAsyncNode(node: Node): boolean {
		if (node.type === "javascript" || node.type === "variable") {
			return node.content?.includes("await") ?? false;
		}
		if (node.type === "directive") {
			if (
				node.name === "require" ||
				node.name === "include" ||
				node.name === "layout" ||
				node.name === "extends" ||
				node.name === "component"
			) {
				return true;
			}
			if (node.children && this.isAsyncNodes(node.children)) {
				return true;
			}
			if (node.related && this.isAsyncNodes(node.related)) {
				return true;
			}
		}
		return false;
	}

	private compileText(node: Node) {
		if (node.content) {
			if (node.loc && !this.kire.production) {
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

	private compileVariable(node: Node) {
		if (node.content) {
			if (node.loc && !this.kire.production) {
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

	private compileJavascript(node: Node) {
		if (node.content) {
			const lines = node.content.split("\n");
			for (let i = 0; i < lines.length; i++) {
				const lineContent = lines[i]!;
				if (node.loc && !this.kire.production) {
                    const currentLine = node.loc.start.line + i;
					this.resMappings.push({
						index: this.resBuffer.length + 1,
						node: {
							...node,
							loc: {
								start: {
									line: currentLine,
									column: i === 0 ? node.loc.start.column + 4 : 1,
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

	private processDirective(node: Node) {
		const name = node.name;
		if (!name) return;

		const directive = this.kire.getDirective(name);

		if (!directive) {
			console.warn(`Directive @${name} not found.`);
			return;
		}

		if (node.loc && !this.kire.production) this.resMappings.push({ index: this.resBuffer.length, node, col: this.resBuffer[this.resBuffer.length - 1]?.length || 0 });
		const compiler = this.createCompilerContext(node, directive);
		directive.onCall(compiler);
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
				// Skip if argument is missing
				if (argValue === undefined) return;

				const definition = parseParamDefinition(paramDefStr);
				const validation = definition.validate(argValue);

				if (!validation.valid) {
					throw new Error(
						`Invalid parameter for directive @${node.name}: ${validation.error}`,
					);
				}

				// Store the main parameter value by its name
				paramsMap[definition.name] = argValue;

				// Store any extracted variables from patterns
				if (validation.extracted) {
					Object.assign(paramsMap, validation.extracted);
				}
			});
		}

		const compiler: CompilerContext = {
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
				// Fallback to legacy index-based lookup
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
			set: (nodes: Node[]) => {
				if (!nodes) return;
				this.compileNodesSync(nodes);
			},
			render: (content: string) => {
				return this.kire.compile(content);
			},
			resolve: (path: string) => {
				return this.kire.resolvePath(path);
			},
			func: (code: string) => {
				const isAsync = code.includes("await");
				return `${isAsync ? "async " : ""}function($ctx) { ${code}; return $ctx.$response; }`;
			},
			merge: (
				callback: (ctx: CompilerContext) => void | Promise<void>,
			) => {
				const isAsync = node.children ? this.isAsyncNodes(node.children) : false;
				this.resBuffer.push(
					`$ctx.$response += ${isAsync ? "await " : ""}(${
						isAsync ? "async " : ""
					}($ctx) => {`,
				);
				callback(compiler);
				this.resBuffer.push(`  return $ctx.$response;`);
				this.resBuffer.push(`})($ctx.$fork());`);
			},
			error: (msg: string) => {
				throw new Error(`Error in directive @${node.name}: ${msg}`);
			},
			// Legacy/Standard Directive API
			pre: (code: string) => {
				this.preBuffer.push(code);
			},
			res: (content: string) => {
                // Detect elements in dynamic content
                if (this.kire.$elements.size > 0) {
                    TAG_NAME_REGEX.lastIndex = 0;
                    const tagMatch = content.match(TAG_NAME_REGEX);
                    if (tagMatch) {
                        for (const m of tagMatch) {
                            const tagName = m.slice(1);
                            this.usedElements.add(tagName);
                        }
                    }
                }
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

		return compiler;
	}
}
