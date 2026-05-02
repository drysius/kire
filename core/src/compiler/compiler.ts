import type { Kire } from "../kire";
import type { CompilerApi, Node } from "../types";
import { escapeHtml } from "../utils/html";
import {
	INTERPOLATION_START_REGEX,
	NullProtoObj,
	RESERVED_KEYWORDS_REGEX,
	STRIP_QUOTES_REGEX,
	WILDCARD_CHAR_REGEX,
} from "../utils/regex";
import { SourceMapGenerator } from "../utils/source-map";
import { parseArgs } from "../lexer/balance";
import { AttrCodegen } from "./attr-codegen";
import { JsScanner } from "./js-scanner";

export class Compiler {
	// ── Code generation buffers ───────────────────────────────────────────────
	private body: string[] = [];
	private header: string[] = [];
	private footer: string[] = [];

	// ── State ─────────────────────────────────────────────────────────────────
	private dependencies: Record<string, string> = new NullProtoObj();
	private uidCounter: Record<string, number> = new NullProtoObj();
	private _async = false;
	private _isDependency = false;
	private textBuffer = "";

	// ── Source maps ───────────────────────────────────────────────────────────
	private generator: SourceMapGenerator;
	private mappings: { bodyIndex: number; node: Node; col: number }[] = [];

	// ── Identifier tracking ───────────────────────────────────────────────────
	private identifiers: Set<string> = new Set();
	private fullBody = "";
	private allIdentifiers: Set<string> = new Set();

	// ── Helpers ───────────────────────────────────────────────────────────────
	private scanner = new JsScanner();
	private attrCodegen = new AttrCodegen(this.scanner, () => this.markAsync());

	constructor(
		public kire: Kire<any>,
		private filename = "template.kire",
	) {
		this.generator = new SourceMapGenerator(filename);
		this.generator.addSource(filename);
	}

	// ── Public interface ──────────────────────────────────────────────────────

	public get async(): boolean {
		return this._async;
	}

	public getDependencies(): Record<string, string> {
		return this.dependencies;
	}

	public compile(
		nodes: Node[],
		extraGlobals: string[] = [],
		_isDependency = false,
	): string {
		// Reset all state for a fresh compile
		this._isDependency = _isDependency;
		this._async = false;
		this.body = [];
		this.header = [];
		this.footer = [];
		this.dependencies = new NullProtoObj();
		this.uidCounter = new NullProtoObj();
		this.mappings = [];
		this.textBuffer = "";
		this.fullBody = "";
		this.allIdentifiers = new Set();
		this.identifiers.clear();
		this.attrCodegen.reset();

		// Standard header — deps inherit $globals/$kire/$escape from parent closure scope
		this.header.push(`let $kire_response = "";`);
		if (!_isDependency) {
			this.header.push(`const $globals = this.$globals;`);
			this.header.push(`const $kire = this.$kire;`);
			// Always declare $escape in root so nested dep closures can inherit it
			this.header.push(`const $escape = this.$escape;`);
		}

		const localsAlias = this.kire.$var_locals || "it";
		const identifierDeclarations: Array<{ id: string; line: string }> = [];

		// Collect all identifiers and declared variables from the entire AST
		const localDecls = new Set<string>();
		this.analyzeAst(nodes, this.identifiers, localDecls, new Set());
		if (extraGlobals) extraGlobals.forEach((g) => this.identifiers.add(g));
		this.allIdentifiers = new Set(this.identifiers);
		this.fullBody = this.buildFullBody(nodes);

		// Plan identifier declarations — we'll only emit the ones actually used
		const useGlobal = this.kire.$use_global;
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

			if (this.hasExistVarProvider(id)) continue;

			let line: string;
			if (useGlobal) {
				// props → kire globals → globalThis (built-ins and env globals accessible by default)
				line = `let ${id} = $props['${id}'] ?? $globals['${id}'] ?? globalThis['${id}'];`;
			} else {
				line = `let ${id} = $props['${id}'] ?? $globals['${id}'];`;
			}

			identifierDeclarations.push({ id, line });
		}

