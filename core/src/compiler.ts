import type { Kire } from "./kire";
import type { CompilerApi, Node } from "./types";
import { SourceMapGenerator } from "./utils/source-map";
import { 
    NullProtoObj, 
    JS_IDENTIFIER_REGEX, 
    RESERVED_KEYWORDS_REGEX,
    JS_EXTRACT_IDENTS_REGEX,
    FOR_VAR_EXTRACT_REGEX,
    INTERPOLATION_PURE_REGEX,
    INTERPOLATION_GLOBAL_REGEX,
    INTERPOLATION_START_REGEX,
    AWAIT_KEYWORD_REGEX,
    WILDCARD_CHAR_REGEX
} from "./utils/regex";

export class Compiler {
    private body: string[] = [];
    private header: string[] = [];
    private footer: string[] = [];
    private dependencies: Map<string, string> = new Map();
    private uidCounter: Record<string, number> = new NullProtoObj();
    private _isAsync: boolean = false;
    private textBuffer: string = "";
    private generator: SourceMapGenerator;
    private mappings: { bodyIndex: number; node: Node; col: number }[] = [];

    constructor(public kire: Kire<any>, private filename = "template.kire") {
        this.generator = new SourceMapGenerator(filename);
        this.generator.addSource(filename);
    }

    public get isAsync(): boolean { return this._isAsync; }
    public getDependencies(): Map<string, string> { return this.dependencies; }
    private markAsync() { this._isAsync = true; }

    private esc(str: string): string {
        return "'" + str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "'";
    }

    private flushText() {
        if (this.textBuffer) {
            this.body.push(`$ctx.$response += ${this.esc(this.textBuffer)};`);
            this.textBuffer = "";
        }
    }

