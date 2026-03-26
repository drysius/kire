var __require = /* @__PURE__ */ ((x) =>
	typeof require !== "undefined"
		? require
		: typeof Proxy !== "undefined"
			? new Proxy(x, {
					get: (a, b) => (typeof require !== "undefined" ? require : a)[b],
				})
			: x)(function (x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error(`Dynamic require of "${x}" is not supported`);
});

// ../core/src/utils/regex.ts
var NullProtoObj = () => Object.create(null);
var TAG_OPEN_REGEX = /^<([a-zA-Z0-9_\-:.]+)/;
var TAG_CLOSE_REGEX = /^<\/([a-zA-Z0-9_\-:.]+)>/;
var ATTR_NAME_BREAK_REGEX = /\s|=|>|\/|\(/;
var WHITESPACE_REGEX = /\s/;
var DIRECTIVE_NAME_REGEX = /^@([a-zA-Z0-9_\-.:]+)/;
var JS_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
var JS_EXTRACT_IDENTS_REGEX =
	/(?:['"`].*?['"`])|(?<=\.\s*)[a-zA-Z_$][a-zA-Z0-9_$]*|(?<![a-zA-Z0-9_$])([a-zA-Z_$][a-zA-Z0-9_$]*)(?![a-zA-Z0-9_$])/g;
var INTERPOLATION_PURE_REGEX = /^\s*\{\{\s*(.*?)\s*\}\}\s*$/;
var INTERPOLATION_GLOBAL_REGEX = /\{\{\s*(.*?)\s*\}\}/g;
var RESERVED_KEYWORDS_REGEX =
	/^(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|enum|await|true|false|null|of)$/;
var HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
var HTML_ESCAPE_GLOBAL_REGEX = /[&<>"']/g;
var TEXT_SCAN_REGEX = /{{|@|</g;
var INTERPOLATION_START_REGEX = /{{/;
var WILDCARD_CHAR_REGEX = /\*/;
var AWAIT_KEYWORD_REGEX = /\bawait\b/g;
var createVarThenRegex = (name) => {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`);
	return new RegExp(
		`(?<![a-zA-Z0-9_$.])${escaped}(?![a-zA-Z0-9_$])(?!(?:\\s)*:)`,
	);
};
var QUOTED_STR_CHECK_REGEX = /^['"]/;
var STRIP_QUOTES_REGEX = /^['"]|['"]$/g;
var JS_STRINGS_REGEX = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g;
var JS_LINE_COMMENT_REGEX = /\/\/[^\n\r]*/g;
var JS_BLOCK_COMMENT_REGEX = /\/\*[\s\S]*?\*\//g;
function createFastMatcher(list) {
	const sources = list.map((item) => {
		if (item instanceof RegExp) return item.source;
		if (item.includes("*")) {
			const parts = item.split("*");
			const escapedParts = parts.map((p) =>
				p.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`),
			);
			return escapedParts.join(".*");
		}
		return item.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`);
	});
	sources.sort((a, b) => b.length - a.length);
	return new RegExp(`(?:${sources.join("|")})`);
}

// ../core/src/utils/html.ts
var ESCAPE_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#039;",
};
function escapeHtml(unsafe) {
	if (unsafe === null || unsafe === undefined) return "";
	const type = typeof unsafe;
	if (type === "number" || type === "boolean") return String(unsafe);
	if (type !== "string") unsafe = String(unsafe);
	if (!HTML_ESCAPE_CHECK_REGEX.test(unsafe)) return unsafe;
	return unsafe.replace(HTML_ESCAPE_GLOBAL_REGEX, (m) => ESCAPE_MAP[m]);
}

// ../core/src/utils/base64.ts
function hasNodeBuffer() {
	return typeof Buffer !== "undefined" && typeof Buffer.from === "function";
}
function encodeBase64(text) {
	if (hasNodeBuffer()) {
		return Buffer.from(text, "utf-8").toString("base64");
	}
	if (typeof btoa === "function") {
		const bytes = new TextEncoder().encode(text);
		let binary = "";
		for (const byte of bytes) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	}
	throw new Error("No base64 encoder available in this runtime.");
}
function decodeBase64(base64) {
	if (hasNodeBuffer()) {
		return Buffer.from(base64, "base64").toString("utf-8");
	}
	if (typeof atob === "function") {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return new TextDecoder().decode(bytes);
	}
	throw new Error("No base64 decoder available in this runtime.");
}

// ../core/src/utils/source-map.ts
var BASE64_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function encodeVLQ(value) {
	let res = "";
	let vlq = value < 0 ? (-value << 1) | 1 : value << 1;
	do {
		let digit = vlq & 31;
		vlq >>>= 5;
		if (vlq > 0) digit |= 32;
		res += BASE64_CHARS[digit];
	} while (vlq > 0);
	return res;
}
function decodeVLQ(str, index) {
	let result = 0;
	let shift = 0;
	let continuation = true;
	let i = index;
	while (continuation) {
		const char = str[i++];
		if (!char) throw new Error("Invalid VLQ");
		const digit = BASE64_CHARS.indexOf(char);
		if (digit === -1) throw new Error(`Invalid Base64 char: ${char}`);
		continuation = (digit & 32) !== 0;
		result += (digit & 31) << shift;
		shift += 5;
	}
	const value = result & 1 ? -(result >>> 1) : result >>> 1;
	return [value, i];
}

class SourceMapGenerator {
	file;
	mappings = [];
	sources = [];
	constructor(file) {
		this.file = file;
	}
	addSource(source) {
		const index = this.sources.indexOf(source);
		if (index === -1) {
			this.sources.push(source);
			return this.sources.length - 1;
		}
		return index;
	}
	addMapping(mapping) {
		this.mappings.push(mapping);
	}
	toString() {
		let lastGenLine = 1;
		let lastGenCol = 0;
		let lastSourceIndex = 0;
		let lastSourceLine = 0;
		let lastSourceCol = 0;
		const encodedMappings = [];
		let lineMappings = [];
		this.mappings.sort((a, b) => {
			if (a.genLine !== b.genLine) return a.genLine - b.genLine;
			return a.genCol - b.genCol;
		});
		for (const m of this.mappings) {
			while (m.genLine > lastGenLine) {
				encodedMappings.push(lineMappings.join(","));
				lineMappings = [];
				lastGenLine++;
				lastGenCol = 0;
			}
			let segment = "";
			segment += encodeVLQ(m.genCol - lastGenCol);
			lastGenCol = m.genCol;
			if (m.sourceLine !== undefined) {
				const sourceIndex = m.sourceIndex ?? 0;
				segment += encodeVLQ(sourceIndex - lastSourceIndex);
				lastSourceIndex = sourceIndex;
				segment += encodeVLQ(m.sourceLine - 1 - lastSourceLine);
				lastSourceLine = m.sourceLine - 1;
				segment += encodeVLQ(m.sourceCol - 1 - lastSourceCol);
				lastSourceCol = m.sourceCol - 1;
			}
			lineMappings.push(segment);
		}
		encodedMappings.push(lineMappings.join(","));
		const map = {
			version: 3,
			file: this.file,
			sources: this.sources,
			names: [],
			mappings: encodedMappings.join(";"),
		};
		return JSON.stringify(map);
	}
	toDataUri() {
		const base64 = encodeBase64(this.toString());
		return `data:application/json;charset=utf-8;base64,${base64}`;
	}
}
function resolveSourceLocation(map, genLine, genCol) {
	if (!map?.mappings) return null;
	const lines = map.mappings.split(";");
	if (genLine > lines.length || genLine < 1) return null;
	let stateGenCol = 0;
	let stateSourceIndex = 0;
	let stateSourceLine = 0;
	let stateSourceCol = 0;
	let bestMatch = null;
	for (let l = 0; l < genLine; l++) {
		const line = lines[l];
		stateGenCol = 0;
		if (!line) continue;
		let i = 0;
		while (i < line.length) {
			const [dCol, nextI1] = decodeVLQ(line, i);
			i = nextI1;
			stateGenCol += dCol;
			if (i >= line.length || line[i] === ",") {
				if (l === genLine - 1 && stateGenCol <= genCol) {
				}
			} else {
				const [dSrcIdx, nextI2] = decodeVLQ(line, i);
				i = nextI2;
				stateSourceIndex += dSrcIdx;
				const [dSrcLine, nextI3] = decodeVLQ(line, i);
				i = nextI3;
				stateSourceLine += dSrcLine;
				const [dSrcCol, nextI4] = decodeVLQ(line, i);
				i = nextI4;
				stateSourceCol += dSrcCol;
				if (i < line.length && line[i] !== ",") {
					const [_, nextI5] = decodeVLQ(line, i);
					i = nextI5;
				}
				if (l === genLine - 1) {
					if (stateGenCol <= genCol) {
						bestMatch = {
							line: stateSourceLine + 1,
							column: stateSourceCol + 1,
							source: map.sources[stateSourceIndex] || "",
						};
					} else {
						break;
					}
				}
			}
			if (i < line.length && line[i] === ",") i++;
		}
	}
	return bestMatch;
}

// ../core/src/compiler.ts
class Compiler {
	kire;
	filename;
	body = [];
	header = [];
	footer = [];
	dependencies = new NullProtoObj();
	uidCounter = new NullProtoObj();
	_async = false;
	_isDependency = false;
	textBuffer = "";
	generator;
	mappings = [];
	identifiers = new Set();
	fullBody = "";
	allIdentifiers = new Set();
	constructor(kire, filename = "template.kire") {
		this.kire = kire;
		this.filename = filename;
		this.generator = new SourceMapGenerator(filename);
		this.generator.addSource(filename);
	}
	get async() {
		return this._async;
	}
	getDependencies() {
		return this.dependencies;
	}
	markAsync() {
		this._async = true;
	}
	containsAwaitKeyword(code) {
		if (!code) return false;
		const normalized = code
			.replace(JS_STRINGS_REGEX, '""')
			.replace(JS_LINE_COMMENT_REGEX, "")
			.replace(JS_BLOCK_COMMENT_REGEX, "");
		const awaitRegex = new RegExp(AWAIT_KEYWORD_REGEX.source, "g");
		let match;
		while ((match = awaitRegex.exec(normalized)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			const prev = this.getPrevNonWhitespaceChar(normalized, start - 1);
			const next = this.getNextNonWhitespaceChar(normalized, end);
			if (prev === "." || next === ":") continue;
			return true;
		}
		return false;
	}
	getPrevNonWhitespaceChar(source, index) {
		for (let i = index; i >= 0; i--) {
			const ch = source[i];
			if (!/\s/.test(ch)) return ch;
		}
		return "";
	}
	getNextNonWhitespaceChar(source, index) {
		for (let i = index; i < source.length; i++) {
			const ch = source[i];
			if (!/\s/.test(ch)) return ch;
		}
		return "";
	}
	esc(str) {
		return `\`${str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}\``;
	}
	flushText() {
		if (this.textBuffer) {
			this.body.push(`$kire_response += ${this.esc(this.textBuffer)};`);
			this.textBuffer = "";
		}
	}
	parseAttrCode(val) {
		if (!INTERPOLATION_START_REGEX.test(val)) return val;
		const pureMatch = val.match(INTERPOLATION_PURE_REGEX);
		if (pureMatch) return pureMatch[1];
		const res = val.replace(
			INTERPOLATION_GLOBAL_REGEX,
			(_, expr) => `\${$escape(${expr})}`,
		);
		return `\`${res}\``;
	}
	compile(nodes, extraGlobals = [], _isDependency = false) {
		this._isDependency = _isDependency;
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
		const localsAlias = this.kire.$var_locals || "it";
		const identifierDeclarations = [];
		const localDecls = new Set();
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
			if (this.kire.$kire["~handlers"].exists_vars.has(id)) continue;
			identifierDeclarations.push({
				id,
				line: `let ${id} = $props['${id}'] ?? $globals['${id}'];`,
			});
		}
		this.compileNodes(nodes);
		this.flushText();
		let changed = true;
		const triggered = new Set();
		const uniqueCallbacks = new Set();
		const activeIdentifiers = new Set(this.identifiers);
		const scanGeneratedCode = () => {
			const rawAllCode = `${this.header.join(`
`)}
${this.body.join(`
`)}
${this.footer.join(`
`)}`;
			const cleanCode = rawAllCode.replace(JS_STRINGS_REGEX, '""');
			let m;
			while ((m = JS_EXTRACT_IDENTS_REGEX.exec(cleanCode)) !== null) {
				if (m[1]) activeIdentifiers.add(m[1]);
			}
			JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
		};
		scanGeneratedCode();
		while (changed) {
			changed = false;
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
							this._isDependency &&
							(this.kire.$kire["~compile-context"]?.depth || 0) > 1
						) {
							triggered.add(nameStr);
							break;
						}
						if (entry.unique && uniqueCallbacks.has(entry.callback)) {
							continue;
						}
						entry.callback?.(
							this.createCompilerApi(
								{
									type: "directive",
									name: "existVar",
									loc: { line: 0, column: 0 },
								},
								{},
								true,
							),
						);
						if (entry.unique) {
							uniqueCallbacks.add(entry.callback);
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
		const bodyFooterSource = `${this.body.join(`
`)}
${this.footer.join(`
`)}`;
		const bodyFooterNormalized = bodyFooterSource
			.replace(JS_STRINGS_REGEX, '""')
			.replace(JS_LINE_COMMENT_REGEX, "")
			.replace(JS_BLOCK_COMMENT_REGEX, "");
		if (createVarThenRegex("$escape").test(bodyFooterNormalized)) {
			this.header.push(`const $escape = this.$escape;`);
		}
		if (createVarThenRegex("NullProtoObj").test(bodyFooterNormalized)) {
			this.header.push(`const NullProtoObj = this.NullProtoObj;`);
		}
		for (let i = 0; i < identifierDeclarations.length; i++) {
			const declaration = identifierDeclarations[i];
			if (createVarThenRegex(declaration.id).test(bodyFooterNormalized)) {
				this.header.push(declaration.line);
			}
		}
		if (
			this.identifiers.has(localsAlias) &&
			createVarThenRegex(localsAlias).test(bodyFooterNormalized)
		) {
			this.header.push(`const ${localsAlias} = $props;`);
		}
		if (Object.keys(this.dependencies).length > 0) {
			const dependencyCodes = [];
			for (const path in this.dependencies) {
				const id = this.dependencies[path];
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
								const code2 = compilerInstance.compile(depNodes, [], true);
								fallbackAsync = compilerInstance.async;
								return code2;
							})();
				const asyncDep =
					compiledDependency?.meta?.async === undefined
						? fallbackAsync
						: Boolean(compiledDependency.meta.async);
				dependencyCodes.push(`const ${id} = ${asyncDep ? "async " : ""}function($props = {}, $globals = {}, $kire) {
${depCode}
};
${id}.meta = { async: ${asyncDep}, path: ${JSON.stringify(path)} };`);
			}
			this.body.unshift(`// Dependencies`, ...dependencyCodes);
		}
		let code = `
${this.header.join(`
`)}
${this.body.join(`
`)}
${this.footer.join(`
`)}
return $kire_response;
//# sourceURL=${this.filename}`;
		if (!this.kire.$production) {
			const headerLines =
				`${this.header.join(`
`)}
`.split(`
`).length + 1;
			const bodyLineOffsets = [];
			let currentLine = headerLines;
			for (let i = 0; i < this.body.length; i++) {
				bodyLineOffsets[i] = currentLine;
				currentLine += this.body[i].split(`
`).length;
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
			code += `
//# sourceMappingURL=${this.generator.toDataUri()}`;
		}
		return code;
	}
	buildFullBody(nodes) {
		let out = "";
		const walk = (list) => {
			for (const n of list) {
				if (typeof n.content === "string")
					out += `${n.content}
`;
				if (typeof n.name === "string")
					out += `${n.name}
`;
				if (typeof n.tagName === "string")
					out += `${n.tagName}
`;
				if (n.args) {
					for (const arg of n.args) {
						if (typeof arg === "string")
							out += `${arg}
`;
					}
				}
				if (n.attributes) {
					for (const [k, v] of Object.entries(n.attributes)) {
						out += `${k}
${v}
`;
					}
				}
				if (n.children) walk(n.children);
				if (n.related) walk(n.related);
			}
		};
		walk(nodes);
		return out;
	}
	analyzeAst(nodes, idents, decls, visited) {
		const scanIdents = (c) => {
			let m;
			while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
				const id = m[1];
				if (id && !RESERVED_KEYWORDS_REGEX.test(id)) idents.add(id);
			}
			JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
		};
		const scanDecls = (c) => {
			let m;
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
				let m;
				while ((m = declRegex.exec(n.content)) !== null) {
					if (m[1]) decls.add(m[1]);
				}
			}
			if (n.type === "directive") {
				if (n.name === "defined" || n.name === "define")
					idents.add("__kire_defines");
				if (n.name === "stack" || n.name === "push") idents.add("__kire_stack");
				const def = this.kire.getDirective(n.name);
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
					} else if (d.name instanceof RegExp && d.name.test(n.tagName)) {
						def = d;
						break;
					}
				}
				if (def) {
					const aliasName =
						typeof n.tagName === "string" && n.tagName.startsWith("kire:")
							? n.tagName.slice("kire:".length)
							: "";
					if (aliasName === "defined" || aliasName === "define") {
						idents.add("__kire_defines");
					}
					if (aliasName === "stack" || aliasName === "push") {
						idents.add("__kire_stack");
					}
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
						if (key.startsWith("@")) {
							scanIdents(val);
						} else {
							const attrDecl = Array.isArray(def?.attributes)
								? def.attributes.find((entry) => {
										if (!entry?.name) return false;
										if (entry.name === key) return true;
										if (
											typeof entry.name === "string" &&
											entry.name.includes("*")
										) {
											const pattern = new RegExp(
												`^${entry.name.replace("*", ".*")}$`,
											);
											return pattern.test(key);
										}
										return false;
									})
								: undefined;
							const attrTypes = Array.isArray(attrDecl?.type)
								? attrDecl.type
								: attrDecl?.type
									? [attrDecl.type]
									: [];
							const shouldScanAsJs =
								key.startsWith(":") ||
								attrTypes.some(
									(type) =>
										type === "javascript" || type === "js" || type === "any",
								);
							if (shouldScanAsJs) {
								scanIdents(val);
								continue;
							}
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
	compileNodes(nodes) {
		for (const n of nodes) {
			switch (n.type) {
				case "text":
					this.textBuffer += n.content || "";
					break;
				case "interpolation":
					this.flushText();
					if (this.containsAwaitKeyword(n.content)) this.markAsync();
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
					if (this.containsAwaitKeyword(n.content)) this.markAsync();
					if (!this.kire.$production && n.content && n.loc) {
						const lines = n.content.split(`
`);
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
	processDirective(n) {
		const d = this.kire.getDirective(n.name);
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
			this.body.push(`$kire_response += "@${n.name}";`);
		}
	}
	processElement(n) {
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
	createCompilerApi(node, _definition, _isExistVar = false) {
		const self = this;
		const api = {
			kire: this.kire,
			node,
			editable: true,
			isDependency: this._isDependency,
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
			prologue: (js) => {
				if (this.containsAwaitKeyword(js)) this.markAsync();
				this.header.unshift(js);
			},
			write: (js) => {
				this.flushText();
				if (this.containsAwaitKeyword(js)) this.markAsync();
				this.body.push(js);
			},
			epilogue: (js) => {
				this.flushText();
				if (this.containsAwaitKeyword(js)) this.markAsync();
				this.footer.push(js);
			},
			after: (js) => {
				api.epilogue(js);
			},
			markAsync: () => this.markAsync(),
			getDependency: (p) => {
				const cleanPath = p.replace(STRIP_QUOTES_REGEX, "");
				return this.kire.getOrCompile(cleanPath, true);
			},
			depend: (p) => {
				const cleanPath = p.replace(STRIP_QUOTES_REGEX, "");
				let r = this.kire.resolvePath(cleanPath);
				if (r.startsWith(this.kire.$root)) {
					r = this.kire.$platform
						.relative(this.kire.$root, r)
						.replace(/\\/g, "/");
				}
				if (this.dependencies[r]) return this.dependencies[r];
				const id = `_dep${Object.keys(this.dependencies).length}`;
				this.dependencies[r] = id;
				return id;
			},
			append: (c) => {
				if (typeof c === "string") {
					this.textBuffer += c;
				} else {
					this.flushText();
					this.body.push(`$kire_response += ${c};`);
				}
			},
			renderChildren: (ns) => {
				const targetNodes = ns || node.children || [];
				this.compileNodes(targetNodes);
			},
			uid: (p) => {
				this.uidCounter[p] = (this.uidCounter[p] || 0) + 1;
				return `_${p}${this.uidCounter[p]}`;
			},
			renderAttributes: (attrs) => {
				const target = attrs || node.attributes;
				if (!target) return;
				for (const [key, val] of Object.entries(target)) {
					if (key.startsWith("@")) {
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
			getAttribute: (n) => {
				const val = node.type === "element" ? node.attributes?.[n] : undefined;
				if (val !== undefined) return this.parseAttrCode(val);
				if (node.type === "directive" && node.args) {
					for (const arg of node.args) {
						if (typeof arg !== "string") continue;
						const match = arg.match(
							/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([\s\S]+)$/,
						);
						if (match && match[1] === n) {
							return this.parseAttrCode(match[2]);
						}
					}
				}
				return;
			},
			getArgument: (i) => {
				const argVal = node.args?.[i];
				return typeof argVal === "string" ? this.parseAttrCode(argVal) : argVal;
			},
			transform: (c) => this.parseAttrCode(c),
			raw: (js) => api.write(js),
			res: (c) => api.append(c),
			set: (ns) => api.renderChildren(ns),
			attribute: (n) => api.getAttribute(n),
			param: (n) =>
				typeof n === "number" ? api.getArgument(n) : api.getAttribute(n),
			inject: (js) => api.prologue(js),
			existVar: (name, callback, unique = false) => {
				this.kire.existVar(name, callback, unique);
			},
		};
		return api;
	}
	parseDirectiveAttributeArgs(value) {
		if (!value) return [];
		const args = [];
		let current = "";
		let depthParen = 0;
		let depthBracket = 0;
		let depthBrace = 0;
		let inQuote = null;
		for (let i = 0; i < value.length; i++) {
			const char = value[i];
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

// ../core/src/elements/natives.ts
var toTemplateLiteral = (value) => {
	const escaped = value
		.replace(/\\/g, "\\\\")
		.replace(/`/g, "\\`")
		.replace(/\$/g, "\\$");
	return `\`${escaped.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr) => `\${${expr}}`)}\``;
};
var toComponentPropExpression = (api, attrName, value, quoted) => {
	if (attrName.startsWith(":")) {
		return {
			name: attrName.slice(1),
			expression: api.transform(value),
		};
	}
	if (!quoted) {
		return {
			name: attrName,
			expression: api.getAttribute(attrName),
		};
	}
	const trimmed = value.trim();
	if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.length > 2) {
		return {
			name: attrName,
			expression: trimmed.slice(1, -1),
		};
	}
	const pureInterpolation = value.match(INTERPOLATION_PURE_REGEX);
	if (pureInterpolation) {
		return {
			name: attrName,
			expression: pureInterpolation[1],
		};
	}
	return {
		name: attrName,
		expression: INTERPOLATION_START_REGEX.test(value)
			? toTemplateLiteral(value)
			: JSON.stringify(value),
	};
};
var relateKireNames = (values = []) =>
	values.map((value) => (value.startsWith("kire:") ? value : `kire:${value}`));
var natives_default = (kire) => {
	kire.element({
		name: "style",
		raw: true,
		description:
			"Raw style block forwarded to the output without escaping child content.",
		example: `<style>.card { display: grid; }</style>`,
		onCall: (api) => {
			api.append("<style");
			api.renderAttributes();
			api.append(">");
			api.renderChildren();
			api.append("</style>");
		},
	});
	kire.element({
		name: "script",
		raw: true,
		description:
			"Raw script block forwarded to the output without escaping child content.",
		example: `<script>window.boot = true;</script>`,
		onCall: (api) => {
			api.append("<script");
			api.renderAttributes();
			api.append(">");
			api.renderChildren();
			api.append("</script>");
		},
	});
	const directiveElementAttr = (name, type, description) => ({
		name,
		type,
		description,
	});
	const registerDirectiveElementAlias = (directiveName, options) => {
		const directive = kire.getDirective(directiveName);
		if (!directive) return;
		kire.element({
			name: `kire:${directiveName}`,
			void: options.void,
			description: options.description,
			example: options.example,
			attributes: options.attributes,
			relatedTo:
				options.relatedTo || relateKireNames(directive.relatedTo || []),
			isDependency: directive.isDependency,
			scope: directive.scope,
			onCall: (api) => {
				const attrDefs = options.attributes || [];
				const proxyApi = Object.create(api);
				proxyApi.getAttribute = (name) => {
					const original = api.getAttribute(name);
					const rawValue = api.node?.attributes?.[name];
					const attrDef = attrDefs.find((entry) => entry?.name === name);
					const attrTypes = Array.isArray(attrDef?.type)
						? attrDef.type
						: attrDef?.type
							? [attrDef.type]
							: [];
					if (
						typeof rawValue === "string" &&
						attrTypes.includes("string") &&
						!rawValue.includes("{{") &&
						!(rawValue.trim().startsWith("{") && rawValue.trim().endsWith("}"))
					) {
						return JSON.stringify(rawValue.trim());
					}
					return original;
				};
				directive.onCall(proxyApi);
			},
		});
	};
	registerDirectiveElementAlias("unless", {
		description:
			"Element alias for @unless that renders children when cond is falsy.",
		example: '<kire:unless cond="user">Guest only</kire:unless>',
		attributes: [
			directiveElementAttr(
				"cond",
				"javascript",
				"Expression that must evaluate falsy for the element body to render.",
			),
		],
		relatedTo: ["kire:else"],
	});
	registerDirectiveElementAlias("isset", {
		description:
			"Element alias for @isset that renders children when expr is defined and not null.",
		example:
			'<kire:isset expr="user.avatar"><img src="{{ user.avatar }}"></kire:isset>',
		attributes: [
			directiveElementAttr(
				"expr",
				"javascript",
				"Expression checked for defined and non-null values.",
			),
		],
	});
	registerDirectiveElementAlias("include", {
		description:
			"Element alias for @include that renders another Kire view inline.",
		example:
			'<kire:include path="partials.card" locals="{ title: pageTitle }" />',
		void: true,
		attributes: [
			directiveElementAttr(
				"path",
				"string",
				"View path that should be rendered inline.",
			),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the included view scope.",
			),
		],
	});
	registerDirectiveElementAlias("component", {
		description:
			"Element alias for @component that renders a dependency view and exposes nested slots.",
		example:
			'<kire:component path="layouts.card" locals="{ title: pageTitle }"><kire:slot name="header">Header</kire:slot>Body</kire:component>',
		attributes: [
			directiveElementAttr(
				"path",
				"string",
				"View path that should be rendered as the target component.",
			),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the component props.",
			),
		],
	});
	registerDirectiveElementAlias("layout", {
		description:
			"Element alias for @layout that renders a layout component and captures nested sections.",
		example:
			'<kire:layout path="layouts.app"><kire:section name="content"><p>Hello</p></kire:section></kire:layout>',
		attributes: [
			directiveElementAttr("path", "string", "Layout view path to render."),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the layout props.",
			),
		],
	});
	registerDirectiveElementAlias("extends", {
		description:
			"Element alias for @extends that mirrors layout-style component inheritance.",
		example:
			'<kire:extends path="layouts.app"><kire:section name="content"><p>Hello</p></kire:section></kire:extends>',
		attributes: [
			directiveElementAttr("path", "string", "Parent view path to render."),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the parent component props.",
			),
		],
	});
	registerDirectiveElementAlias("slot", {
		description:
			"Element alias for @slot that captures named slot content for the parent component.",
		example: '<kire:slot name="header"><h1>Dashboard</h1></kire:slot>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Slot name that will be exposed to the parent component.",
			),
		],
	});
	registerDirectiveElementAlias("section", {
		description:
			"Element alias for @section that behaves like a named slot within a layout or extends block.",
		example: '<kire:section name="content"><p>Hello</p></kire:section>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Section name captured for the target layout.",
			),
		],
	});
	registerDirectiveElementAlias("yield", {
		description:
			"Element alias for @yield that renders a named slot and can fall back to a default expression.",
		example: `<kire:yield name="content" default="'<p>Empty</p>'" />`,
		void: true,
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Slot name to resolve from the current component props.",
			),
			directiveElementAttr(
				"default",
				"javascript",
				"Fallback expression rendered when the slot is missing.",
			),
		],
	});
	registerDirectiveElementAlias("define", {
		description:
			"Element alias for @define that captures a reusable named fragment.",
		example: '<kire:define name="hero"><h1>Hero</h1></kire:define>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Fragment name stored in the define registry.",
			),
		],
	});
	registerDirectiveElementAlias("defined", {
		description:
			"Element alias for @defined that renders a named fragment or its inline fallback children.",
		example: '<kire:defined name="hero"><h1>Fallback</h1></kire:defined>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Fragment name looked up in the define registry.",
			),
		],
	});
	registerDirectiveElementAlias("stack", {
		description:
			"Element alias for @stack that renders the accumulated contents of a named stack.",
		example: '<kire:stack name="scripts" />',
		void: true,
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Stack name to inject at the current output position.",
			),
		],
	});
	registerDirectiveElementAlias("push", {
		description:
			"Element alias for @push that appends the rendered body to a named stack.",
		example:
			'<kire:push name="scripts"><script src="/app.js"></script></kire:push>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Stack name that should receive the current element body.",
			),
		],
	});
	kire.element({
		name: "kire:else",
		relatedTo: ["kire:if", "kire:elseif"],
		description:
			"Fallback branch for a preceding <kire:if> or <kire:elseif> block.",
		example: "<kire:else>Fallback content</kire:else>",
		onCall: (api) => {
			api.write(`} else {`);
			api.renderChildren();
		},
	});
	kire.element({
		name: "kire:elseif",
		relatedTo: ["kire:if", "kire:elseif"],
		description:
			"Conditional branch evaluated after a previous <kire:if> or <kire:elseif>.",
		example: '<kire:elseif cond="status === 2">Two</kire:elseif>',
		attributes: [
			{
				name: "cond",
				type: "javascript",
				description: "Expression that must evaluate truthy for this branch.",
			},
		],
		onCall: (api) => {
			const cond = api.getAttribute("cond");
			api.write(`} else if (${cond}) {`);
			api.renderChildren();
			if (api.node.related) api.renderChildren(api.node.related);
		},
	});
	kire.element({
		name: "kire:if",
		description:
			"Conditional block element alternative to the @if directive syntax.",
		example: '<kire:if cond="user">Hello</kire:if>',
		attributes: [
			{
				name: "cond",
				type: "javascript",
				description:
					"Expression that controls whether the children are rendered.",
			},
		],
		onCall: (api) => {
			const cond = api.getAttribute("cond");
			api.write(`if (${cond}) {`);
			api.renderChildren();
			if (api.node.related) api.renderChildren(api.node.related);
			api.write(`}`);
		},
	});
	kire.element({
		name: "kire:for",
		description:
			"Loop element that iterates arrays or objects and exposes item aliases to its children.",
		example:
			'<kire:for items="items" as="item" index="i">{{ item }}</kire:for>',
		attributes: [
			{
				name: "items",
				type: "javascript",
				description: "Collection expression to iterate.",
			},
			{
				name: "each",
				type: "javascript",
				description: "Alias of items for compatibility with loop-style APIs.",
			},
			{
				name: "as",
				type: "string",
				description: "Variable name used for the current item.",
			},
			{
				name: "index",
				type: "string",
				description: "Variable name used for the current index or key.",
			},
		],
		declares: [
			{ fromAttribute: "as", type: "any" },
			{ fromAttribute: "index", type: "number" },
			{ name: "$loop", type: "any" },
		],
		scope: (_args, attrs) => {
			const as = attrs?.as || "item";
			const indexAs = attrs?.index || "index";
			return [as, indexAs, "$loop"];
		},
		onCall: (api) => {
			const items =
				api.getAttribute("items") || api.getAttribute("each") || "[]";
			const as = api.getAttribute("as") || "item";
			const indexAs = api.getAttribute("index") || "index";
			const id = api.uid("i");
			const shouldExposeIndex =
				api.fullBody.includes(indexAs) || api.allIdentifiers.has(indexAs);
			const shouldExposeLoop =
				api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop");
			api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id})
                    ? _r${id}
                    : (_r${id} && typeof _r${id} === "object" ? Object.keys(_r${id}) : []);
                const _len${id} = _it${id}.length;
                let ${id} = 0;
                while (${id} < _len${id}) {
                    let ${as} = _it${id}[${id}];
                    ${shouldExposeIndex ? `let ${indexAs} = ${id};` : ""}
                    ${shouldExposeLoop ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
			api.renderChildren();
			api.write(`    ${id}++;
                }
            }`);
		},
	});
	kire.element({
		name: "kire:empty",
		description:
			"Empty-state branch used together with loop-oriented Kire elements.",
		example: "<kire:empty>No items</kire:empty>",
		onCall: (api) => {
			api.renderChildren();
		},
	});
	kire.element({
		name: "kire:switch",
		description:
			"Switch container for related <kire:case> and <kire:default> branches.",
		example:
			'<kire:switch value="status"><kire:case value="1">Draft</kire:case></kire:switch>',
		attributes: [
			{
				name: "value",
				type: "javascript",
				description: "Expression evaluated once and compared by nested cases.",
			},
		],
		onCall: (api) => {
			api.write(`switch (${api.getAttribute("value")}) {`);
			if (api.node.children) {
				const valid = api.node.children.filter(
					(n) =>
						n.type === "element" &&
						(n.tagName === "kire:case" || n.tagName === "kire:default"),
				);
				api.renderChildren(valid);
			}
			api.write(`}`);
		},
	});
	kire.element({
		name: "kire:case",
		description:
			"Case branch that matches the nearest parent <kire:switch> value.",
		example: '<kire:case value="1">Draft</kire:case>',
		attributes: [
			{
				name: "value",
				type: "javascript",
				description:
					"Case expression compared against the parent switch value.",
			},
		],
		onCall: (api) => {
			api.write(`case ${api.getAttribute("value")}: {`);
			api.renderChildren();
			api.write(`  break; }`);
		},
	});
	kire.element({
		name: "kire:default",
		description:
			"Fallback branch rendered when no sibling <kire:case> matches.",
		example: "<kire:default>Unknown</kire:default>",
		onCall: (api) => {
			api.write(`default: {`);
			api.renderChildren();
			api.write(`}`);
		},
	});
	kire.element({
		name: /^x-/,
		description:
			"Generic component element namespace. Use x-* tags to render registered Kire components and x-slot to define named slots.",
		example: `<x-card title="Dashboard">
  <x-slot:name>Header</x-slot:name>
  <p>Body</p>
</x-card>`,
		onCall: (api) => {
			const tagName = api.node.tagName;
			if (
				tagName === "x-slot" ||
				tagName.startsWith("x-slot:") ||
				tagName.startsWith("x-slot.")
			) {
				const inferred = tagName.slice("x-slot".length).replace(/^[:.]/, "");
				const attrs2 = api.node.attributes || new NullProtoObj();
				let nameExpr = inferred
					? JSON.stringify(inferred)
					: JSON.stringify("default");
				if (typeof attrs2.name === "string") {
					const raw = attrs2.name.trim();
					if (raw.startsWith("{") && raw.endsWith("}") && raw.length > 2) {
						nameExpr = raw.slice(1, -1);
					} else {
						nameExpr = JSON.stringify(raw);
					}
				}
				const id2 = api.uid("slot");
				api.write(`{
                    const _oldRes${id2} = $kire_response; $kire_response = "";`);
				api.renderChildren();
				api.write(`
                    if (typeof $slots !== 'undefined') $slots[${nameExpr}] = $kire_response;
                    $kire_response = _oldRes${id2};
                }`);
				return;
			}
			const componentName = tagName.slice(2);
			const hasComponentsNamespace = !!api.kire.$namespaces.components;
			const componentPath =
				hasComponentsNamespace && !componentName.startsWith("components.")
					? `components.${componentName}`
					: componentName;
			const id = api.uid("comp");
			const depId = api.depend(componentPath);
			const dep = api.getDependency(componentPath);
			const attrs = api.node.attributes || new NullProtoObj();
			const attrMeta = api.node.attributeMeta || new NullProtoObj();
			const hasChildren = Boolean(
				api.node.children && api.node.children.length > 0,
			);
			const propsStr = Object.keys(attrs)
				.map((k) => {
					const prop = toComponentPropExpression(
						api,
						k,
						attrs[k],
						!!attrMeta[k]?.quoted,
					);
					return `${JSON.stringify(prop.name)}: ${prop.expression}`;
				})
				.join(",");
			if (hasChildren) {
				api.write(`{
	                const $slots = new this.NullProtoObj();
	                const _oldRes${id} = $kire_response; $kire_response = "";`);
			} else {
				api.write(`{`);
			}
			if (api.node.children) {
				const slots = api.node.children.filter((c) => c.tagName === "x-slot");
				const defContent = api.node.children.filter(
					(c) => c.tagName !== "x-slot",
				);
				if (hasChildren) {
					api.renderChildren(slots);
				}
				const hasRealContent = defContent.some(
					(c) => c.type !== "text" || c.content?.trim(),
				);
				if (hasChildren && hasRealContent) {
					const defId = api.uid("def");
					api.write(
						`{ const _defRes${defId} = $kire_response; $kire_response = "";`,
					);
					api.renderChildren(defContent);
					api.write(
						`$slots.default = $kire_response.trim(); $kire_response = _defRes${defId}; }`,
					);
				}
			}
			api.write(`
	                ${hasChildren ? `$kire_response = _oldRes${id};` : ""}
	                const _oldProps${id} = $props;
	                $props = Object.assign(Object.create($globals), _oldProps${id}, { ${propsStr} }${hasChildren ? ", { slots: $slots }" : ""});
	                
	                const res${id} = ${depId}.call(this, $props, $globals, ${depId});
                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}
                
                $props = _oldProps${id};
            }`);
		},
	});
};