		// Generate code
		this.compileNodes(nodes);
		this.flushText();

		// Run existVar providers
		this.runExistVarProviders();

		// Prune declarations — only emit what the body/footer actually references
		const bodyFooterSource = `${this.body.join("\n")}\n${this.footer.join("\n")}`;
		const bodyFooterNormalized = this.scanner.normalizeForScan(bodyFooterSource);

		if (this.scanner.isIdentifierReferenced(bodyFooterNormalized, "NullProtoObj")) {
			this.header.push(`const NullProtoObj = this.NullProtoObj;`);
		}

		for (const declaration of identifierDeclarations) {
			if (
				this.scanner.isIdentifierReferenced(bodyFooterNormalized, declaration.id) ||
				this.attrCodegen.mixedAttrIdents.has(declaration.id)
			) {
				this.header.push(declaration.line);
			}
		}

		if (
			this.identifiers.has(localsAlias) &&
			this.scanner.isIdentifierReferenced(bodyFooterNormalized, localsAlias)
		) {
			this.header.push(`const ${localsAlias} = $props;`);
		}

		// Finalize dependency closures (after header pruning to avoid polluting analysis)
		this.finalizeDependencies();

		let code = `\n${this.header.join("\n")}\n${this.body.join("\n")}\n${this.footer.join("\n")}\nreturn $kire_response;\n//# sourceURL=${this.filename}`;

		// Attach source maps in development
		if (!this.kire.$production) {
			code += this.buildSourceMap();
		}