    /** Converte valor de atributo HTML (possivelmente com {{}}) em expressão JS */
    private parseAttrCode(val: string): string {
        if (!INTERPOLATION_START_REGEX.test(val)) return val;
        // Se for puramente uma interpolação, extrai o miolo
        const pureMatch = val.match(INTERPOLATION_PURE_REGEX);
        if (pureMatch) return pureMatch[1]!;
        
        // Se for texto misto, transforma em template literal ou concatenação
        let res = val.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr) => `\${$ctx.$escape(${expr})}`);
        return "`" + res + "`";
    }

    public compile(nodes: Node[], extraGlobals: string[] = []): string {
        this.body = []; this.header = []; this.footer = [];
        this.dependencies.clear(); this.uidCounter = new NullProtoObj();
        this.mappings = [];
        this._isAsync = false;
        this.textBuffer = "";

        this.header.push(`const it = $ctx.$props;`);
        this.header.push(`const NullProtoObj = $ctx.NullProtoObj;`);

        const idents = new Set<string>();
        this.collectIdentifiers(nodes, idents);
        if (extraGlobals) extraGlobals.forEach(g => idents.add(g));

        const localDecls = new Set<string>();
        this.collectDeclarations(nodes, localDecls);

        for (const id of idents) {
            if (RESERVED_KEYWORDS_REGEX.test(id) || localDecls.has(id) || id === "it" || id === "$ctx" || id === "$deps" || id === "$loop") continue;
            if (typeof (globalThis as any)[id] !== 'undefined') continue;
            this.header.push(`let ${id} = $ctx.$props['${id}'] !== undefined ? $ctx.$props['${id}'] : $ctx.$globals['${id}'];`);
        }

        this.compileNodes(nodes);
        this.flushText();

        let code = `\n${this.header.join("\n")}\n${this.body.join("\n")}\n${this.footer.join("\n")}\nreturn $ctx;\n//# sourceURL=${this.filename}`;

        if (!this.kire.production) {
            const headerLines = this.header.join("\n").split("\n").length + 1; // +1 for the newline before header
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

    private collectIdentifiers(nodes: Node[], set: Set<string>) {
        const scan = (c: string) => { 
            let m; while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
                const id = m[1]; if (id && !RESERVED_KEYWORDS_REGEX.test(id)) set.add(id);
            }
            JS_EXTRACT_IDENTS_REGEX.lastIndex = 0; // Reset state for global regex
        };
        for (const n of nodes) {
            if (n.type === "interpolation" || n.type === "js") scan(n.content || "");
            if (n.args) n.args.forEach(a => typeof a === "string" && scan(a));
            
            if (n.type === "element") {
                if (n.attributes) {
                    for (const [key, val] of Object.entries(n.attributes)) {
                        if (key.startsWith('@')) {
                            scan(val);
                        } else {
                            const code = this.parseAttrCode(val);
                            if (code !== val) scan(code);
                        }
                    }
                }
            }

            if (n.children) this.collectIdentifiers(n.children, set);
            if (n.related) this.collectIdentifiers(n.related, set);
        }
    }

    private collectDeclarations(nodes: Node[], set: Set<string>) {
        const scan = (c: string) => { 
            let m; while ((m = JS_EXTRACT_IDENTS_REGEX.exec(c)) !== null) {
                const id = m[1]; if (id && !RESERVED_KEYWORDS_REGEX.test(id)) set.add(id);
            }
            JS_EXTRACT_IDENTS_REGEX.lastIndex = 0;
        };
        for (const n of nodes) {
            if (n.type === "directive") {
                if (n.name === "for") {
                    const a = n.args?.[0]; if (typeof a === "string") {
                        // Tenta extrair a parte 'as' do for
                        let asPart = a;
                        const ofIdx = a.lastIndexOf(" of ");
                        const inIdx = a.lastIndexOf(" in ");
                        const idx = Math.max(ofIdx, inIdx);
                        if (idx !== -1) asPart = a.slice(0, idx);
                        scan(asPart);
                    }
                }
                if (n.name === "let" || n.name === "const") {
                    const a = n.args?.[0]; if (typeof a === "string") {
                        const first = a.split("=")[0];
                        if (first) scan(first);
                    }
                }
                if (n.name === "error") set.add("$message");
            }
            if (n.type === "element" && n.tagName === "kire:for") {
                const as = n.attributes?.['as']; if (as) scan(as);
                const index = n.attributes?.['index'] || 'index'; set.add(index);
            }
            if (n.type === "js" && n.content) {
                const declRegex = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
                let m; while ((m = declRegex.exec(n.content)) !== null) {
                    if (m[1]) set.add(m[1]);
                }
            }
            if (n.children) this.collectDeclarations(n.children, set);
            if (n.related) this.collectDeclarations(n.related, set);
        }
    }

    private compileNodes(nodes: Node[]) {
        for (const n of nodes) {
            switch (n.type) {
                case "text": this.textBuffer += n.content || ""; break;
                case "interpolation":
                    this.flushText();
                    if (n.content && AWAIT_KEYWORD_REGEX.test(n.content)) this.markAsync();
                    if (!this.kire.production && n.loc) {
                        this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
                        this.body.push(`// kire-line: ${n.loc.line}`);
                    }
                    this.body.push(`$ctx.$response += ${n.raw ? n.content : `$ctx.$escape(${n.content})`};`);
                    break;
                case "js": 
                    this.flushText();
                    if (n.content && AWAIT_KEYWORD_REGEX.test(n.content)) this.markAsync(); 
                    if (!this.kire.production && n.content && n.loc) {
                        const lines = n.content.split("\n");
                        for (let i = 0; i < lines.length; i++) {
                            const currentLine = n.loc.line + i;
                            this.mappings.push({ bodyIndex: this.body.length, node: { ...n, loc: { ...n.loc, line: currentLine } }, col: 0 });
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
                case "element": this.processElement(n); break;
            }
        }
    }

    private processDirective(n: Node) {
        const d = this.kire.getDirective(n.name!);
        if (d) {
            if (!this.kire.production) {
                this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
                if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
            }
            d.onCall(this.createCompilerApi(n, d));
        }
    }

    private processElement(n: Node) {
        const t = n.tagName || ""; let matcher = null;
        for (const m of this.kire.$elementMatchers) {
            if (typeof m.def.name === "string") {
                if (m.def.name === t) { matcher = m; break; }
                if (WILDCARD_CHAR_REGEX.test(m.def.name)) {
                    const p = m.def.name.replace("*", "(.*)");
                    const m2 = t.match(new RegExp(`^${p}$`));
                    if (m2) { n.wildcard = m2[1]; matcher = m; break; }
                }
            } else if (m.def.name instanceof RegExp && m.def.name.test(t)) { matcher = m; break; }
        }

        if (!matcher) {
            this.textBuffer += "<" + t;
            if (n.attributes) {
                for (const [key, val] of Object.entries(n.attributes)) {
                    if (key.startsWith('@')) {
                        this.flushText();
                        const dirDef = this.kire.getDirective(key.slice(1));
                        if (dirDef) {
                            if (!this.kire.production) {
                                this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
                                if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
                            }
                            dirDef.onCall(this.createCompilerApi({ ...n, type: 'directive', name: key.slice(1), args: [val] }, dirDef));
                        }
                    } else {
                        if (INTERPOLATION_START_REGEX.test(val)) {
                            this.textBuffer += ` ${key}='`;
                            this.flushText();
                            const code = this.parseAttrCode(val);
                            this.body.push(`$ctx.$response += ${code};`);
                            this.textBuffer += `'`;
                        } else {
                            this.textBuffer += ` ${key}='${val}'`;
                        }
                    }
                }
            }
            this.textBuffer += ">";
            if (n.children) this.compileNodes(n.children);
            if (!n.void) this.textBuffer += "</" + t + ">";
            return;
        }
        
        this.flushText();
        if (!this.kire.production) {
            this.mappings.push({ bodyIndex: this.body.length, node: n, col: 0 });
            if (n.loc) this.body.push(`// kire-line: ${n.loc.line}`);
        }
        matcher.def.onCall(this.createCompilerApi(n, matcher.def));
    }

    private createCompilerApi(node: Node, definition: any): any {
        const api: any = {
            kire: this.kire, node, 
            get wildcard() { return node.wildcard; },
            get children() { return node.children; },
            prologue: (js: string) => { if (AWAIT_KEYWORD_REGEX.test(js)) this.markAsync(); this.header.push(js); },
            write: (js: string) => { this.flushText(); if (AWAIT_KEYWORD_REGEX.test(js)) this.markAsync(); this.body.push(js); },
            after: (js: string) => { this.flushText(); if (AWAIT_KEYWORD_REGEX.test(js)) this.markAsync(); this.footer.push(js); },
            markAsync: () => this.markAsync(),
            depend: (p: string) => {
                const r = this.kire.resolvePath(p);
                if (this.dependencies.has(r)) return this.dependencies.get(r)!;
                const id = `_dep${this.dependencies.size}`;
                this.dependencies.set(r, id); return id;
            },
            append: (c: any) => {
                if (typeof c === "string") {
                    this.textBuffer += c;
                } else {
                    this.flushText();
                    this.body.push(`$ctx.$response += ${c};`);
                }
            },
            renderChildren: (ns?: Node[]) => {
                const targetNodes = ns || node.children || [];
                this.compileNodes(targetNodes);
            },
            uid: (p: string) => { this.uidCounter[p] = (this.uidCounter[p] || 0) + 1; return `_${p}${this.uidCounter[p]}`; },
            getAttribute: (n: string) => {
                const val = node.type === "element" ? node.attributes?.[n] : undefined;
                if (val !== undefined) return this.parseAttrCode(val);
                
                if (definition.params && node.args) {
                    const i = definition.params.findIndex((p: string) => p.startsWith(n + ":") || p === n);
                    const argVal = i !== -1 ? node.args[i] : undefined;
                    return typeof argVal === "string" ? this.parseAttrCode(argVal) : argVal;
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
            param: (n: string | number) => typeof n === 'number' ? api.getArgument(n) : api.getAttribute(n),
            inject: (js: string) => api.prologue(js),
            epilogue: (js: string) => api.after(js)
        };
        return api;
    }
}
