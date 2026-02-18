import { resolve, join, isAbsolute, relative } from "node:path";
import type { Kire } from "./kire";
import type { CompilerApi, Node } from "./types";
import { SourceMapGenerator } from "./utils/source-map";
import { 
    NullProtoObj, 
    RESERVED_KEYWORDS_REGEX,
    JS_EXTRACT_IDENTS_REGEX,
    FOR_VAR_EXTRACT_REGEX,
    INTERPOLATION_PURE_REGEX,
    INTERPOLATION_GLOBAL_REGEX,
    INTERPOLATION_START_REGEX,
    AWAIT_KEYWORD_REGEX,
    WILDCARD_CHAR_REGEX,
    STRIP_QUOTES_REGEX,
    JS_STRINGS_REGEX,
    createVarThenRegex
} from "./utils/regex";

export class Compiler {
    private body: string[] = [];
    private header: string[] = [];
    private footer: string[] = [];
    private dependencies: Record<string, string> = new NullProtoObj();
    private uidCounter: Record<string, number> = new NullProtoObj();
    private _async: boolean = false;
    private _isDependency: boolean = false;
    private textBuffer: string = "";
    private generator: SourceMapGenerator;
    private mappings: { bodyIndex: number; node: Node; col: number }[] = [];
    private identifiers: Set<string> = new Set();
    private fullBody: string = "";
    private allIdentifiers: Set<string> = new Set();

    constructor(public kire: Kire<any>, private filename = "template.kire") {
        this.generator = new SourceMapGenerator(filename);
        this.generator.addSource(filename);
    }

    public get async(): boolean { return this._async; }
    public getDependencies(): Record<string, string> { return this.dependencies; }
    private markAsync() { this._async = true; }

    private esc(str: string): string {
        return "'" + str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "'";
    }

