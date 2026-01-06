import type { Kire } from "./kire";
import type { CompilerContext, DirectiveDefinition, Node } from "./types";

export class Compiler {
	private preBuffer: string[] = [];
	private resBuffer: string[] = [];
	private posBuffer: string[] = [];
	private usedDirectives: Set<string> = new Set();

	constructor(private kire: Kire) {}

	/**
	 * Compiles a list of AST nodes into a JavaScript function body string.
	 * @param nodes The root nodes of the AST.
	 * @returns The compiled JavaScript code as a string.
	 */
	public async compile(nodes: Node[]): Promise<string> {
		this.preBuffer = [];
		this.resBuffer = [];
		this.posBuffer = [];
		this.usedDirectives.clear();

		await this.compileNodes(nodes);

		const pre = this.preBuffer.join("\n");
		const res = this.resBuffer.join("\n");
		const pos = this.posBuffer.join("\n");

		// Main function body code
		const code = `with($ctx) { \n${pre}\n${res}\n${pos}\nreturn $ctx;\n }`;

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
			this.resBuffer.push(`$ctx['~res'] += ${JSON.stringify(node.content)};`);
		}
	}

	/**
	 * Compiles a variable node, dealing with raw vs escaped output.
	 * @param node The variable node.
	 */
	private compileVariable(node: Node) {
		if (node.content) {
			if (node.raw) {
				this.resBuffer.push(`$ctx['~res'] += (${node.content});`);
			} else {
				this.resBuffer.push(`$ctx['~res'] += $ctx.$escape(${node.content});`);
			}
		}
	}

	/**
	 * Compiles a server-side JS node, injecting code directly into the buffer.
	 * @param node The javascript node.
	 */
	private compileJavascript(node: Node) {
		if (node.content) {
			this.resBuffer.push(node.content);
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
		const self = this;
		return {
			kire: this.kire,
			param: (key: string | number) => {
				if (typeof key === "number") {
					return node.args?.[key];
				}
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
			pre: (code: string) => {
				this.preBuffer.push(code);
			},
			res: (content: string) => {
				const escaped = content
					.replace(/\\/g, "\\\\")
					.replace(/`/g, "\\`")
					.replace(/\${/g, "\\${ ");
				this.resBuffer.push(`$ctx.res(\`${escaped}\`);`);
			},
			raw: (code: string) => {
				this.resBuffer.push(code);
			},
			pos: (code: string) => {
				this.posBuffer.push(code);
			},
			$pre: (code: string) => {
				this.resBuffer.push(
					`$ctx['~$pre'].push(async ($ctx) => { with($ctx) { ${code} } });`,
				);
			},
			$pos: (code: string) => {
				this.resBuffer.push(
					`$ctx['~$pos'].push(async ($ctx) => { with($ctx) { ${code} } });`,
				);
			},
			error: (msg: string) => {
				throw new Error(`Error in directive @${node.name}: ${msg}`);
			},
			get "~res"() {
				return self.resBuffer.join("\n");
			},
			get "~pre"() {
				return self.preBuffer;
			},
			get "~pos"() {
				return self.posBuffer;
			},
		};
	}
}
