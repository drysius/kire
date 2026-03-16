import type { Kire } from "./kire";
import type { CompilerApi, Node } from "./types";
import { escapeHtml } from "./utils/html";
import {
	AWAIT_KEYWORD_REGEX,
	INTERPOLATION_GLOBAL_REGEX,
	INTERPOLATION_PURE_REGEX,
	INTERPOLATION_START_REGEX,
	JS_EXTRACT_IDENTS_REGEX,
	JS_STRINGS_REGEX,
	NullProtoObj,
	RESERVED_KEYWORDS_REGEX,
	STRIP_QUOTES_REGEX,
	WILDCARD_CHAR_REGEX,
} from "./utils/regex";
import { SourceMapGenerator } from "./utils/source-map";

export class Compiler {
	private body: string[] = [];
	private header: string[] = [];
	private footer: string[] = [];
	private dependencies: Record<string, string> = new NullProtoObj();
	private uidCounter: Record<string, number> = new NullProtoObj();
	private _async: boolean = false;
	private textBuffer: string = "";
	private generator: SourceMapGenerator;
	private mappings: { bodyIndex: number; node: Node; col: number }[] = [];
	private identifiers: Set<string> = new Set();
	private fullBody: string = "";
	private allIdentifiers: Set<string> = new Set();

	constructor(
		public kire: Kire<any>,
		private filename = "template.kire",
	) {
		this.generator = new SourceMapGenerator(filename);
		this.generator.addSource(filename);
	}

	public get async(): boolean {
		return this._async;
	}
	public getDependencies(): Record<string, string> {
		return this.dependencies;
	}
	private markAsync() {
		this._async = true;
	}

	private esc(str: string): string {
		return (
			"`" +
			str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$") +
			"`"
		);
	}

	private flushText() {
		if (this.textBuffer) {
			this.body.push(`$kire_response += ${this.esc(this.textBuffer)};`);
			this.textBuffer = "";
		}
	}

	/** Converts an HTML attribute value (possibly with {{}}) into a JS expression */
	private parseAttrCode(val: string): string {
		if (!INTERPOLATION_START_REGEX.test(val)) return val;
		// If it is a pure interpolation, extract the inner expression
		const pureMatch = val.match(INTERPOLATION_PURE_REGEX);
		if (pureMatch) return pureMatch[1]!;

		// If it is mixed text, convert to a template literal or concatenation
		const res = val.replace(
			INTERPOLATION_GLOBAL_REGEX,
			(_, expr) => `\${$escape(${expr})}`,
		);
		return `\`${res}\``;
	}