// ../core/src/type-declare.ts
var type_declare_default = (kire) => {
	kire.kireSchema({
		name: "kire",
		description: "Core Kire runtime types and template globals.",
		author: "Drysius",
		version: "0.1.2",
		repository: "https://github.com/drysius/kire",
	});
	kire.type({
		variable: "kire",
		type: "global",
		comment: "The Kire template engine instance.",
		tstype: "import('kire').Kire",
	});
	kire.type({
		variable: "$kire",
		type: "context",
		comment: "The Kire template engine instance (context alias).",
		tstype: "import('kire').Kire",
	});
	kire.type({
		variable: "$props",
		type: "context",
		comment: "Local variables passed to the template.",
		tstype: "Record<string, any>",
	});
	kire.type({
		variable: "it",
		type: "context",
		comment: "Reference to the local variables (props). Alias for $props.",
		tstype: "Record<string, any>",
	});
	kire.type({
		variable: "$globals",
		type: "context",
		comment: "Global variables accessible in all templates.",
		tstype: "Record<string, any>",
	});
	kire.type({
		variable: "$kire_response",
		type: "context",
		comment: "The output buffer string. Can be modified directly.",
		tstype: "string",
	});
	kire.type({
		variable: "$escape",
		type: "context",
		comment: "Function to escape HTML content.",
		tstype: "(v: any) => string",
	});
};