		return code;
	}

	// ── AST analysis ──────────────────────────────────────────────────────────

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
	): void {
		const scanIdents = (c: string) => this.scanner.collectIdentifiers(c, idents);

		for (const n of nodes) {
			if (n.type === "interpolation" || n.type === "js") scanIdents(n.content || "");
			if (n.args) n.args.forEach((a) => typeof a === "string" && scanIdents(a));
			if (n.type === "js" && n.content) {
				this.scanner.collectDeclaredVars(n.content, decls);
			}

			if (n.type === "directive") {
				if (n.name === "defined" || n.name === "define") idents.add("__kire_defines");
				if (n.name === "stack" || n.name === "push") idents.add("__kire_stack");

				const def = this.kire.getDirective(n.name!);
				if (def) {
					if (def.isDependency) {
						const paths = def.isDependency(n.args || [], n.attributes);
						for (const path of paths) this.analyzeDepPath(path, idents, decls, visited);
					}
					if (def.scope) {
						const vars = def.scope(n.args || [], n.attributes);
						for (const v of vars) this.scanner.collectBindingsFromPattern(v, decls);
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
								n.tagName?.match(new RegExp(`^${d.name.replace("*", "(.*)")}$`))))
					) {
						def = d;
						break;
					} else if (d.name instanceof RegExp && d.name.test(n.tagName!)) {
						def = d;
						break;
					}
				}

				if (def) {
					const alias =
						typeof n.tagName === "string" && n.tagName.startsWith("kire:")
							? n.tagName.slice("kire:".length)
							: "";
					if (alias === "defined" || alias === "define") idents.add("__kire_defines");
					if (alias === "stack" || alias === "push") idents.add("__kire_stack");

					if (def.isDependency) {
						const paths = def.isDependency(n.args || [], n.attributes);
						for (const path of paths) this.analyzeDepPath(path, idents, decls, visited);
					}
					if (def.scope) {
						const vars = def.scope(n.args || [], n.attributes);
						for (const v of vars) this.scanner.collectBindingsFromPattern(v, decls);
					}
				}

				if (n.attributes) {
					for (const [key, val] of Object.entries(n.attributes)) {
						if (key.startsWith("@")) {
							scanIdents(val);
						} else {
							const attrDecl = Array.isArray(def?.attributes)
								? def.attributes.find((entry: any) => {
										if (!entry?.name) return false;
										if (entry.name === key) return true;
										if (typeof entry.name === "string" && entry.name.includes("*")) {
											return new RegExp(`^${entry.name.replace("*", ".*")}$`).test(key);
										}
										return false;
									})
								: undefined;
							const attrTypes = Array.isArray(attrDecl?.type)
								? attrDecl.type
								: attrDecl?.type
									? [attrDecl.type]
									: [];
							const isJs =
								key.startsWith(":") ||
								attrTypes.some(
									(t: string) => t === "javascript" || t === "js" || t === "any",
								);

							if (isJs) {
								scanIdents(val);
							} else if (INTERPOLATION_START_REGEX.test(val)) {
								// Scan interpolation expressions directly — parseAttrCode() wraps them
								// in a template literal which would hide them from the identifier scan
								const rx = /\{\{\s*(.*?)\s*\}\}/g;
								let interpM: RegExpExecArray | null;
								while ((interpM = rx.exec(val)) !== null) {
									if (interpM[1]) scanIdents(interpM[1]);
								}
							} else {
								const code = this.attrCodegen.parseAttrCode(val);
								if (code !== val) scanIdents(code);
							}
						}
					}
				}
			}

			if (n.children) this.analyzeAst(n.children, idents, decls, visited);
			if (n.related) this.analyzeAst(n.related, idents, decls, visited);
		}
	}

	private analyzeDepPath(
		path: string,
		idents: Set<string>,
		decls: Set<string>,
		visited: Set<string>,
	): void {
		try {
			const resolved = this.kire.resolvePath(path);
			if (!visited.has(resolved)) {
				visited.add(resolved);
				const content = this.kire.readFile(resolved);
				const depNodes = this.kire.parse(content);
				this.analyzeAst(depNodes, idents, decls, visited);
			}
		} catch (_e) {}
	}

	// ── Code generation ───────────────────────────────────────────────────────

	private markAsync(): void {
		this._async = true;
	}

	private flushText(): void {
		if (this.textBuffer) {
			this.body.push(`$kire_response += ${this.attrCodegen.esc(this.textBuffer)};`);
			this.textBuffer = "";
		}
	}

	private compileNodes(nodes: Node[]): void {
		for (const n of nodes) {
			switch (n.type) {
				case "text":
					this.textBuffer += n.content || "";
					break;

				case "interpolation":
					this.flushText();
					if (this.scanner.containsAwait(n.content)) this.markAsync();
					if (!this.kire.$production && n.loc) {
						this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
						this.body.push(`// kire-line: ${n.loc.line}`);
					}
					this.body.push(
						`$kire_response += ${n.raw ? n.content : `$escape(${n.content})`};`,
					);
					break;

				case "js":
					this.flushText();
					if (this.scanner.containsAwait(n.content)) this.markAsync();
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

	private processDirective(n: Node): void {
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
			// Unknown directives are kept as literal text (e.g. @tailwindcss)
			this.body.push(`$kire_response += "@${n.name}";`);
		}
	}

	private processElement(n: Node): void {
		const t = n.tagName || "";
		let matcher = null;
		for (const m of this.kire.$elementMatchers) {
			const def = m.def;
			if (typeof def.name === "string") {
				if (def.name === t) { matcher = m; break; }
				if (WILDCARD_CHAR_REGEX.test(def.name)) {
					const p = def.name.replace("*", "(.*)");
					const m2 = t.match(new RegExp(`^${p}$`));
					if (m2) { n.wildcard = m2[1]; matcher = m; break; }
				}
			} else if (def.name instanceof RegExp && def.name.test(t)) {
				matcher = m;
				break;
			}
		}

		if (!matcher) {
			// Plain HTML element — emit directly with attribute handling
			this.textBuffer += `<${t}`;
			if (n.attributes) {
				for (const [key, val] of Object.entries(n.attributes)) {
					if (key.startsWith("@")) {
						this.flushText();
						const dirDef = this.kire.getDirective(key.slice(1));
						if (dirDef) {
							if (!this.kire.$production) {
								this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
								if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
							}
							dirDef.onCall(
								this.createCompilerApi(
									{
										...n,
										type: "directive",
										name: key.slice(1),
										args: parseArgs(val),
									},
									dirDef,
								),
							);
						}
					} else if (INTERPOLATION_START_REGEX.test(val)) {
						this.textBuffer += ` ${key}="`;
						this.flushText();
						const code = this.attrCodegen.parseHtmlAttrCode(val);
						this.body.push(`$kire_response += ${code};`);
						this.textBuffer += '"';
					} else {
						this.textBuffer += ` ${key}="${escapeHtml(val)}"`;
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

	// ── Compiler API ──────────────────────────────────────────────────────────

	private createCompilerApi(node: Node, _definition: any, _isExistVar = false): any {
		const self = this;
		const api: any = {
			kire: this.kire,
			node,
			editable: true,
			isDependency: this._isDependency,
			get fullBody() { return self.fullBody; },
			get allIdentifiers() { return self.allIdentifiers; },
			get wildcard() { return node.wildcard; },
			get children() { return node.children; },

			prologue: (js: string) => {
				if (this.scanner.containsAwait(js)) this.markAsync();
				this.header.unshift(js);
			},
			write: (js: string) => {
				this.flushText();
				if (this.scanner.containsAwait(js)) this.markAsync();
				this.body.push(js);
			},
			epilogue: (js: string) => {
				this.flushText();
				if (this.scanner.containsAwait(js)) this.markAsync();
				this.footer.push(js);
			},
			after: (js: string) => api.epilogue(js),
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
				const id = `_$dep${Object.keys(this.dependencies).length}`;
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
				this.compileNodes(ns || node.children || []);
			},
			uid: (p: string) => {
				this.uidCounter[p] = (this.uidCounter[p] || 0) + 1;
				return `_${p}${this.uidCounter[p]}`;
			},

			renderAttributes: (attrs?: Record<string, string>) => {
				const target = attrs || node.attributes;
				if (!target) return;
				for (const [key, val] of Object.entries(target)) {
					if (key.startsWith("@")) continue;
					if (INTERPOLATION_START_REGEX.test(val)) {
						this.textBuffer += ` ${key}="`;
						this.flushText();
						const code = this.attrCodegen.parseHtmlAttrCode(val);
						this.body.push(`$kire_response += ${code};`);
						this.textBuffer += '"';
					} else {
						this.textBuffer += ` ${key}="${escapeHtml(val)}"`;
					}
				}
			},

			getAttribute: (n: string) => {
				const val = node.type === "element" ? node.attributes?.[n] : undefined;
				if (val !== undefined) return this.attrCodegen.parseAttrCode(val);
				if (node.type === "directive" && node.args) {
					for (const arg of node.args) {
						if (typeof arg !== "string") continue;
						const m = arg.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([\s\S]+)$/);
						if (m && m[1] === n) return this.attrCodegen.parseAttrCode(m[2]!);
					}
				}
				return undefined;
			},
			getArgument: (i: number) => {
				const argVal = node.args?.[i];
				return typeof argVal === "string"
					? this.attrCodegen.parseAttrCode(argVal)
					: argVal;
			},
			transform: (c: string) => this.attrCodegen.parseAttrCode(c),
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

	// ── existVar providers ────────────────────────────────────────────────────

	private hasExistVarProvider(identifier: string): boolean {
		for (const entries of this.kire.$kire["~handlers"].exists_vars.values()) {
			for (const entry of entries) {
				if (typeof entry.name === "string") {
					if (entry.name === identifier) return true;
				} else if (entry.name instanceof RegExp) {
					entry.name.lastIndex = 0;
					const matched = entry.name.test(identifier);
					entry.name.lastIndex = 0;
					if (matched) return true;
				}
			}
		}
		return false;
	}

	private runExistVarProviders(): void {
		const activeIdentifiers = new Set(this.identifiers);
		const triggered = new Set<string>();
		const uniqueCallbacks = new Set<any>();

		const scanGenerated = () => {
			const raw =
				this.header.join("\n") + "\n" + this.body.join("\n") + "\n" + this.footer.join("\n");
			this.scanner.collectIdentifiers(raw, activeIdentifiers);
		};

		scanGenerated();

		let changed = true;
		while (changed) {
			changed = false;

			for (const [name, entries] of this.kire.$kire["~handlers"].exists_vars) {
				const nameStr = name.toString();
				if (triggered.has(nameStr)) continue;

				for (const entry of entries) {
					let isUsed = activeIdentifiers.has(nameStr);
					if (!isUsed && entry.name instanceof RegExp) {
						for (const id of activeIdentifiers) {
							entry.name.lastIndex = 0;
							if (entry.name.test(id)) { isUsed = true; break; }
						}
						entry.name.lastIndex = 0;
					}

					if (isUsed) {
						if (
							entry.unique &&
							this._isDependency &&
							(this.kire.$kire["~compile-context"]?.depth || 0) > 1
						) {
							triggered.add(nameStr);
							break;
						}
						if (entry.unique && uniqueCallbacks.has(entry.callback)) continue;

						entry.callback?.(
							this.createCompilerApi(
								{ type: "directive", name: "existVar", loc: { line: 0, column: 0 } } as any,
								{},
								true,
							),
						);
						if (entry.unique) uniqueCallbacks.add(entry.callback);
						triggered.add(nameStr);
						changed = true;
					}
				}
			}

			if (changed) scanGenerated();
		}
	}

	// ── Dependencies ──────────────────────────────────────────────────────────

	private finalizeDependencies(): void {
		if (Object.keys(this.dependencies).length === 0) return;

		const dependencyCodes: string[] = [];
		for (const path in this.dependencies) {
			const id = this.dependencies[path]!;
			const compiledDep = this.kire.getOrCompile(path, true);
			let fallbackAsync = false;

			const depCode =
				typeof compiledDep?.meta?.code === "string"
					? compiledDep.meta.code
					: (() => {
							const depNodes = this.kire.parse(
								this.kire.readFile(this.kire.resolvePath(path)),
							);
							const depCompiler = new Compiler(this.kire, path);
							const code = depCompiler.compile(depNodes, [], true);
							fallbackAsync = depCompiler.async;
							return code;
						})();

			const asyncDep =
				compiledDep?.meta?.async === undefined
					? fallbackAsync
					: Boolean(compiledDep.meta.async);

			dependencyCodes.push(
				`const ${id} = ${asyncDep ? "async " : ""}($props = {}) => {\n${depCode}\n};\n${id}.meta = { async: ${asyncDep}, path: ${JSON.stringify(path)} };`,
			);
		}

		this.body.unshift("// Dependencies", ...dependencyCodes);
	}

	// ── Source maps ───────────────────────────────────────────────────────────

	private buildSourceMap(): string {
		const headerLines = `${this.header.join("\n")}\n`.split("\n").length + 1;
		const bodyLineOffsets: number[] = [];
		let currentLine = headerLines;
		for (let i = 0; i < this.body.length; i++) {
			bodyLineOffsets[i] = currentLine;
			currentLine += this.body[i]!.split("\n").length;
		}

		for (const m of this.mappings) {
			let targetIdx = m.bodyIndex;
			if (
				typeof this.body[targetIdx] === "string" &&
				this.body[targetIdx]!.trim().startsWith("// kire-line:") &&
				targetIdx + 1 < this.body.length
			) {
				targetIdx += 1;
			}

			const genLine = bodyLineOffsets[targetIdx];
			if (genLine !== undefined && m.node.loc) {
				this.generator.addMapping({
					genLine,
					genCol: m.col,
					sourceLine: m.node.loc.line,
					sourceCol: m.node.loc.column,
				});
			}
		}

		return `\n//# sourceMappingURL=${this.generator.toDataUri()}`;
	}
}