	public compile(
		nodes: Node[],
		extraGlobals: string[] = [],
		_isDependency = false,
	): string {
		this.body = [];
		this.header = [];
		this.footer = [];
		this.dependencies = new NullProtoObj();
		this.uidCounter = new NullProtoObj();
		this.mappings = [];
		this._async = false;
		this.textBuffer = "";
		this.fullBody = "";
		this.allIdentifiers = new Set();
		this.identifiers.clear();

		this.header.push(
			`$globals = Object.assign(Object.create(this.$globals), $globals);`,
		);
		this.header.push(`let $kire_response = "";`);
		this.header.push(`const $escape = this.$escape;`);
		this.header.push(`const NullProtoObj = this.NullProtoObj;`);
		const localsAlias = this.kire.$var_locals || "it";

		// Deep identifier collection (including dependencies)
		const localDecls = new Set<string>();
		this.analyzeAst(nodes, this.identifiers, localDecls, new Set());
		if (extraGlobals) extraGlobals.forEach((g) => this.identifiers.add(g));
		this.allIdentifiers = new Set(this.identifiers);
		this.fullBody = this.buildFullBody(nodes);

		for (const id of this.identifiers) {
			if (
				RESERVED_KEYWORDS_REGEX.test(id) ||
				localDecls.has(id) ||
				id === localsAlias ||
				id === "$props" ||
				id === "$globals" ||
				id === "$kire" ||
				id === "$kire_response" ||
				id === "$escape" ||
				id === "NullProtoObj"
			)
				continue;

			// Skip variables that have existVar handlers (they will be injected by the loop below)
			if (this.kire.$kire["~handlers"].exists_vars.has(id)) continue;

			this.header.push(
				`let ${id} = $props['${id}'] ?? $globals['${id}'] ?? (typeof globalThis !== 'undefined' ? globalThis['${id}'] : undefined);`,
			);
		}

		if (this.identifiers.has(localsAlias)) {
			this.header.push(`const ${localsAlias} = $props;`);
		}

		this.compileNodes(nodes);
		this.flushText();

		// Register variable providers
		// We do this in a loop because one existVar might trigger another
		let changed = true;
		const triggered = new Set<string>();
		const activeIdentifiers = new Set(this.identifiers);

		// Initial scan of generated code to detect identifiers injected by directives/elements
		const scanGeneratedCode = () => {
			const rawAllCode =
				this.header.join("\n") +
				"\n" +
				this.body.join("\n") +
				"\n" +
				this.footer.join("\n");
			const cleanCode = rawAllCode.replace(JS_STRINGS_REGEX, '""');
			let m: RegExpExecArray | null;
			while ((m = JS_EXTRACT_IDENTS_REGEX.exec(cleanCode)) !== null) {
				if (m[1]) activeIdentifiers.add(m[1]);
			}
			JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
		};

		scanGeneratedCode();

		while (changed) {
			changed = false;
			const compileContext = this.kire.$kire["~compile-context"];

			for (const [name, entries] of this.kire.$kire["~handlers"].exists_vars) {
				const nameStr = name.toString();
				if (triggered.has(nameStr)) continue;

				for (const entry of entries) {
					let isUsed = activeIdentifiers.has(nameStr);
					if (!isUsed && entry.name instanceof RegExp) {
						for (const id of activeIdentifiers) {
							if (entry.name.test(id)) {
								isUsed = true;
								break;
							}
						}
					}

					if (isUsed) {
						if (
							entry.unique &&
							compileContext?.uniqueExistVarCallbacks.has(entry.callback)
						) {
							continue;
						}
						entry.callback?.(
							this.createCompilerApi(
								{
									type: "directive",
									name: "existVar",
									loc: { line: 0, column: 0 },
								} as any,
								{},
								true,
							),
						);
						if (entry.unique) {
							compileContext?.uniqueExistVarCallbacks.add(entry.callback);
						}
						triggered.add(nameStr);
						changed = true;
					}
				}
			}

			if (changed) {
				scanGeneratedCode();
			}
		}

		// Finalize dependencies as Closures
		if (Object.keys(this.dependencies).length > 0) {
			const dependencyCodes: string[] = [];
			for (const path in this.dependencies) {
				const id = this.dependencies[path]!;
				const compiledDependency = this.kire.getOrCompile(path, true);
				let fallbackAsync = false;
				const depCode =
					typeof compiledDependency?.meta?.code === "string"
						? compiledDependency.meta.code
						: (() => {
								const depNodes = this.kire.parse(
									this.kire.readFile(this.kire.resolvePath(path)),
								);
								const compilerInstance = new Compiler(this.kire, path);
								const code = compilerInstance.compile(depNodes, [], true);
								fallbackAsync = compilerInstance.async;
								return code;
							})();
				const asyncDep =
					compiledDependency?.meta?.async === undefined
						? fallbackAsync
						: Boolean(compiledDependency.meta.async);

				dependencyCodes.push(
					`const ${id} = ${asyncDep ? "async " : ""}function($props = {}, $globals = {}) {\n${depCode}\n};\n${id}.meta = { async: ${asyncDep}, path: '${path}' };`,
				);
			}
			this.body.unshift(`// Dependencies`, ...dependencyCodes);
		}

		let code = `\n${this.header.join("\n")}\n${this.body.join("\n")}\n${this.footer.join("\n")}\nreturn $kire_response;\n//# sourceURL=${this.filename}`;

		if (!this.kire.$production) {
			const headerLines = `${this.header.join("\n")}\n`.split("\n").length + 1;
			const bodyLineOffsets: number[] = [];
			let currentLine = headerLines;
			for (let i = 0; i < this.body.length; i++) {
				bodyLineOffsets[i] = currentLine;
				currentLine += this.body[i]!.split("\n").length;
			}

			for (const m of this.mappings) {
				const genLine = bodyLineOffsets[m.bodyIndex];
				if (genLine !== undefined && m.node.loc) {
					this.generator.addMapping({
						genLine,
						genCol: m.col,
						sourceLine: m.node.loc.line,
						sourceCol: m.node.loc.column,
					});
				}
			}
			code += `\n//# sourceMappingURL=${this.generator.toDataUri()}`;
		}

		return code;
	}