// ../core/src/directives/component.ts
var normalizeSlotNameExpression = (value, fallback = '"default"') => {
	if (value === undefined || value === null || value === "") return fallback;
	if (typeof value !== "string") return JSON.stringify(String(value));
	const trimmed = value.trim();
	if (QUOTED_STR_CHECK_REGEX.test(trimmed) && /^(['"]).*\1$/.test(trimmed)) {
		return JSON.stringify(trimmed.slice(1, -1));
	}
	return `String(${trimmed})`;
};
var component_default = (kire) => {
	kire.directive({
		name: `slot`,
		signature: [`name:string`],
		children: true,
		description:
			"Captures a named slot block that will be exposed to the parent component render.",
		example: `@slot("header")
  <h1>Dashboard</h1>
@end`,
		onCall: (api) => {
			const nameExpr = normalizeSlotNameExpression(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const id = api.uid("slot");
			api.write(`{ const _oldRes${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
                const _slotName${id} = ${nameExpr};
                if (typeof $slots !== 'undefined') $slots[_slotName${id}] = $kire_response;
                $kire_response = _oldRes${id};
            }`);
		},
	});
	kire.directive({
		name: `yield`,
		signature: [`name:string`, `default:string`],
		children: false,
		description:
			"Outputs a named slot from the current component, falling back to the default value when missing.",
		example: `@yield("header", "<h1>Fallback</h1>")`,
		onCall: (api) => {
			const nameExpr = normalizeSlotNameExpression(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const def = api.getArgument(1) || api.getAttribute("default");
			api.write(`{
                const _slotName = ${nameExpr};
                const content = ($props.slots && $props.slots[_slotName]);
                if (content) {
                    $kire_response += content;
                } else {
                    $kire_response += ${def || "''"};
                }
            }`);
		},
	});
	kire.directive({
		name: "component",
		signature: ["path:string", "locals:object"],
		children: true,
		description:
			"Renders another Kire view as a component and exposes nested @slot blocks to it.",
		example: `@component("layouts.app", { title: "Dashboard" })
  @slot("header")
    <h1>Dashboard</h1>
  @end
@end`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => {
			const rawPath = api.getArgument(0) || api.getAttribute("path");
			const locals =
				api.getArgument(1) ||
				api.getAttribute("locals") ||
				"new this.NullProtoObj()";
			const id = api.uid("comp");
			const depId = api.depend(rawPath);
			const dep = api.getDependency(rawPath);
			api.write(`{
                const $slots = new this.NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
	                if (!$slots.default) $slots.default = $kire_response;
	                $kire_response = _oldRes${id};
	                const _oldProps${id} = $props;
	                $props = Object.assign(Object.create($globals), _oldProps${id}, ${locals}, { slots: $slots });
	                
	                const res${id} = ${depId}.call(this, $props, $globals, ${depId});
	                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}

	                $props = _oldProps${id};
	            }`);
		},
	});
	kire.directive({
		name: "layout",
		signature: ["path:string", "locals:object"],
		children: true,
		description:
			"Alias for @component(path, locals?). Commonly used for page layouts.",
		example: `@layout("layouts.app")
  @section("content")
    <p>Hello</p>
  @end
@end`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => kire.getDirective("component")?.onCall(api),
	});
	kire.directive({
		name: "extends",
		signature: ["path:string", "locals:object"],
		children: true,
		description:
			"Alias for @component(path, locals?). Mirrors Blade-style template inheritance naming.",
		example: `@extends("layouts.app")
  @section("content")
    <p>Hello</p>
  @end
@end`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => kire.getDirective("component")?.onCall(api),
	});
	kire.directive({
		name: "section",
		signature: ["name:string"],
		children: true,
		description:
			"Alias for @slot(name). Useful with @layout and @extends blocks.",
		example: `@section("content")
  <p>Hello</p>
@end`,
		onCall: (api) => kire.getDirective("slot")?.onCall(api),
	});
};

// ../core/src/directives/import.ts
var import_default = (kire) => {
	kire.directive({
		name: `include`,
		signature: [`path:string`, `locals:object`],
		children: false,
		description:
			"Includes another Kire view inline and optionally merges additional locals for that render.",
		example: `@include("partials.alert", { type: "success" })`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => {
			const rawPath = api.getArgument(0) || api.getAttribute("path");
			const locals =
				api.getArgument(1) ||
				api.getAttribute("locals") ||
				"new this.NullProtoObj()";
			if (!rawPath) return;
			const depId = api.depend(rawPath);
			const dep = api.getDependency(rawPath);
			api.write(`{
                const _oldProps = $props;
                $props = Object.assign(Object.create($globals), _oldProps, ${locals});
                const res = ${depId}.call(this, $props, $globals, ${depId}); 
                ${dep.meta.async ? `$kire_response += await res;` : `$kire_response += res;`}
                $props = _oldProps;
            }`);
		},
	});
};

// ../core/src/directives/layout.ts
var normalizeStackNameLiteral = (value, fallback = "") => {
	if (value === undefined || value === null || value === "") return fallback;
	if (typeof value !== "string") return String(value);
	const trimmed = value.trim();
	if (QUOTED_STR_CHECK_REGEX.test(trimmed) && /^(['"]).*\1$/.test(trimmed)) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
};
var layout_default = (kire) => {
	kire.existVar(
		"__kire_stack",
		(api) => {
			api.prologue(
				`${api.editable ? "let" : "const"} __kire_stack = new this.NullProtoObj;`,
			);
			api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:stack\\(.*?\\) -->/g, "");
            }
        `);
		},
		true,
	);
	kire.existVar(
		"__kire_defines",
		(api) => {
			api.prologue(
				`${api.editable ? "let" : "const"} __kire_defines = new this.NullProtoObj;`,
			);
			if (!api.isDependency) {
				api.epilogue(`
	            if (typeof $kire_response === 'string') {
	                $kire_response = $kire_response.replace(/<!-- KIRE:defined\\((.*?)\\) -->([\\s\\S]*?)<!-- KIRE:enddefined -->/g, (match, name, fallback) => {
	                    return (__kire_defines && __kire_defines[name] !== undefined) ? __kire_defines[name] : fallback;
	                });
	            }
	        `);
			}
		},
		true,
	);
	kire.directive({
		name: `define`,
		signature: [`name:string`],
		children: true,
		description:
			"Captures a reusable named content fragment that can later be resolved by @defined.",
		example: `@define("hero")
  <h1>Hero</h1>
@end`,
		onCall: (api) => {
			const id = api.uid("def");
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			api.write(`{ const _origRes${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
                __kire_defines[${nameCode}] = $kire_response;
                $kire_response = _origRes${id};
            }`);
		},
	});
	kire.directive({
		name: `defined`,
		signature: [`name:string`],
		children: `auto`,
		description:
			"Outputs a previously defined fragment or renders its inline fallback block when missing.",
		example: `@defined("hero")
  <h1>Fallback</h1>
@enddefined`,
		onCall: (api) => {
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			api.write(
				`$kire_response += "<!-- KIRE:defined(" + ${nameCode} + ") -->";`,
			);
			if (api.node.children && api.node.children.length > 0) {
				api.renderChildren();
			}
			api.write(`$kire_response += "<!-- KIRE:enddefined -->";`);
		},
	});
	kire.directive({
		name: `stack`,
		signature: [`name:string`],
		children: false,
		description:
			"Injects the rendered contents that were pushed into a named stack.",
		example: `@stack("scripts")`,
		onCall: (api) => {
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			const placeholderCode = JSON.stringify(`<!-- KIRE:stack(${name}) -->`);
			api.write(`$kire_response += ${placeholderCode};`);
			const phId = api.uid("ph");
			api.epilogue(`
                if (typeof __kire_stack !== 'undefined' && __kire_stack[${nameCode}]) {
                    const _placeholder${phId} = ${placeholderCode};
                    $kire_response = $kire_response.split(_placeholder${phId}).join(__kire_stack[${nameCode}].join("\\n"));
                }
            `);
		},
	});
	kire.directive({
		name: `push`,
		signature: [`name:string`],
		children: true,
		description:
			"Appends the current block to a named stack that can later be rendered with @stack.",
		example: `@push("scripts")
  <script src="/app.js"></script>
@end`,
		onCall: (api) => {
			const id = api.uid("push");
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			api.write(`{
                if (!__kire_stack[${nameCode}]) __kire_stack[${nameCode}] = [];
                const __kire_${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
                __kire_stack[${nameCode}].push($kire_response);
                $kire_response = __kire_${id};
            }`);
		},
	});
};

// ../core/src/directives/natives/attributes.ts
var attributes_default = (kire) => {
	kire.directive({
		name: `attr`,
		signature: [`name:string`, `value:any`],
		description:
			"Appends a single HTML attribute when the value is not null, undefined or false.",
		example: `@attr("data-id", item.id)`,
		onCall(api) {
			const name = api.getArgument(0) ?? api.getAttribute("name");
			const value = api.getArgument(1) ?? api.getAttribute("value");
			api.write(`{
                const $name = ${name};
                const $value = ${value};
                if ($name && $value !== false && $value !== null && $value !== undefined) {
                    if ($value === true) $kire_response += " " + $name;
                    else $kire_response += " " + $name + "=\\"" + $escape($value) + "\\"";
                }
            }`);
		},
	});
	kire.directive({
		name: `attrs`,
		signature: [`attributes:any`],
		description:
			"Appends many HTML attributes from an object, array or string shorthand.",
		example: `@attrs({ class: "btn", disabled: isSaving })`,
		onCall(api) {
			const attributes =
				api.getArgument(0) ??
				api.getAttribute("attributes") ??
				api.getAttribute("attrs");
			api.write(`{
                const $attrs = ${attributes};
                const $append = ($name, $value) => {
                    const $clean = String($name || "").trim();
                    if (!$clean || $value === false || $value === null || $value === undefined) return;
                    if ($value === true) $kire_response += " " + $clean;
                    else $kire_response += " " + $clean + "=\\"" + $escape($value) + "\\"";
                };
                const $walk = ($value) => {
                    if (!$value) return;
                    if (typeof $value === "string") {
                        $append($value, true);
                        return;
                    }
                    if (Array.isArray($value)) {
                        for (let $i = 0; $i < $value.length; $i++) $walk($value[$i]);
                        return;
                    }
                    if (typeof $value === "object") {
                        for (const [$name, $entry] of Object.entries($value)) {
                            $append($name, $entry);
                        }
                    }
                };
                $walk($attrs);
            }`);
		},
	});
	kire.directive({
		name: `class`,
		signature: [`classes:any`],
		description:
			"Builds a `class` attribute from strings, arrays or keyed objects.",
		example: `@class(["btn", { "btn-primary": isPrimary }])`,
		onCall(api) {
			const classes = api.getArgument(0) ?? api.getAttribute("classes");
			api.write(`{
                const $input = ${classes};
                const $tokens = [];
                const $push = ($value) => {
                    if (!$value) return;
                    if (typeof $value === "string") {
                        const $trimmed = $value.trim();
                        if ($trimmed) $tokens.push($trimmed);
                        return;
                    }
                    if (Array.isArray($value)) {
                        for (let $i = 0; $i < $value.length; $i++) $push($value[$i]);
                        return;
                    }
                    if (typeof $value === "object") {
                        for (const [$name, $enabled] of Object.entries($value)) {
                            if ($enabled) $tokens.push($name);
                        }
                        return;
                    }
                    const $string = String($value || "").trim();
                    if ($string) $tokens.push($string);
                };
                $push($input);
                const $classValue = $tokens.join(" ").trim();
                if ($classValue) $kire_response += " class=\\"" + $escape($classValue) + "\\"";
            }`);
		},
	});
	kire.directive({
		name: `style`,
		signature: [`styles:any`],
		description:
			"Builds a `style` attribute from strings, arrays or keyed objects.",
		example: `@style({ color: accent, display: isOpen && "block" })`,
		onCall(api) {
			const styles = api.getArgument(0) ?? api.getAttribute("styles");
			api.write(`{
                const $s = ${styles};
                let $r = "";
                if (Array.isArray($s)) $r = $s.filter(Boolean).join("; ");
                else if (typeof $s === 'object' && $s !== null) $r = Object.entries($s).filter(([_, v]) => v).map(([k, v]) => v === true ? k : k + ": " + v).join("; ");
                else $r = String($s || "");
                if ($r) $kire_response += " style=\\"" + $escape($r) + "\\"";
            }`);
		},
	});
	const booleanAttrs = [
		"checked",
		"selected",
		"disabled",
		"readonly",
		"required",
	];
	for (const attr of booleanAttrs) {
		kire.directive({
			name: attr,
			signature: [`cond:any`],
			description: `Outputs the boolean attribute \`${attr}\` when the condition is truthy.`,
			example: `@${attr}(condition)`,
			onCall(api) {
				const cond = api.getArgument(0) ?? api.getAttribute("cond");
				api.write(`if (${cond}) $kire_response += ' ${attr} ';`);
			},
		});
	}
};

// ../core/src/directives/natives/checks.ts
var checks_default = (kire) => {
	kire.directive({
		name: `isset`,
		signature: [`expr:any`],
		children: true,
		closeBy: [`endisset`, `end`],
		description:
			"Renders the block only when the expression is defined and not null.",
		example: `@isset(user.avatar)
  <img src="{{ user.avatar }}">
@end`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr");
			api.write(
				`if (typeof ${api.transform(expr)} !== 'undefined' && ${api.transform(expr)} !== null) {`,
			);
			api.renderChildren();
			api.write(`}`);
		},
	});
	kire.directive({
		name: `empty`,
		signature: [`expr:any`],
		children: true,
		relatedTo: [`for`, `each`],
		closeBy: [`endempty`, `endfor`, `endeach`, `end`],
		description:
			"Fallback branch for empty collections or falsy values, often used alongside @for or @each.",
		example: `@empty(items)
  <p>No items</p>
@end`,
		onCall: (api) => {
			const expr = api.getArgument(0) || api.getAttribute("expr");
			if (!expr) {
				api.renderChildren();
				return;
			}
			api.write(
				`if (!${api.transform(expr)} || (Array.isArray(${api.transform(expr)}) && ${api.transform(expr)}.length === 0)) {`,
			);
			api.renderChildren();
			api.write(`}`);
		},
	});
};

// ../core/src/directives/natives/if.ts
var if_default = (kire) => {
	const elseDirective = {
		name: `else`,
		children: true,
		relatedTo: [`if`, `elseif`, `unless`],
		closeBy: [`endif`, `endunless`],
		description: "Fallback branch for @if, @elseif and @unless chains.",
		example: `@else
  <p>Fallback</p>`,
		onCall: (api) => {
			api.write(`} else {`);
			api.renderChildren();
		},
	};
	kire.directive({
		name: `if`,
		signature: [`cond:any`],
		children: true,
		relatedTo: [],
		description:
			"Renders the block only when the expression evaluates to a truthy value.",
		example: `@if(user)
  <p>Hello {{ user.name }}</p>
@end`,
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			api.write(`if (${cond}) {`);
			api.renderChildren();
			if (api.node.related && api.node.related.length > 0) {
				api.renderChildren(api.node.related);
			}
			api.write(`}`);
		},
	});
	kire.directive({
		...elseDirective,
		name: `elseif`,
		signature: [`cond:any`],
		description: "Additional conditional branch for an @if or @unless chain.",
		example: `@elseif(user.isAdmin)
  <p>Admin</p>`,
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			api.write(`} else if (${cond}) {`);
			api.renderChildren();
		},
	});
	kire.directive({
		name: `unless`,
		signature: [`cond:any`],
		children: true,
		description:
			"Inverse of @if. Renders the block when the expression is falsy.",
		example: `@unless(user)
  <a href="/login">Login</a>
@end`,
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			api.write(`if (!(${cond})) {`);
			api.renderChildren();
			if (api.node.related && api.node.related.length > 0) {
				api.renderChildren(api.node.related);
			}
			api.write(`}`);
		},
	});
	kire.directive(elseDirective);
};

// ../core/src/directives/natives/loop.ts
var loop_default = (kire) => {
	kire.directive({
		name: `for`,
		signature: [`expr:any`],
		declares: [
			{
				fromArg: 0,
				pattern: "($item, $index) of $source",
				capture: ["item", "index"],
				type: "any",
			},
			{
				fromArg: 0,
				pattern: "($item, $index) in $source",
				capture: ["item", "index"],
				type: "any",
			},
			{ fromArg: 0, pattern: "$item of $source", capture: "item", type: "any" },
			{ fromArg: 0, pattern: "$item in $source", capture: "item", type: "any" },
			{ name: "$loop", type: "any" },
		],
		children: true,
		description:
			"Iterates arrays or objects using `item of source` or `(item, index) in source` syntax.",
		example: `@for(todo of todos)
  <li>{{ todo.title }}</li>
@end`,
		scope: (args) => {
			const rawExpr = args[0] || "[]";
			const loopMatch = rawExpr.match(
				/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/,
			);
			if (loopMatch) {
				if (loopMatch[1])
					return [loopMatch[2].trim(), loopMatch[3].trim(), "$loop"];
				return [loopMatch[4].trim(), "index", "$loop"];
			}
			return ["item", "index", "$loop"];
		},
		onCall: (api) => {
			const rawExpr = api.getArgument(0) || api.getAttribute("expr") || "[]";
			const id = api.uid("i");
			const relatedNodes = api.node.related || [];
			const hasEmptyBranch = relatedNodes.some((n) => n?.name === "empty");
			let items = rawExpr;
			let finalAs = "item";
			let finalIndex = "index";
			const loopMatch = rawExpr.match(
				/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/,
			);
			if (loopMatch) {
				if (loopMatch[1]) {
					finalAs = loopMatch[2].trim();
					finalIndex = loopMatch[3].trim();
				} else {
					finalAs = loopMatch[4].trim();
				}
				items = loopMatch[5].trim();
			}
			const shouldExposeIndex =
				api.fullBody.includes(finalIndex) || api.allIdentifiers.has(finalIndex);
			const shouldExposeLoop =
				api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop");
			api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id})
                    ? _r${id}
                    : (_r${id} && typeof _r${id} === "object" ? Object.keys(_r${id}) : []);
                const _len${id} = _it${id}.length;
                if (_len${id} > 0) {
                    let ${id} = 0;
                    while (${id} < _len${id}) {
                        let ${finalAs} = _it${id}[${id}];
                        ${shouldExposeIndex ? `let ${finalIndex} = ${id};` : ""}
                        ${shouldExposeLoop ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
			api.renderChildren();
			api.write(`
                        ${id}++;
                    }
                }`);
			if (hasEmptyBranch) {
				api.write(` else {`);
				api.renderChildren(relatedNodes);
				api.write(`}`);
			}
			api.write(`
            }`);
		},
	});
	kire.directive({
		name: `each`,
		signature: [`items:any`, `as:string`],
		declares: [
			{ fromArg: 1, type: "any" },
			{ name: "index", type: "number" },
			{ name: "$loop", type: "any" },
		],
		children: true,
		description:
			"Iterates over a collection and exposes the current item under a chosen variable name.",
		example: `@each(todos, "todo")
  <li>{{ todo.title }}</li>
@end`,
		scope: (args) => {
			const _items = args[0] || "[]";
			const as = args[1] || "item";
			return [as, "index", "$loop"];
		},
		onCall: (api) => {
			const forDir = kire.getDirective("for");
			if (forDir) forDir.onCall(api);
		},
	});
};

// ../core/src/directives/natives/misc.ts
var misc_default = (kire) => {
	kire.directive({
		name: "interface",
		signature: ["shape_or_type:object|string", "global:boolean"],
		children: false,
		description:
			"Type-only directive for tooling. Does not render output. Use @interface(Type) for local typing or @interface({ user: Type }, true) for workspace-global typing in editors.",
		example: `@interface({ user: AppUser, posts: Post[] }, true)`,
		onCall: () => {},
	});
	kire.directive({
		name: `once`,
		children: true,
		description:
			"Ensures the wrapped block is rendered only once per render cycle.",
		example: `@once
  <script src="/app.js"></script>
@end`,
		onCall: (api) => {
			const id = api.uid("once");
			api.write(`if (!$globals['~once']) $globals['~once'] = new Set();`);
			api.write(`if (!$globals['~once'].has('${id}')) { 
                $globals['~once'].add('${id}');`);
			api.renderChildren();
			api.write(`}`);
		},
	});
	kire.directive({
		name: `error`,
		signature: [`field:string`],
		declares: [
			{
				name: "$message",
				type: "string",
				description:
					"Validation message exposed inside the current @error block.",
			},
		],
		children: true,
		closeBy: [`enderror`, `end`],
		description:
			"Renders the block when the selected field has a validation error and exposes `$message` inside it.",
		example: `@error("email")
  <span class="error">{{ $message }}</span>
@end`,
		scope: () => [`$message`],
		onCall: (api) => {
			const field = api.getArgument(0) ?? api.getAttribute("field");
			api.write(`if ($props.errors && $props.errors[${field}]) {
                $message = $props.errors[${field}];`);
			api.renderChildren();
			api.write(`}`);
		},
	});
	kire.directive({
		name: `csrf`,
		children: false,
		description:
			"Outputs a hidden CSRF token input using the global `csrf` value.",
		example: `@csrf()`,
		onCall: (api) => {
			api.write(`
                if (typeof $globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $kire_response += \`<input type="hidden" name="_token" value="\${$globals.csrf}">\`;
            `);
		},
	});
	kire.directive({
		name: `method`,
		signature: [`method:string`],
		children: false,
		description:
			"Outputs a hidden `_method` input for HTTP verb spoofing in forms.",
		example: `@method("PUT")`,
		onCall: (api) => {
			const method = api.getArgument(0) ?? api.getAttribute("method");
			api.write(
				`$kire_response += '<input type="hidden" name="_method" value="' + $escape(${method}) + '">';`,
			);
		},
	});
	kire.directive({
		name: `const`,
		signature: [`expr:string`],
		declares: [
			{
				fromArg: 0,
				pattern: "$name = $value",
				capture: "name",
				type: "any",
				description: "Constant declared by @const.",
			},
		],
		children: false,
		description:
			"Declares a constant expression that becomes available to later template expressions.",
		example: `@const(title = "Dashboard")`,
		scope: (args) => {
			const expr = args[0] || "";
			const first = expr.split("=")[0];
			return first ? [first.trim()] : [];
		},
		onCall: (api) => {
			api.write(`${api.getArgument(0) ?? api.getAttribute("expr")};`);
		},
	});
	kire.directive({
		name: `let`,
		signature: [`expr:string`],
		declares: [
			{
				fromArg: 0,
				pattern: "$name = $value",
				capture: "name",
				type: "any",
				description: "Variable declared by @let.",
			},
		],
		children: false,
		description:
			"Declares a mutable variable expression that becomes available to later template expressions.",
		example: `@let(count = items.length)`,
		scope: (args) => {
			const expr = args[0] || "";
			const first = expr.split("=")[0];
			return first ? [first.trim()] : [];
		},
		onCall: (api) => {
			api.write(`${api.getArgument(0) ?? api.getAttribute("expr")};`);
		},
	});
};

// ../core/src/directives/natives/switch.ts
var switch_default = (kire) => {
	kire.directive({
		name: `switch`,
		signature: [`expr:any`],
		children: true,
		description:
			"Starts a switch block that can contain @case and @default branches.",
		example: `@switch(status)
  @case("ok") OK
  @default Unknown
@end`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr");
			api.write(`switch (${api.transform(expr)}) {`);
			if (api.node.related) {
				api.renderChildren(api.node.related);
			}
			api.write(`}`);
		},
	});
	kire.directive({
		name: `case`,
		signature: [`val:any`],
		children: true,
		relatedTo: [`switch`, `case`, `default`],
		description: "Matches a value inside the current @switch chain.",
		example: `@case("ok")
  <span>OK</span>`,
		onCall: (api) => {
			const val = api.getArgument(0) ?? api.getAttribute("val");
			api.write(`case ${api.transform(val)}: {`);
			api.renderChildren();
			api.write(`  break; }`);
		},
	});
	kire.directive({
		name: `default`,
		children: true,
		relatedTo: [`switch`, `case`, `default`],
		description:
			"Fallback branch used when no @case in the current @switch matches.",
		example: `@default
  <span>Unknown</span>`,
		onCall: (api) => {
			api.write(`default: {`);
			api.renderChildren();
			api.write(`}`);
		},
	});
};

// ../core/src/directives/natives/index.ts
var natives_default2 = (kire) => {
	kire.kireSchema({
		name: "kire-core",
		description:
			"Built-in directives and control-flow primitives shipped with the Kire runtime.",
		author: "Drysius",
		repository: "https://github.com/drysius/kire",
		version: "0.1.2",
	});
	if_default(kire);
	loop_default(kire);
	checks_default(kire);
	attributes_default(kire);
	switch_default(kire);
	misc_default(kire);
};

// ../core/src/directives/natives.ts
var natives_default3 = (kire) => {
	natives_default2(kire);
};

// ../core/src/directives/index.ts
var KireDirectives = {
	name: "@kirejs/core",
	sort: 100,
	load(kire) {
		type_declare_default(kire);
		layout_default(kire);
		natives_default3(kire);
		import_default(kire);
		component_default(kire);
		natives_default(kire);
	},
};

// ../core/src/lexer.ts
class Lexer {
	template;
	kire;
	cursor = 0;
	line = 1;
	column = 1;
	stack = [];
	root = [];
	constructor(template, kire) {
		this.template = template;
		this.kire = kire;
	}
	parse() {
		this.cursor = 0;
		this.line = 1;
		this.column = 1;
		this.stack = [];
		this.root = [];
		const len = this.template.length;
		while (this.cursor < len) {
			const char = this.template[this.cursor];
			if (char === "{" && this.template[this.cursor + 1] === "{") {
				if (this.checkComment()) continue;
				if (this.checkInterpolation()) continue;
			}
			if (char === "@") {
				if (this.checkEscapedInterpolation()) continue;
				if (this.checkEscaped("@")) continue;
				if (this.checkDirective()) continue;
			}
			if (char === "<") {
				if (this.checkJavascript()) continue;
				if (this.checkElement()) continue;
				if (this.checkClosingTag()) continue;
			}
			this.parseText();
		}
		return this.root;
	}
	advance(n) {
		for (let i = 0; i < n; i++) {
			if (
				this.template[this.cursor + i] ===
				`
`
			) {
				this.line++;
				this.column = 1;
			} else {
				this.column++;
			}
		}
		this.cursor += n;
	}
	getLoc() {
		return { line: this.line, column: this.column };
	}
	addNode(node) {
		const parent = this.stack[this.stack.length - 1];
		if (parent) {
			if (!parent.children) parent.children = [];
			parent.children.push(node);
		} else {
			this.root.push(node);
		}
	}
	checkEscapedInterpolation() {
		if (this.template.startsWith("@{{{", this.cursor)) {
			this.addNode({ type: "text", content: "{{{", loc: this.getLoc() });
			this.advance(4);
			return true;
		}
		if (this.template.startsWith("@{{", this.cursor)) {
			this.addNode({ type: "text", content: "{{", loc: this.getLoc() });
			this.advance(3);
			return true;
		}
		return false;
	}
	checkComment() {
		if (this.template.startsWith("{{--", this.cursor)) {
			const end = this.template.indexOf("--}}", this.cursor + 4);
			if (end !== -1) {
				this.advance(end + 4 - this.cursor);
				return true;
			}
		}
		return false;
	}
	checkInterpolation() {
		const loc = this.getLoc();
		const isRaw = this.template.startsWith("{{{", this.cursor);
		const open = isRaw ? "{{{" : "{{";
		const close = isRaw ? "}}}" : "}}";
		const end = this.findInterpolationEnd(this.cursor + open.length, close);
		if (end !== -1) {
			const content = this.template
				.slice(this.cursor + open.length, end)
				.trim();
			this.addNode({ type: "interpolation", content, raw: isRaw, loc });
			this.advance(end + close.length - this.cursor);
			return true;
		}
		return false;
	}
	checkDirective() {
		const loc = this.getLoc();
		const slice = this.template.slice(this.cursor);
		const match = slice.match(DIRECTIVE_NAME_REGEX);
		if (!match) return false;
		const rawName = match[1];
		const registered = this.kire.$directives.records;
		if (this.stack.length > 0) {
			for (let i = this.stack.length - 1; i >= 0; i--) {
				const node2 = this.stack[i];
				const def2 = registered[node2.name];
				let shouldPop = false;
				if (def2?.closeBy) {
					const closeBy = Array.isArray(def2.closeBy)
						? def2.closeBy
						: [def2.closeBy];
					if (closeBy.includes(rawName)) shouldPop = true;
				}
				if (!shouldPop) {
					if (rawName === "end") {
						shouldPop = true;
					} else if (node2.type === "directive") {
						const expectedEnd = `end${node2.name}`;
						if (rawName === expectedEnd) {
							shouldPop = true;
						}
					}
				}
				if (shouldPop) {
					this.stack.splice(i);
					this.advance(rawName.length + 1);
					return true;
				}
			}
		}
		let matchedName = "";
		if (registered[rawName]) {
			matchedName = rawName;
		} else {
			const m = rawName.match(this.kire.$directivesPattern);
			if (m && m.index === 0) {
				const candidate = m[0];
				if (candidate !== rawName && registered[candidate]) {
					const nextAfterCandidate =
						this.template[this.cursor + 1 + candidate.length];
					const hasCallArgs = nextAfterCandidate === "(";
					let allowPrefixInScope = false;
					const current = this.stack[this.stack.length - 1];
					if (current) {
						const candidateDef = registered[candidate];
						if (candidateDef.relatedTo?.includes(current.name)) {
							allowPrefixInScope = true;
						} else {
							const currentDef = registered[current.name];
							if (currentDef?.closeBy) {
								const closeBy = Array.isArray(currentDef.closeBy)
									? currentDef.closeBy
									: [currentDef.closeBy];
								allowPrefixInScope = closeBy.includes(candidate);
							}
						}
					}
					if (hasCallArgs || allowPrefixInScope) {
						matchedName = candidate;
					}
				}
			}
		}
		if (!matchedName) {
			if (this.template[this.cursor + 1] === "{") return false;
			this.advance(rawName.length + 1);
			this.addNode({
				type: "directive",
				name: rawName,
				args: [],
				children: [],
				loc,
			});
			return true;
		}
		const name = matchedName;
		const def = registered[name];
		this.advance(name.length + 1);
		let args = [];
		if (this.template[this.cursor] === "(") {
			const res = this.extractBracketedContent("(", ")");
			if (res) {
				args = this.parseArgs(res.content);
				this.advance(res.fullLength);
			}
		}
		const node = { type: "directive", name, args, children: [], loc };
		if (this.stack.length > 0) {
			const current = this.stack[this.stack.length - 1];
			if (def.relatedTo?.includes(current.name)) {
				let rootNode = current;
				let rootIdx = this.stack.length - 1;
				while (rootIdx > 0) {
					const candidate = this.stack[rootIdx];
					const parent = this.stack[rootIdx - 1];
					const candDef = registered[candidate.name];
					if (candDef?.relatedTo?.includes(parent.name)) {
						rootIdx--;
						rootNode = this.stack[rootIdx];
					} else {
						break;
					}
				}
				if (!rootNode.related) rootNode.related = [];
				rootNode.related.push(node);
				while (this.stack[this.stack.length - 1] !== rootNode) {
					this.stack.pop();
				}
				if (
					def.children === true ||
					(def.children === "auto" &&
						this.hasExplicitDirectiveEnd(name, this.cursor))
				) {
					this.stack.push(node);
				}
				return true;
			}
		}
		this.addNode(node);
		if (
			def.children === true ||
			(def.children === "auto" &&
				this.hasExplicitDirectiveEnd(name, this.cursor))
		) {
			this.stack.push(node);
		}
		return true;
	}
	checkElement() {
		const loc = this.getLoc();
		const slice = this.template.slice(this.cursor);
		const match = slice.match(TAG_OPEN_REGEX);
		if (!match) return false;
		const tagName = match[1];
		const isLetter = /^[a-zA-Z]/.test(tagName);
		if (!isLetter && !this.kire.$elementsPattern.test(tagName)) return false;
		this.advance(match[0].length);
		const { attrs: attributes, meta: attributeMeta } =
			this.parseAttributesState();
		let selfClosing = false;
		while (
			this.cursor < this.template.length &&
			WHITESPACE_REGEX.test(this.template[this.cursor])
		)
			this.advance(1);
		if (this.template[this.cursor] === "/") {
			selfClosing = true;
			this.advance(1);
		}
		if (this.template[this.cursor] === ">") this.advance(1);
		const node = {
			type: "element",
			name: tagName,
			tagName,
			attributes,
			attributeMeta,
			void: selfClosing,
			children: [],
			loc,
		};
		let def = null;
		for (const m of this.kire.$elementMatchers) {
			const d = m.def;
			if (typeof d.name === "string") {
				if (d.name === tagName) {
					def = d;
					break;
				}
				if (d.name.includes("*")) {
					const p = d.name.replace("*", "(.*)");
					const m2 = tagName.match(new RegExp(`^${p}$`));
					if (m2) {
						node.wildcard = m2[1];
						def = d;
						break;
					}
				}
			} else if (d.name instanceof RegExp && d.name.test(tagName)) {
				def = d;
				break;
			}
		}
		if (!selfClosing && def?.raw) {
			const closeTag = `</${tagName}>`;
			const endIdx = this.template.indexOf(closeTag, this.cursor);
			if (endIdx !== -1) {
				const content = this.template.slice(this.cursor, endIdx);
				const innerParser = new Lexer(content, this.kire);
				innerParser.line = this.line;
				innerParser.column = this.column;
				node.children = innerParser.parse();
				this.addNode(node);
				this.advance(content.length + closeTag.length);
				return true;
			}
		}
		const current = this.stack[this.stack.length - 1];
		const siblings = current ? current.children || [] : this.root;
		let lastIdx = siblings.length - 1;
		while (
			lastIdx >= 0 &&
			siblings[lastIdx].type === "text" &&
			!siblings[lastIdx].content?.trim()
		) {
			lastIdx--;
		}
		const lastSibling = siblings[lastIdx];
		const lastSiblingTag = lastSibling?.tagName;
		const isRelated = lastSiblingTag
			? !!def?.relatedTo?.includes(lastSiblingTag)
			: false;
		if (lastSibling && isRelated) {
			if (!lastSibling.related) lastSibling.related = [];
			lastSibling.related.push(node);
			if (!node.void) this.stack.push(node);
			return true;
		}
		this.addNode(node);
		if (!node.void) this.stack.push(node);
		return true;
	}
	parseAttributesState() {
		const attrs = new NullProtoObj();
		const meta = new NullProtoObj();
		while (this.cursor < this.template.length) {
			while (
				this.cursor < this.template.length &&
				WHITESPACE_REGEX.test(this.template[this.cursor])
			)
				this.advance(1);
			const char = this.template[this.cursor];
			if (char === ">" || char === "/" || !char) break;
			let name = "";
			while (
				this.cursor < this.template.length &&
				!ATTR_NAME_BREAK_REGEX.test(this.template[this.cursor])
			) {
				name += this.template[this.cursor];
				this.advance(1);
			}
			if (!name) break;
			let value = "true";
			let quoted = false;
			let quote;
			if (this.template[this.cursor] === "(") {
				const res = this.extractBracketedContent("(", ")");
				if (res) {
					value = res.content;
					this.advance(res.fullLength);
				}
			} else if (this.template[this.cursor] === "=") {
				this.advance(1);
				const first = this.template[this.cursor];
				if (first === '"' || first === "'") {
					quoted = true;
					quote = first;
					this.advance(1);
					value = this.captureQuotedValue(first);
					if (this.template[this.cursor] === first) this.advance(1);
				} else {
					value = this.captureBalancedValue();
				}
			}
			attrs[name] = value;
			meta[name] = quoted ? { quoted: true, quote } : { quoted: false };
		}
		return { attrs, meta };
	}
	captureQuotedValue(quote) {
		let value = "";
		let escaped = false;
		while (this.cursor < this.template.length) {
			const char = this.template[this.cursor];
			if (escaped) {
				if (char === quote || char === "\\") {
					value += char;
				} else {
					value += `\\${char}`;
				}
				escaped = false;
				this.advance(1);
				continue;
			}
			if (char === "\\") {
				escaped = true;
				this.advance(1);
				continue;
			}
			if (char === quote) {
				break;
			}
			value += char;
			this.advance(1);
		}
		if (escaped) value += "\\";
		return value;
	}
	captureBalancedValue() {
		let val = "";
		let dPar = 0;
		let dBra = 0;
		let dCur = 0;
		let inQ = null;
		while (this.cursor < this.template.length) {
			const c = this.template[this.cursor];
			if (inQ) {
				if (c === inQ) inQ = null;
			} else {
				if (c === '"' || c === "'") inQ = c;
				else if (c === "(") dPar++;
				else if (c === ")") dPar--;
				else if (c === "[") dBra++;
				else if (c === "]") dBra--;
				else if (c === "{") dCur++;
				else if (c === "}") dCur--;
			}
			if (
				!inQ &&
				dPar === 0 &&
				dBra === 0 &&
				dCur === 0 &&
				(WHITESPACE_REGEX.test(c) || c === ">" || c === "/")
			)
				break;
			val += c;
			this.advance(1);
		}
		return val;
	}
	checkClosingTag() {
		const match = this.template.slice(this.cursor).match(TAG_CLOSE_REGEX);
		if (!match) return false;
		const tagName = match[1];
		const isLetter = /^[a-zA-Z]/.test(tagName);
		if (!isLetter && !this.kire.$elementsPattern.test(tagName)) return false;
		this.popStack(tagName);
		this.advance(match[0].length);
		return true;
	}
	checkJavascript() {
		const loc = this.getLoc();
		if (this.template.startsWith("<?js", this.cursor)) {
			const end = this.template.indexOf("?>", this.cursor + 4);
			if (end !== -1) {
				this.addNode({
					type: "js",
					content: this.template.slice(this.cursor + 4, end),
					loc,
				});
				this.advance(end + 2 - this.cursor);
				return true;
			}
		}
		return false;
	}
	checkEscaped(char) {
		const loc = this.getLoc();
		if (this.template.startsWith(`@${char}`, this.cursor)) {
			this.addNode({ type: "text", content: char, loc });
			this.advance(2);
			return true;
		}
		return false;
	}
	parseText() {
		const loc = this.getLoc();
		TEXT_SCAN_REGEX.lastIndex = this.cursor;
		const match = TEXT_SCAN_REGEX.exec(this.template);
		const end = match ? match.index : this.template.length;
		if (end > this.cursor) {
			this.addNode({
				type: "text",
				content: this.template.slice(this.cursor, end),
				loc,
			});
			this.advance(end - this.cursor);
		} else {
			this.addNode({ type: "text", content: this.template[this.cursor], loc });
			this.advance(1);
		}
	}
	popStack(name) {
		if (this.stack.length === 0) return;
		if (!name) {
			this.stack.pop();
			return;
		}
		for (let i = this.stack.length - 1; i >= 0; i--) {
			const n = this.stack[i];
			if (n.name === name || n.tagName === name) {
				this.stack.splice(i);
				break;
			}
		}
	}
	hasExplicitDirectiveEnd(name, fromCursor) {
		const def = this.kire.getDirective(name);
		if (!def?.closeBy) {
			const rest2 = this.template.slice(fromCursor);
			return (
				this.findUnescapedDirective(rest2, `end${name}`) !== -1 ||
				this.findUnescapedDirective(rest2, "end") !== -1
			);
		}
		const closeBy = Array.isArray(def.closeBy) ? def.closeBy : [def.closeBy];
		const rest = this.template.slice(fromCursor);
		for (const token of closeBy) {
			if (this.findUnescapedDirective(rest, token) !== -1) return true;
		}
		return false;
	}
	findUnescapedDirective(source, directiveName) {
		const token = `@${directiveName}`;
		let idx = source.indexOf(token);
		while (idx !== -1) {
			const prev = idx > 0 ? source[idx - 1] : "";
			const next = source[idx + token.length] || "";
			const boundaryOk = !/[A-Za-z0-9_]/.test(next);
			if (prev !== "@" && boundaryOk) return idx;
			idx = source.indexOf(token, idx + token.length);
		}
		return -1;
	}
	findInterpolationEnd(from, close) {
		let inQuote = null;
		let escaped = false;
		let depthParen = 0;
		let depthBracket = 0;
		let depthBrace = 0;
		for (let i = from; i < this.template.length; i++) {
			const char = this.template[i];
			if (
				!inQuote &&
				depthParen === 0 &&
				depthBracket === 0 &&
				depthBrace === 0 &&
				this.template.startsWith(close, i)
			) {
				return i;
			}
			if (inQuote) {
				if (escaped) {
					escaped = false;
					continue;
				}
				if (char === "\\") {
					escaped = true;
					continue;
				}
				if (char === inQuote) {
					inQuote = null;
				}
				continue;
			}
			if (char === '"' || char === "'" || char === "`") {
				inQuote = char;
				continue;
			}
			if (char === "(") depthParen++;
			else if (char === ")" && depthParen > 0) depthParen--;
			else if (char === "[") depthBracket++;
			else if (char === "]" && depthBracket > 0) depthBracket--;
			else if (char === "{") depthBrace++;
			else if (char === "}" && depthBrace > 0) depthBrace--;
		}
		return -1;
	}
	extractBracketedContent(open, close) {
		let depth = 0;
		let content = "";
		let inQuote = null;
		let escaped = false;
		for (let i = 0; i < this.template.length - this.cursor; i++) {
			const char = this.template[this.cursor + i];
			if (inQuote) {
				if (escaped) {
					escaped = false;
				} else if (char === "\\") {
					escaped = true;
				} else if (char === inQuote) {
					inQuote = null;
				}
			} else {
				if (char === '"' || char === "'" || char === "`") {
					inQuote = char;
				} else if (char === open) {
					depth++;
				} else if (char === close) {
					depth--;
				}
			}
			content += char;
			if (depth === 0)
				return { content: content.slice(1, -1), fullLength: i + 1 };
		}
		return null;
	}
	parseArgs(argsStr) {
		const args = [];
		let current = "";
		let dPar = 0;
		let dBra = 0;
		let dCur = 0;
		let inQ = null;
		for (let i = 0; i < argsStr.length; i++) {
			const c = argsStr[i];
			if (inQ) {
				if (c === inQ && argsStr[i - 1] !== "\\") inQ = null;
			} else {
				if (c === '"' || c === "'") inQ = c;
				else if (c === "(") dPar++;
				else if (c === ")") dPar--;
				else if (c === "[") dBra++;
				else if (c === "]") dBra--;
				else if (c === "{") dCur++;
				else if (c === "}") dCur--;
				else if (c === "," && dPar === 0 && dBra === 0 && dCur === 0) {
					args.push(current.trim());
					current = "";
					continue;
				}
			}
			current += c;
		}
		if (current.trim() || args.length > 0) args.push(current.trim());
		return args;
	}
}

// ../core/src/runtime.ts
function createKireFunction(_kire, execute, meta) {
	const fn = execute;
	fn.meta = meta;
	return fn;
}

// ../core/src/utils/browser.ts
var throwNoAPI = (name) => {
	return () => {
		throw new Error(
			`Platform API '${name}' is not available in browser. Provide it via store or use virtual files.`,
		);
	};
};
var platform = {
	readFile: throwNoAPI("readFile"),
	exists: () => false,
	readDir: throwNoAPI("readDir"),
	stat: throwNoAPI("stat"),
	writeFile: throwNoAPI("writeFile"),
	resolve: (...args) => args.join("/").replace(/\/+/g, "/"),
	join: (...args) => args.join("/").replace(/\/+/g, "/"),
	isAbsolute: (path) => path.startsWith("/") || path.startsWith("http"),
	relative: (_from, to) => to,
	cwd: () => "/",
	env: (_key) => {
		return;
	},
	isProd: () => false,
};

// ../core/src/utils/error.ts
class KireError extends Error {
	originalError;
	template;
	constructor(message, template) {
		const originalError =
			message instanceof Error ? message : new Error(message);
		super(originalError.message);
		this.name = "KireError";
		this.originalError = originalError;
		this.template = template && "meta" in template ? template.meta : template;
		this.stack = this.formatStack(originalError.stack || "");
	}
	getMap() {
		if (!this.template) return null;
		if (this.template.map) return this.template.map;
		if (this.template.code) {
			const mapUrlIndex = this.template.code.lastIndexOf(
				"//# sourceMappingURL=data:application/json;charset=utf-8;base64,",
			);
			if (mapUrlIndex !== -1) {
				try {
					const base64 = this.template.code.slice(mapUrlIndex + 64).trim();
					this.template.map = JSON.parse(decodeBase64(base64));
					return this.template.map;
				} catch (_e) {}
			}
		}
		return null;
	}
	formatStack(stack) {
		const lines = stack.split(`
`);
		const messageLine = lines[0] || `${this.name}: ${this.message}`;
		const mappedLines = [];
		for (let i = 1; i < lines.length; i++) {
			mappedLines.push(this.mapStackLine(lines[i]));
		}
		let finalMessage = messageLine;
		if (finalMessage.startsWith("Error:"))
			finalMessage = `KireError:${finalMessage.slice(6)}`;
		else if (!finalMessage.includes("KireError"))
			finalMessage = `KireError: ${finalMessage}`;
		return `${finalMessage}
${mappedLines.join(`
`)}`;
	}
	mapStackLine(line) {
		const match = line.match(/^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
		if (match && this.template) {
			const [_, fn, file, l, c] = match;
			const filename = file.replace(/\\/g, "/");
			const genLine = Number.parseInt(l, 10),
				genCol = Number.parseInt(c, 10);
			if (
				filename.includes(this.template.path.replace(/\\/g, "/")) ||
				filename.includes("template.kire") ||
				/anonymous|eval|AsyncFunction/.test(filename)
			) {
				if (this.template.code) {
					const generatedLines = this.template.code.split(`
`);
					for (let i = genLine - 1; i >= Math.max(0, genLine - 15); i--) {
						const gl = generatedLines[i];
						if (gl?.trim().startsWith("// kire-line:")) {
							return `    at ${fn ? `${fn} ` : ""}(${this.template.path}:${gl.split(":")[1].trim()}:${genCol})`;
						}
					}
				}
				const map = this.getMap();
				if (map) {
					const resolved = resolveSourceLocation(map, genLine, genCol);
					if (resolved)
						return `    at ${fn ? `${fn} ` : ""}(${resolved.source}:${resolved.line}:${resolved.column})`;
				}
			}
		}
		return line;
	}
}
function renderErrorHtml(e, kire, ctx) {
	const isProduction = kire?.$production ?? kire?.production ?? false;
	if (isProduction)
		return `<html><body style="background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><h1 style="font-size:1.5rem;margin-top:1rem;letter-spacing:0.05em">INTERNAL SERVER ERROR</h1></body></html>`;
	const template =
		(e instanceof KireError && e.template) ||
		(ctx?.$template ? ctx.$template.meta : undefined);
	let snippet = "",
		location = "",
		astJson = "null";
	if (template && e.stack) {
		const safePath = template.path
			.replace(/\\/g, "/")
			.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const match =
			e.stack.match(new RegExp(`${safePath}:(\\d+):(\\d+)`)) ||
			e.stack.match(/template\.kire:(\d+):(\d+)/) ||
			e.stack.match(/(?:eval|anonymous):(\d+):(\d+)/);
		if (match) {
			const rawLine = Number.parseInt(match[1], 10),
				genCol = Number.parseInt(match[2], 10);
			let sourceLine = -1;
			if (match[0].includes(template.path.replace(/\\/g, "/")))
				sourceLine = rawLine - 1;
			if (sourceLine === -1) {
				let map = template.map;
				if (!map && template.code) {
					const mapUrlIndex = template.code.lastIndexOf(
						"//# sourceMappingURL=data:application/json;charset=utf-8;base64,",
					);
					if (mapUrlIndex !== -1)
						try {
							const base64 = template.code.slice(mapUrlIndex + 64).trim();
							map = JSON.parse(decodeBase64(base64));
						} catch (_) {}
				}
				if (map) {
					const res = resolveSourceLocation(map, rawLine, genCol);
					if (res) sourceLine = res.line - 1;
				}
			}
			if (sourceLine === -1 && template.code) {
				const lines = template.code.split(`
`);
				for (let i = rawLine - 1; i >= 0; i--) {
					if (lines[i]?.trim().startsWith("// kire-line:")) {
						sourceLine = Number.parseInt(lines[i].split(":")[1].trim(), 10) - 1;
						break;
					}
				}
			}
			if (sourceLine !== -1 && template.source) {
				location = `${template.path}:${sourceLine + 1}`;
				const sourceLines = template.source.split(`
`);
				const start = Math.max(0, sourceLine - 5),
					end = Math.min(sourceLines.length, sourceLine + 6);
				snippet = sourceLines
					.slice(start, end)
					.map((l, i) => {
						const cur = start + i + 1;
						return `<div class="line ${cur === sourceLine + 1 ? "active" : ""}"><span>${cur}</span><pre>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>`;
					})
					.join("");
			}
		}
		if (kire && template.source)
			try {
				astJson = JSON.stringify(kire.parse(template.source), null, 2);
			} catch (_) {}
	}
	const stack = (e.stack || "")
		.split(`
`)
		.filter((l) => !l.includes("new AsyncFunction"))
		.map((l) => `<div>${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`)
		.join("");
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Kire Error</title><style>
        :root { --bg: #000; --card: #09090b; --text: #fff; --muted: #71717a; --danger: #ef4444; --accent: #38bdf8; --border: #27272a; }
        body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 4rem 2rem; line-height: 1.5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { border-bottom: 1px solid var(--border); padding-bottom: 2rem; margin-bottom: 3rem; }
        .err-code { color: var(--danger); font-weight: 700; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; }
        .err-msg { font-size: 2.25rem; font-weight: 800; margin: .5rem 0; letter-spacing: -0.02em; }
        .err-loc { color: var(--accent); font-family: monospace; font-size: .9rem; }
        .section { margin-bottom: 3rem; }
        .section-title { font-size: .75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 1rem; }
        .snippet { background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; font-family: monospace; font-size: .85rem; }
        .line { display: flex; gap: 1rem; padding: 0 1rem; color: #52525b; }
        .line.active { background: #18181b; color: #fff; border-left: 3px solid var(--danger); padding-left: calc(1rem - 3px); }
        .line span { width: 30px; text-align: right; opacity: .3; user-select: none; padding: .2rem 0; }
        .line pre { margin: 0; padding: .2rem 0; white-space: pre-wrap; }
        .box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; max-height: 300px; overflow: auto; font-size: .75rem; color: #d4d4d8; margin-bottom: 2rem; }
        .stack { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: .8rem; color: #a1a1aa; white-space: pre-wrap; }
        .stack div { padding: .2rem 0; border-bottom: 1px solid #18181b; }
        details summary { cursor: pointer; color: var(--muted); font-size: .75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 1rem; outline: none; }
        details summary:hover { color: var(--text); }
    </style></head><body><div class="container">
        <div class="header">
            <div class="err-code">Error 500</div>
            <h1 class="err-msg">${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
            <div class="err-loc">Detected at ${location || "unknown location"}</div>
        </div>
        ${snippet ? `<div class="section"><div class="section-title">Source Context</div><div class="snippet">${snippet}</div></div>` : ""}
        <details><summary>View Execution AST</summary><div class="box"><pre style="margin:0">${astJson.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div></details>
        <div class="section"><div class="section-title">Stack Trace</div><div class="stack">${stack}</div></div>
    </div></body></html>`;
}

// ../core/src/utils/resolve.ts
var HTTP_URL_REGEX = /^https?:\/\//i;
function normalizePath(path) {
	return path.replace(/\\/g, "/");
}
function isInsideRoot(candidate, root, platform2) {
	const normalizedCandidate = normalizePath(candidate);
	const normalizedRoot = normalizePath(root);
	if (normalizedCandidate === normalizedRoot) return true;
	const relative = normalizePath(
		platform2.relative(normalizedRoot, normalizedCandidate),
	);
	return (
		relative !== "" &&
		relative !== "." &&
		!relative.startsWith("..") &&
		!platform2.isAbsolute(relative)
	);
}
function enforcePathBoundary(candidate, roots, platform2, originalPath) {
	for (const root of roots) {
		if (!root) continue;
		if (isInsideRoot(candidate, root, platform2)) return candidate;
	}
	throw new Error(
		`Resolved path "${candidate}" from "${originalPath}" is outside allowed roots.`,
	);
}
function resolvePath(filepath, config, platform2) {
	if (!filepath || HTTP_URL_REGEX.test(filepath)) return filepath;
	let path = normalizePath(filepath);
	const ext = `.${config.extension}`;
	const namespaces = config.namespaces || {};
	const root = normalizePath(
		platform2.isAbsolute(config.root)
			? config.root
			: platform2.resolve(config.root),
	);
	const resolvedNamespaces = Object.create(null);
	for (const [name, rawTarget] of Object.entries(namespaces)) {
		if (typeof rawTarget !== "string" || !rawTarget) continue;
		resolvedNamespaces[name] = normalizePath(
			platform2.isAbsolute(rawTarget)
				? rawTarget
				: platform2.resolve(root, rawTarget),
		);
	}
	const allowedRoots = [root, ...Object.values(resolvedNamespaces)];
	const ensureAllowed = (candidate, scopeRoots = allowedRoots) => {
		const absolute = normalizePath(
			platform2.isAbsolute(candidate)
				? candidate
				: platform2.resolve(root, candidate),
		);
		return enforcePathBoundary(absolute, scopeRoots, platform2, filepath);
	};
	for (const ns in resolvedNamespaces) {
		if (path.startsWith(`${ns}/`) || path.startsWith(`${ns}.`)) {
			const target = resolvedNamespaces[ns];
			let suffix = path.slice(ns.length + 1);
			if (!suffix.endsWith(ext)) {
				suffix = suffix.replace(/\./g, "/") + ext;
			}
			return ensureAllowed(platform2.join(target, suffix), [target]);
		}
	}
	if (path.includes(".")) {
		const parts = path.split(".");
		const ns = parts[0];
		if (ns && resolvedNamespaces[ns]) {
			const target = resolvedNamespaces[ns];
			let suffix = parts.slice(1).join("/");
			if (!suffix.endsWith(ext)) suffix += ext;
			return ensureAllowed(platform2.join(target, suffix), [target]);
		}
		if (!path.includes("/") && !path.startsWith(".") && !path.endsWith(ext)) {
			path = path.replace(/\./g, "/") + ext;
		}
	}
	if (!path.endsWith(ext)) {
		const filename = path.split("/").pop() || "";
		if (!filename.includes(".")) {
			path += ext;
		}
	}
	const componentsRoot = resolvedNamespaces.components;
	if (!platform2.isAbsolute(path) && componentsRoot) {
		const inComponents = platform2.join(componentsRoot, path);
		if (platform2.exists(inComponents)) {
			return ensureAllowed(inComponents, [componentsRoot]);
		}
	}
	if (!platform2.isAbsolute(path)) {
		path = platform2.resolve(root, path);
	}
	return ensureAllowed(path);
}

// ../core/src/kire.ts
var RESERVED_LOCAL_ALIASES = new Set([
	"$props",
	"$globals",
	"$kire",
	"$kire_response",
	"$escape",
	"NullProtoObj",
]);
function createNodePlatformFromRuntime() {
	const runtimeRequire = __require;
	if (typeof runtimeRequire !== "function") return null;
	try {
		const fs = runtimeRequire("node:fs");
		const path = runtimeRequire("node:path");
		return {
			readFile: (filePath) => fs.readFileSync(filePath, "utf-8"),
			exists: (filePath) => fs.existsSync(filePath),
			readDir: (filePath) => fs.readdirSync(filePath),
			stat: (filePath) => fs.statSync(filePath),
			writeFile: (filePath, data) => fs.writeFileSync(filePath, data, "utf-8"),
			resolve: (...args) => path.resolve(...args).replace(/\\/g, "/"),
			join: (...args) => path.join(...args).replace(/\\/g, "/"),
			isAbsolute: (filePath) => path.isAbsolute(filePath),
			relative: (from, to) => path.relative(from, to).replace(/\\/g, "/"),
			cwd: () => process.cwd().replace(/\\/g, "/"),
			env: (key) => process.env[key],
			isProd: () => false,
		};
	} catch {
		return null;
	}
}
var kireDefaultPlatform = createNodePlatformFromRuntime() || platform;
function setDefaultKirePlatform(platform2) {
	kireDefaultPlatform = platform2;
}
function getDefaultKirePlatform() {
	return kireDefaultPlatform;
}
function kirePlugin(defaultOptions, load) {
	return {
		options: defaultOptions,
		load,
	};
}
function defineSchema(definition) {
	return definition;
}

class Kire {
	__valor = "";
	$kire;
	"~elements" = {
		matchers: [],
		pattern: /$^/,
		list: [],
	};
	"~directives" = {
		pattern: /$^/,
		records: new NullProtoObj(),
	};
	"~cache" = {
		modules: new Map(),
		files: new Map(),
	};
	"~store" = {
		globals: new NullProtoObj(),
		props: new NullProtoObj(),
		files: new NullProtoObj(),
		config: new NullProtoObj(),
		platform: new NullProtoObj(),
		runtime: new NullProtoObj(),
	};
	"~handlers" = {
		exists_vars: new Map(),
		forks: [],
	};
	"~schema" = {
		name: "kire-app",
		version: "1.0.0",
		description: "",
		repository: "",
		dependencies: [],
		directives: [],
		elements: [],
		attributes: [],
		types: [],
		tools: new NullProtoObj(),
	};
	"~parent";
	"~compiling" = new Set();
	"~compile-context";
	get $elements() {
		return this.$kire["~elements"];
	}
	get $directives() {
		return this.$kire["~directives"];
	}
	get $cache() {
		return this.$kire["~cache"];
	}
	get $files() {
		const stored = this["~store"].files;
		const cache = this.$cache.files;
		return new Proxy(stored, {
			get: (target, prop) => {
				if (typeof prop !== "string") return Reflect.get(target, prop);
				const s = target[prop];
				if (typeof s === "function") return s;
				if (s === undefined && this["~parent"]) {
					const ps = this["~parent"].$files[prop];
					if (ps !== undefined) return ps;
				}
				const cached = cache.get(prop);
				return cached?.fn ? cached.fn : s;
			},
			set: (target, prop, value) => {
				return Reflect.set(target, prop, value);
			},
		});
	}
	get $schema() {
		return this.$kire["~schema"];
	}
	get $elementMatchers() {
		return this.$elements.matchers;
	}
	get $elementsPattern() {
		return this.$elements.pattern;
	}
	get $directivesPattern() {
		return this.$directives.pattern;
	}
	$globals;
	$props;
	$config;
	$platform;
	$runtime;
	get $production() {
		return this.$config.production;
	}
	get $root() {
		return this.$config.root;
	}
	get $extension() {
		return this.$config.extension;
	}
	get $async() {
		return this.$config.async;
	}
	get $silent() {
		return this.$config.silent;
	}
	get $strict_directives() {
		return this.$config.strict_directives;
	}
	get $var_locals() {
		return this.$config.var_locals;
	}
	get $namespaces() {
		return this.$config.namespaces;
	}
	get $max_renders() {
		return this.$config.max_renders;
	}
	get $escape() {
		return this.$runtime.escapeHtml;
	}
	get NullProtoObj() {
		return this.$runtime.NullProtoObj;
	}
	get KireError() {
		return this.$runtime.KireError;
	}
	get renderErrorHtml() {
		return this.$runtime.renderErrorHtml;
	}
	"~render-symbol" = Symbol.for("~templates");
	constructor(options = new NullProtoObj()) {
		this.$kire = options.parent ? options.parent.$kire : this;
		if (options.parent) {
			this["~parent"] = options.parent;
			Object.defineProperty(this, "$globals", {
				value: this.createStoreProxy(
					this["~store"].globals,
					options.parent.$globals,
				),
				writable: true,
				enumerable: true,
				configurable: true,
			});
			Object.defineProperty(this, "$props", {
				value: this.createStoreProxy(
					this["~store"].props,
					options.parent.$props,
				),
				writable: true,
				enumerable: true,
				configurable: true,
			});
			Object.defineProperty(this, "$config", {
				value: this.createStoreProxy(
					this["~store"].config,
					options.parent.$config,
				),
				writable: true,
				enumerable: true,
				configurable: true,
			});
			Object.defineProperty(this, "$platform", {
				value: this.createStoreProxy(
					this["~store"].platform,
					options.parent.$platform,
				),
				writable: true,
				enumerable: true,
				configurable: true,
			});
			Object.defineProperty(this, "$runtime", {
				value: this.createStoreProxy(
					this["~store"].runtime,
					options.parent.$runtime,
				),
				writable: true,
				enumerable: true,
				configurable: true,
			});
			return;
		}
		const run = this["~store"].runtime;
		run.escapeHtml = escapeHtml;
		run.NullProtoObj = NullProtoObj;
		run.KireError = KireError;
		run.renderErrorHtml = renderErrorHtml;
		run.createKireFunction = createKireFunction;
		const plat = this["~store"].platform;
		Object.assign(plat, getDefaultKirePlatform(), options.platform || {});
		const conf = this["~store"].config;
		conf.production = options.production ?? plat.isProd();
		conf.async = options.async ?? true;
		conf.extension = options.extension ?? "kire";
		conf.silent = options.silent ?? false;
		conf.strict_directives = options.strict_directives ?? false;
		const localVariable = options.local_variable ?? "it";
		if (
			!JS_IDENTIFIER_REGEX.test(localVariable) ||
			RESERVED_KEYWORDS_REGEX.test(localVariable) ||
			RESERVED_LOCAL_ALIASES.has(localVariable)
		) {
			throw new Error(
				`Invalid local_variable "${localVariable}". Use a valid JavaScript identifier that is not reserved by Kire.`,
			);
		}
		conf.var_locals = localVariable;
		conf.max_renders = options.max_renders ?? 1000;
		conf.root = options.root ? plat.resolve(options.root) : plat.cwd();
		conf.namespaces = new NullProtoObj();
		if (options.files) {
			this["~store"].files = { ...options.files };
		}
		Object.defineProperty(this, "$globals", {
			value: this["~store"].globals,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(this, "$props", {
			value: this["~store"].props,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(this, "$config", {
			value: this["~store"].config,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(this, "$platform", {
			value: this["~store"].platform,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(this, "$runtime", {
			value: this["~store"].runtime,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		if (!options.emptykire) {
			this.plugin(KireDirectives);
		}
	}
	createStoreProxy(localStore, parentStore) {
		return new Proxy(localStore, {
			get: (target, prop, receiver) => {
				if (Reflect.has(target, prop))
					return Reflect.get(target, prop, receiver);
				return Reflect.get(parentStore, prop, receiver);
			},
			set: (target, prop, value) => {
				target[prop] = value;
				return true;
			},
			has: (target, prop) => {
				return Reflect.has(target, prop) || Reflect.has(parentStore, prop);
			},
			deleteProperty: (target, prop) => {
				Reflect.deleteProperty(target, prop);
				return true;
			},
			ownKeys: (target) => {
				const parentKeys = Reflect.ownKeys(parentStore);
				const localKeys = Reflect.ownKeys(target);
				return Array.from(new Set([...localKeys, ...parentKeys]));
			},
			getOwnPropertyDescriptor: (target, prop) => {
				if (Reflect.has(target, prop))
					return Reflect.getOwnPropertyDescriptor(target, prop);
				const parentDesc = Reflect.getOwnPropertyDescriptor(parentStore, prop);
				if (parentDesc && !parentDesc.configurable) {
					return { ...parentDesc, configurable: true };
				}
				return parentDesc;
			},
			defineProperty: (target, prop, descriptor) => {
				Reflect.defineProperty(target, prop, descriptor);
				return true;
			},
			getPrototypeOf: (target) => {
				return Reflect.getPrototypeOf(target);
			},
			setPrototypeOf: (target, proto) => {
				return Reflect.setPrototypeOf(target, proto);
			},
			isExtensible: (target) => {
				return Reflect.isExtensible(target);
			},
			preventExtensions: (target) => {
				return Reflect.preventExtensions(target);
			},
		});
	}
	cached(name) {
		let mod = this.$cache.modules.get(name);
		if (!mod) {
			mod = new this.NullProtoObj();
			this.$cache.modules.set(name, mod);
		}
		return mod;
	}
	fork() {
		const fork = new this.constructor({ parent: this });
		const handlers = this.$kire["~handlers"].forks;
		for (const handler of handlers) {
			handler(fork);
		}
		return fork;
	}
	onFork(callback) {
		this.$kire["~handlers"].forks.push(callback);
		return this;
	}
	plugin(plugin, opts) {
		const baseOptions = plugin.options || {};
		const merged = Object.assign({}, baseOptions, opts);
		if (typeof plugin.load === "function") {
			plugin.load(this, merged);
		} else if (typeof plugin === "function") {
			plugin(this, merged);
		}
		return this;
	}
	use(plugin, opts) {
		return this.plugin(plugin, opts);
	}
	existVar(name, callback, unique = false) {
		const handlers = this.$kire["~handlers"];
		const key = name.toString();
		let list = handlers.exists_vars.get(key);
		if (!list) {
			list = [];
			handlers.exists_vars.set(key, list);
		}
		list.push({ name, unique, callback });
		return this;
	}
	$global(key, value) {
		this.$globals[key] = value;
		return this;
	}
	$ctx(key, value) {
		return this.$global(key, value);
	}
	$prop(key, value) {
		this.$props[key] = value;
		return this;
	}
	resolve(path) {
		return this.resolvePath(path);
	}
	renderError(e, ctx) {
		return this.renderErrorHtml(e, this, ctx);
	}
	kireSchema(def) {
		Object.assign(this.$schema, def);
		return this;
	}
	type(def) {
		this.$schema.types.push(def);
		return this;
	}
	attribute(def) {
		this.$schema.attributes.push(def);
		return this;
	}
	directive(def) {
		this.$directives.records[def.name] = {
			...def,
		};
		this.$directives.pattern = createFastMatcher(
			Object.keys(this.$directives.records),
		);
		this.$schema.directives.push({
			name: def.name,
			description: def.description,
			signature: def.signature,
			declares: def.declares,
			children: def.children,
			example: def.example,
			related: def.related ?? def.relatedTo,
			exposes: def.exposes,
		});
		return this;
	}
	getDirective(name) {
		return this.$directives.records[name];
	}
	element(def) {
		if (typeof def.name === "string") {
			this.$schema.elements.push({
				name: def.name,
				description: def.description,
				void: def.void,
				attributes: def.attributes,
				example: def.example,
				related: def.related ?? def.relatedTo,
				declares: def.declares,
			});
		}
		if (typeof def.onCall !== "function") {
			return this;
		}
		this.$elements.list.push(def);
		this.$elements.matchers.unshift({ def });
		const names = this.$elements.list.map((d) => d.name);
		this.$elements.pattern = createFastMatcher(names);
		return this;
	}
	namespace(name, path) {
		this.$namespaces[name] = this.$platform.resolve(this.$root, path);
		return this;
	}
	resolvePath(filepath) {
		return resolvePath(filepath, this.$config, this.$platform);
	}
	readFile(path) {
		const normalized = path.replace(/\\/g, "/");
		const entry = this.$cache.files.get(normalized);
		if (entry?.source) return entry.source;
		const stored = this.$files[normalized];
		if (stored) {
			if (typeof stored === "string") return stored;
			if (typeof stored === "function" && stored.meta?.source) {
				return stored.meta.source;
			}
			throw new Error(
				`Path ${path} points to a pre-compiled function without source text.`,
			);
		}
		if (this.$platform.exists(normalized))
			return this.$platform.readFile(normalized);
		throw new Error(`Template file not found: ${path}`);
	}
	parse(content) {
		return new Lexer(content, this).parse();
	}
	compile(
		content,
		filename = "template.kire",
		extraGlobals = [],
		isDependency = false,
	) {
		try {
			const root = this.$kire;
			let compileContext = root["~compile-context"];
			if (!compileContext) {
				compileContext = {
					depth: 0,
				};
				root["~compile-context"] = compileContext;
			}
			compileContext.depth += 1;
			const nodes = this.parse(content);
			const compilerInstance = new Compiler(this, filename);
			try {
				const code = compilerInstance.compile(
					nodes,
					extraGlobals,
					isDependency,
				);
				const async = compilerInstance.async;
				const dependencies = new NullProtoObj();
				for (const [path, id] of Object.entries(
					compilerInstance.getDependencies(),
				)) {
					dependencies[path] = id;
				}
				const AsyncFunc = (async () => {}).constructor;
				const coreFunction = async
					? new AsyncFunc("$props, $globals, $kire", code)
					: new Function("$props, $globals, $kire", code);
				const fn = this.$runtime.createKireFunction(this, coreFunction, {
					async,
					path: filename,
					code,
					source: content,
					map: undefined,
					dependencies,
				});
				return {
					ast: nodes,
					code,
					fn,
					async,
					time: Date.now(),
					dependencies,
					source: content,
				};
			} finally {
				compileContext.depth -= 1;
				if (compileContext.depth <= 0) {
					delete root["~compile-context"];
				}
			}
		} catch (e) {
			if (!this.$silent) {
				console.error(`Compilation error in ${filename}:`);
				console.error(e);
			}
			if (e instanceof this.KireError) throw e;
			throw new this.KireError(e, {
				execute: () => {},
				async: false,
				path: filename,
				code: "",
				source: content,
				map: undefined,
				dependencies: new NullProtoObj(),
			});
		}
	}
	getOrCompile(path, isDependency = false) {
		const resolved = this.resolvePath(path);
		const stored = this.$files[resolved];
		if (typeof stored === "function") return stored;
		const cached = this.$cache.files.get(resolved);
		const source = typeof stored === "string" ? stored : undefined;
		if (this.$production && cached) return cached.fn;
		if (!this.$production && !source && this.$platform.exists(resolved)) {
			const mtime = this.$platform.stat(resolved).mtimeMs;
			if (cached && cached.time === mtime) return cached.fn;
		} else if (source && cached) {
			return cached.fn;
		}
		if (this.$kire["~compiling"].has(resolved)) {
			throw new Error(`Circular dependency detected: ${resolved}`);
		}
		const content = source ?? this.readFile(resolved);
		this.$kire["~compiling"].add(resolved);
		try {
			const entry = this.compile(content, resolved, [], isDependency);
			if (!source && this.$platform.exists(resolved)) {
				entry.time = this.$platform.stat(resolved).mtimeMs;
			}
			this.$cache.files.set(resolved, entry);
			if (this.$cache.files.size > this.$max_renders * 2) {
				const first = this.$cache.files.keys().next().value;
				if (first && first !== this["~render-symbol"])
					this.$cache.files.delete(first);
			}
			return entry.fn;
		} finally {
			this.$kire["~compiling"].delete(resolved);
		}
	}
	run(template, locals, globals) {
		try {
			let effectiveProps = locals;
			const effectiveGlobals = globals || this.$globals;
			if (this["~parent"]) {
				effectiveProps = Object.assign(Object.create(this.$props), locals);
			}
			const result = template.call(
				this,
				effectiveProps,
				effectiveGlobals,
				template,
			);
			if (!this.$async && result instanceof Promise) {
				throw new Error(
					`Template ${template.meta.path} contains async code but was called synchronously.`,
				);
			}
			return result;
		} catch (e) {
			throw e instanceof this.KireError ? e : new this.KireError(e, template);
		}
	}
	render(
		template,
		locals = new NullProtoObj(),
		globals,
		filename = "template.kire",
	) {
		let bucket = this.$cache.files.get(this["~render-symbol"]);
		if (!bucket) {
			bucket = new Map();
			this.$cache.files.set(this["~render-symbol"], bucket);
		}
		let entry = bucket.get(template);
		if (!entry) {
			entry = this.compile(template, filename, Object.keys(locals));
			if (bucket.size >= this.$max_renders) {
				const first = bucket.keys().next().value;
				bucket.delete(first);
			}
			bucket.set(template, entry);
		}
		return this.run(entry.fn, locals, globals);
	}
	view(path, locals = new NullProtoObj(), globals) {
		return this.run(this.getOrCompile(path), locals, globals);
	}
	compileAndBuild(directories, outputFile) {
		const bundled = {};
		const scan = (dir) => {
			if (!this.$platform.exists(dir)) return;
			const items = this.$platform.readDir(dir);
			for (const item of items) {
				const fullPath = this.$platform.join(dir, item);
				const stat = this.$platform.stat(fullPath);
				if (stat.isDirectory()) scan(fullPath);
				else if (
					stat.isFile() &&
					(fullPath.endsWith(this.$extension) || fullPath.endsWith(".kire"))
				) {
					const content = this.$platform.readFile(fullPath);
					const resolved = this.$platform.relative(this.$root, fullPath);
					const entry = this.compile(content, resolved);
					this.$cache.files.set(resolved, entry);
					bundled[resolved] = entry.async
						? `async function($props = {}, $globals = {}, $kire) {
${entry.code}
}`
						: `function($props = {}, $globals = {}, $kire) {
${entry.code}
}`;
				}
			}
		};
		for (const dir of directories)
			scan(this.$platform.resolve(this.$root, dir));
		const exportLine =
			typeof module_kire !== "undefined"
				? "module.exports = _kire_bundled;"
				: "export default _kire_bundled;";
		const output = `// Kire Bundled Templates
// Generated at ${new Date().toISOString()}

const _kire_bundled = {
${Object.entries(bundled)
	.map(([key, fn]) => `  "${key}": ${fn}`)
	.join(`,
`)}
};

${exportLine}
`;
		this.$platform.writeFile(outputFile, output);
	}
}
// ../core/src/browser.ts
setDefaultKirePlatform(platform);

export {
	Compiler,
	createKireFunction,
	defineSchema,
	escapeHtml,
	getDefaultKirePlatform,
	Kire,
	kirePlugin,
	Lexer,
	NullProtoObj,
	setDefaultKirePlatform,
};

//# debugId=66A5E3720C12F44464756E2164756E21