    private flushText() {
        if (this.textBuffer) {
            this.body.push(`$kire_response += ${this.esc(this.textBuffer)};`);
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
        let res = val.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr) => `\${$escape(${expr})}`);
        return "`" + res + "`";
    }

    public compile(nodes: Node[], extraGlobals: string[] = [], isDependency = false): string {
        this._isDependency = isDependency;
        this.body = []; this.header = []; this.footer = [];
        this.dependencies = new NullProtoObj(); this.uidCounter = new NullProtoObj();
        this.mappings = [];
        this._async = false;
        this.textBuffer = "";
        this.identifiers.clear();

        this.header.push(`$globals = Object.assign(Object.create(this.$globals), $globals);`);
        this.header.push(`let $kire_response = "";`);
        this.header.push(`const $escape = this.$escape;`);

        this.collectIdentifiers(nodes, this.identifiers);
        if (extraGlobals) extraGlobals.forEach(g => this.identifiers.add(g));

        const localDecls = new Set<string>();
        this.collectDeclarations(nodes, localDecls);

        for (const id of this.identifiers) {
            if (RESERVED_KEYWORDS_REGEX.test(id) || localDecls.has(id) || id === "it" || id === "$props" || id === "$globals" || id === "$kire" || id === "$kire_response" || id === "$escape" || id === "NullProtoObj") continue;
            if (typeof (globalThis as any)[id] !== 'undefined') continue;
            
            // Skip variables that have existVar handlers
            if (this.kire.$kire["~handlers"].exists_vars.has(id)) continue;

            this.header.push(`let ${id} = $props['${id}'] ?? $globals['${id}'];`);
        }
        
        if (this.identifiers.has('it')) {
            this.header.push(`const it = $props;`);
        }

        this.compileNodes(nodes);
        this.flushText();
        
        // Register variable providers
        // We do this in a loop because one existVar might trigger another
        let changed = true;
        const triggered = new Set<string>();
        while (changed) {
            changed = false;
            // Join everything to scan for variable usage
            const rawAllCode = this.header.join("\n") + "\n" + this.body.join("\n") + "\n" + this.footer.join("\n");
            // Strip strings to avoid false positives
            const cleanCode = rawAllCode.replace(JS_STRINGS_REGEX, '""');

            for (const [name, entries] of this.kire.$kire["~handlers"].exists_vars) {
                const nameStr = name.toString();
                if (triggered.has(nameStr)) continue;

                for (const entry of entries) {
                    // If unique is true, only trigger if it's NOT a dependency
                    if (entry.unique && this._isDependency) {
                         triggered.add(nameStr);
                         continue;
                    }

                    const regex = createVarThenRegex(typeof entry.name === 'string' ? entry.name : entry.name.source);
                    
                    if (this.identifiers.has(nameStr) || regex.test(cleanCode)) {
                        entry.callback?.(this.createCompilerApi({ type: 'directive', name: 'existVar', loc: { line: 0, column: 0 } } as any, {}, true));
                        triggered.add(nameStr);
                        changed = true;
                    }
                }
            }
        }

        if (Object.keys(this.dependencies).length > 0) {
            this.header.push(`// Dependencies`);
            for (const path in this.dependencies) {
                const id = this.dependencies[path]!;
                const depNodes = this.kire.parse(this.kire.readFile(this.kire.resolvePath(path)));
                const compilerInstance = new Compiler(this.kire, path);
                const depCode = compilerInstance.compile(depNodes, [], true);
                const asyncDep = compilerInstance.async;
                
                this.header.push(`// ${path}`);
                this.header.push(`const ${id} = ${asyncDep ? 'async ' : ''}function($props = {}, $globals = {}) {`);
                this.header.push(depCode);
                this.header.push(`};`);
                this.header.push(`${id}.meta = { async: ${asyncDep}, path: '${path}' };`);
            }
        }

        let code = `\n${this.header.join("\n")}\n${this.body.join("\n")}\n${this.footer.join("\n")}\nreturn $kire_response;\n//# sourceURL=${this.filename}`;

        if (!this.kire.production) {
            const headerLines = (this.header.join("\n") + "\n" ).split("\n").length + 1; 
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
            JS_EXTRACT_IDENTS_REGEX.lastIndex = 0; 
        };
        for (const n of nodes) {
            if (n.type === "interpolation" || n.type === "js") scan(n.content || "");
            if (n.args) n.args.forEach(a => typeof a === "string" && scan(a));
            
            if (n.type === "element") {
                if (n.attributes) {
                    for (const [key, val] of Object.entries(n.attributes)) {
                        if (n.tagName?.startsWith('kire:') || key.startsWith('@')) {
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
                    this.body.push(`$kire_response += ${n.raw ? n.content : `$escape(${n.content})`};`);
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
            const def = m.def;
            if (typeof def.name === "string") {
                if (def.name === t) { matcher = m; break; }
                if (WILDCARD_CHAR_REGEX.test(def.name)) {
                    const p = def.name.replace("*", "(.*)");
                    const m2 = t.match(new RegExp(`^${p}$`));
                    if (m2) { n.wildcard = m2[1]; matcher = m; break; }
                }
            } else if (def.name instanceof RegExp && def.name.test(t)) { matcher = m; break; }
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
                            this.body.push(`$kire_response += ${code};`);
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

    private createCompilerApi(node: Node, definition: any, isExistVar = false): any {
        const self = this;
        const api: any = {
            kire: this.kire, node, 
            editable: true,
            get fullBody() { return self.fullBody; },
            get allIdentifiers() { return self.allIdentifiers; },
            get wildcard() { return node.wildcard; },
            get children() { return node.children; },
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
            after: (js: string) => { api.epilogue(js); },
            markAsync: () => this.markAsync(),
            getDependency: (p: string) => {
                const cleanPath = p.replace(STRIP_QUOTES_REGEX, '');
                return this.kire.getOrCompile(cleanPath, true);
            },
            depend: (p: string) => {
                const cleanPath = p.replace(STRIP_QUOTES_REGEX, '');
                let r = this.kire.resolvePath(cleanPath);
                
                // If it's within kire root, make it relative for better portability
                if (r.startsWith(this.kire.$root)) {
                    r = relative(this.kire.$root, r).replace(/\\/g, '/');
                }

                if (this.dependencies[r]) return this.dependencies[r]!;
                const id = `_dep${Object.keys(this.dependencies).length}`;
                this.dependencies[r] = id; return id;
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
            existVar: (name: string, callback: (api: CompilerApi) => void, unique = false) => {
                this.kire.existVar(name, callback, unique);
            }
        };
        return api;
    }
}