	private buildFullBody(nodes: Node[]): string {
		let out = "";
		const walk = (list: Node[]) => {
			for (const n of list) {
				if (typeof n.content === "string") out += `${n.content}\n`;
				if (typeof n.name === "string") out += `${n.name}\n`;
				if (typeof n.tagName === "string") out += `${n.tagName}\n`;
				if (n.args) {
					for (const arg of n.args) {
						if (typeof arg === "string") out += `${arg}\n`;
					}
				}
				if (n.attributes) {
					for (const [k, v] of Object.entries(n.attributes)) {
						out += `${k}\n${v}\n`;
					}
				}
				if (n.children) walk(n.children);
				if (n.related) walk(n.related);
			}
		};
		walk(nodes);
		return out;
	}

	private analyzeAst(
		nodes: Node[],
		idents: Set<string>,
		decls: Set<string>,
		visited: Set<string>,
	) {
		const scanIdents = (c: string) => {
			let m: RegExpExecArray | null;
			while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
				const id = m[1];
				if (id && !RESERVED_KEYWORDS_REGEX.test(id)) idents.add(id);
			}
			JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
		};

		const scanDecls = (c: string) => {
			let m: RegExpExecArray | null;
			while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
				const id = m[1];
				if (id && !RESERVED_KEYWORDS_REGEX.test(id)) decls.add(id);
			}
			JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
		};

		for (const n of nodes) {
			if (n.type === "interpolation" || n.type === "js")
				scanIdents(n.content || "");
			if (n.args) n.args.forEach((a) => typeof a === "string" && scanIdents(a));
			if (n.type === "js" && n.content) {
				const declRegex = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
				let m: RegExpExecArray | null;
				while ((m = declRegex.exec(n.content)) !== null) {
					if (m[1]) decls.add(m[1]);
				}
			}

			if (n.type === "directive") {
				if (n.name === "defined" || n.name === "define")
					idents.add("__kire_defines");
				if (n.name === "stack" || n.name === "push") idents.add("__kire_stack");

				const def = this.kire.getDirective(n.name!);
				if (def) {
					if (def.isDependency) {
						const paths = def.isDependency(n.args || [], n.attributes);
						for (const path of paths) {
							try {
								const resolved = this.kire.resolvePath(path);
								if (!visited.has(resolved)) {
									visited.add(resolved);
									const depContent = this.kire.readFile(resolved);
									const depNodes = this.kire.parse(depContent);
									this.analyzeAst(depNodes, idents, decls, visited);
								}
							} catch (_e) {}
						}
					}
					if (def.scope) {
						const vars = def.scope(n.args || [], n.attributes);
						for (const v of vars) scanDecls(v);
					}
					if (def.exposes) {
						for (const v of def.exposes) decls.add(v);
					}
				}
			}

			if (n.type === "element") {
				let def = null;
				for (const m of this.kire.$elementMatchers) {
					const d = m.def;
					if (
						typeof d.name === "string" &&
						(d.name === n.tagName ||
							(d.name.includes("*") &&
								n.tagName?.match(
									new RegExp(`^${d.name.replace("*", "(.*)")}$`),
								)))
					) {
						def = d;
						break;
					} else if (d.name instanceof RegExp && d.name.test(n.tagName!)) {
						def = d;
						break;
					}
				}

				if (def) {
					if (def.isDependency) {
						const paths = def.isDependency(n.args || [], n.attributes);
						for (const path of paths) {
							try {
								const resolved = this.kire.resolvePath(path);
								if (!visited.has(resolved)) {
									visited.add(resolved);
									const depContent = this.kire.readFile(resolved);
									const depNodes = this.kire.parse(depContent);
									this.analyzeAst(depNodes, idents, decls, visited);
								}
							} catch (_e) {}
						}
					}
					if (def.scope) {
						const vars = def.scope(n.args || [], n.attributes);
						for (const v of vars) scanDecls(v);
					}
				}

				if (n.attributes) {
					for (const [key, val] of Object.entries(n.attributes)) {
						if (n.tagName?.startsWith("kire:") || key.startsWith("@")) {
							scanIdents(val);
						} else {
							const code = this.parseAttrCode(val);
							if (code !== val) scanIdents(code);
						}
					}
				}
			}

			if (n.children) this.analyzeAst(n.children, idents, decls, visited);
			if (n.related) this.analyzeAst(n.related, idents, decls, visited);
		}
	}

	private compileNodes(nodes: Node[]) {
		for (const n of nodes) {
			switch (n.type) {
				case "text":
					this.textBuffer += n.content || "";
					break;
				case "interpolation":
					this.flushText();
					if (n.content && AWAIT_KEYWORD_REGEX.test(n.content))
						this.markAsync();
					if (!this.kire.$production && n.loc) {
						this.mappings.push({
							bodyIndex: this.body.length,
							node: n,
							col: 0,
						});
						this.body.push(`// kire-line: ${n.loc.line}`);
					}
					this.body.push(
						`$kire_response += ${n.raw ? n.content : `$escape(${n.content})`};`,
					);
					break;
				case "js":
					this.flushText();
					if (n.content && AWAIT_KEYWORD_REGEX.test(n.content))
						this.markAsync();
					if (!this.kire.$production && n.content && n.loc) {
						const lines = n.content.split("\n");
						for (let i = 0; i < lines.length; i++) {
							const currentLine = n.loc.line + i;
							this.mappings.push({
								bodyIndex: this.body.length,
								node: { ...n, loc: { ...n.loc, line: currentLine } },
								col: 0,
							});
							this.body.push(`// kire-line: ${currentLine}`);
							this.body.push(lines[i] || "");
						}
					} else {
						this.body.push(n.content || "");
					}
					break;
				case "directive":
					this.flushText();
					this.processDirective(n);
					break;
				case "element":
					this.processElement(n);
					break;
			}
		}
	}

	private processDirective(n: Node) {
		const d = this.kire.getDirective(n.name!);
		if (!this.kire.$production) {
			this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
			if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
		}
		if (d) {
			d.onCall(this.createCompilerApi(n, d));
		} else {
			if (this.kire.$strict_directives) {
				const loc = n.loc
					? `${this.filename}:${n.loc.line}:${n.loc.column}`
					: this.filename;
				throw new Error(`Unknown directive "@${n.name}" at ${loc}.`);
			}
			// Keep unknown directives as text (e.g. @tailwindcss)
			this.body.push(`$kire_response += "@${n.name}";`);
		}
	}

	private processElement(n: Node) {
		const t = n.tagName || "";
		let matcher = null;
		for (const m of this.kire.$elementMatchers) {
			const def = m.def;
			if (typeof def.name === "string") {
				if (def.name === t) {
					matcher = m;
					break;
				}
				if (WILDCARD_CHAR_REGEX.test(def.name)) {
					const p = def.name.replace("*", "(.*)");
					const m2 = t.match(new RegExp(`^${p}$`));
					if (m2) {
						n.wildcard = m2[1];
						matcher = m;
						break;
					}
				}
			} else if (def.name instanceof RegExp && def.name.test(t)) {
				matcher = m;
				break;
			}
		}

		if (!matcher) {
			this.textBuffer += `<${t}`;
			if (n.attributes) {
				for (const [key, val] of Object.entries(n.attributes)) {
					if (key.startsWith("@")) {
						this.flushText();
						const dirDef = this.kire.getDirective(key.slice(1));
						if (dirDef) {
							if (!this.kire.$production) {
								this.mappings.push({
									bodyIndex: this.body.length,
									node: n,
									col: 0,
								});
								if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
							}
							dirDef.onCall(
								this.createCompilerApi(
									{
										...n,
										type: "directive",
										name: key.slice(1),
										args: this.parseDirectiveAttributeArgs(val),
									},
									dirDef,
								),
							);
						}
					} else {
						if (INTERPOLATION_START_REGEX.test(val)) {
							this.textBuffer += ` ${key}="`;
							this.flushText();
							const code = this.parseAttrCode(val);
							this.body.push(`$kire_response += ${code};`);
							this.textBuffer += '"';
						} else {
							this.textBuffer += ` ${key}="${escapeHtml(val)}"`;
						}
					}
				}
			}
			this.textBuffer += ">";
			if (n.children) this.compileNodes(n.children);
			if (!n.void) this.textBuffer += `</${t}>`;
			return;
		}

		this.flushText();
		if (!this.kire.$production) {
			this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
			if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
		}
		if (typeof matcher.def.onCall === "function") {
			matcher.def.onCall(this.createCompilerApi(n, matcher.def));
		}
	}

	private createCompilerApi(
		node: Node,
		_definition: any,
		_isExistVar = false,
	): any {
		const self = this;
		const api: any = {
			kire: this.kire,
			node,
			editable: true,
			get fullBody() {
				return self.fullBody;
			},
			get allIdentifiers() {
				return self.allIdentifiers;
			},
			get wildcard() {
				return node.wildcard;
			},
			get children() {
				return node.children;
			},
			prologue: (js: string) => {
				if (AWAIT_KEYWORD_REGEX.test(js)) this.markAsync();
				this.header.unshift(js);
			},
			write: (js: string) => {
				this.flushText();
				if (AWAIT_KEYWORD_REGEX.test(js)) this.markAsync();
				this.body.push(js);
			},
			epilogue: (js: string) => {
				this.flushText();
				if (AWAIT_KEYWORD_REGEX.test(js)) this.markAsync();
				this.footer.push(js);
			},
			after: (js: string) => {
				api.epilogue(js);
			},
			markAsync: () => this.markAsync(),
			getDependency: (p: string) => {
				const cleanPath = p.replace(STRIP_QUOTES_REGEX, "");
				return this.kire.getOrCompile(cleanPath, true);
			},
			depend: (p: string) => {
				const cleanPath = p.replace(STRIP_QUOTES_REGEX, "");
				let r = this.kire.resolvePath(cleanPath);
				if (r.startsWith(this.kire.$root)) {
					r = this.kire.$platform
						.relative(this.kire.$root, r)
						.replace(/\\/g, "/");
				}
				if (this.dependencies[r]) return this.dependencies[r]!;
				const id = `_dep${Object.keys(this.dependencies).length}`;
				this.dependencies[r] = id;
				return id;
			},
			append: (c: any) => {
				if (typeof c === "string") {
					this.textBuffer += c;
				} else {
					this.flushText();
					this.body.push(`$kire_response += ${c};`);
				}
			},
			renderChildren: (ns?: Node[]) => {
				const targetNodes = ns || node.children || [];
				this.compileNodes(targetNodes);
			},
			uid: (p: string) => {
				this.uidCounter[p] = (this.uidCounter[p] || 0) + 1;
				return `_${p}${this.uidCounter[p]}`;
			},
			renderAttributes: (attrs?: Record<string, string>) => {
				const target = attrs || node.attributes;
				if (!target) return;
				for (const [key, val] of Object.entries(target)) {
					if (key.startsWith("@")) {
						// We don't render directives as attributes
						continue;
					}
					if (INTERPOLATION_START_REGEX.test(val)) {
						api.append(` ${key}="`);
						api.append(this.parseAttrCode(val));
						api.append('"');
					} else {
						api.append(` ${key}="${escapeHtml(val)}"`);
					}
				}
			},
			getAttribute: (n: string) => {
				const val = node.type === "element" ? node.attributes?.[n] : undefined;
				if (val !== undefined) return this.parseAttrCode(val);

				// Named arguments for directives can be passed as: @directive(name: value)
				if (node.type === "directive" && node.args) {
					for (const arg of node.args) {
						if (typeof arg !== "string") continue;
						const match = arg.match(
							/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([\s\S]+)$/,
						);
						if (match && match[1] === n) {
							return this.parseAttrCode(match[2]!);
						}
					}
				}
				return undefined;
			},
			getArgument: (i: number) => {
				const argVal = node.args?.[i];
				return typeof argVal === "string" ? this.parseAttrCode(argVal) : argVal;
			},
			transform: (c: string) => this.parseAttrCode(c),
			raw: (js: string) => api.write(js),
			res: (c: any) => api.append(c),
			set: (ns: Node[]) => api.renderChildren(ns),
			attribute: (n: string) => api.getAttribute(n),
			param: (n: string | number) =>
				typeof n === "number" ? api.getArgument(n) : api.getAttribute(n),
			inject: (js: string) => api.prologue(js),
			existVar: (
				name: string,
				callback: (api: CompilerApi) => void,
				unique = false,
			) => {
				this.kire.existVar(name, callback, unique);
			},
		};
		return api;
	}

	private parseDirectiveAttributeArgs(value: string): string[] {
		if (!value) return [];

		const args: string[] = [];
		let current = "";
		let depthParen = 0;
		let depthBracket = 0;
		let depthBrace = 0;
		let inQuote: string | null = null;

		for (let i = 0; i < value.length; i++) {
			const char = value[i]!;

			if (inQuote) {
				if (char === inQuote && value[i - 1] !== "\\") inQuote = null;
			} else {
				if (char === '"' || char === "'" || char === "`") inQuote = char;
				else if (char === "(") depthParen++;
				else if (char === ")") depthParen--;
				else if (char === "[") depthBracket++;
				else if (char === "]") depthBracket--;
				else if (char === "{") depthBrace++;
				else if (char === "}") depthBrace--;
				else if (
					char === "," &&
					depthParen === 0 &&
					depthBracket === 0 &&
					depthBrace === 0
				) {
					if (current.trim()) args.push(current.trim());
					current = "";
					continue;
				}
			}

			current += char;
		}

		if (current.trim()) args.push(current.trim());
		return args;
	}
}
