import { readFile, existsSync } from "node:fs";
import { resolve, join, isAbsolute } from "node:path";
import { Compiler } from "./compiler";
import { KireDirectives } from "./directives";
import { Parser } from "./parser";
import KireRuntime from "./runtime";
import { KireError, renderErrorHtml } from "./utils/error";
import { NullProtoObj } from "./utils/regex";
import type {
    DirectiveDefinition,
    ElementDefinition,
    ICompilerConstructor,
    IParserConstructor,
    KireCache,
    KireOptions,
    KirePlugin,
    KireContext,
    KireExecutor,
    TypeDefinition,
    KireSchemaDefinition,
    KireHookName,
    KireHookCallback,
    CompiledTemplate
} from "./types";
import { KireHooks } from "./types";
import { AsyncFunction, scoped } from "./utils/scoped";
import nativeElements from "./elements/natives";

export interface ElementMatcher {
    def: ElementDefinition;
}

export class Kire<Streaming extends boolean = false> {
    public NullProtoObj = NullProtoObj;
    public $scoped = scoped;
    public $error = KireError;

    public $directives: Map<string, DirectiveDefinition> = new Map();
    public $elements: Set<ElementDefinition> = new Set();
    public $elementMatchers: ElementMatcher[] = [];

    public $globals: Record<string, any>;
    public $props: Record<string, any>;
    public $namespaces: Map<string, string> = new Map();

    public production: boolean;
    public $root: string;
    public $extension: string;
    public $stream: Streaming;
    public $silent: boolean;
    public $var_locals: string;
    
    public $files: Record<string, CompiledTemplate> = new NullProtoObj(); // Cache de templates compilados
    public $vfiles: Record<string, string> = new NullProtoObj(); // Fontes virtuais SEM cache
    public $sources: Record<string, string> = new NullProtoObj(); // Fontes virtuais COM cache
    public $cache: Record<string, any> = new NullProtoObj();

    public $parser: IParserConstructor;
    public $compiler: ICompilerConstructor;
    public $executor: KireExecutor;

    public $hooks: KireHooks;
    protected $parent?: Kire<any>;

    public $types: Map<string, TypeDefinition> = new Map();
    public $schemaDefinition?: KireSchemaDefinition;

    constructor(options: KireOptions<Streaming> = new NullProtoObj()) {
        this.production = options.production ?? process.env.NODE_ENV === 'production';
        this.$stream = (options.stream ?? false) as Streaming;
        this.$extension = options.extension ?? "kire";
        this.$silent = options.silent ?? false;
        this.$var_locals = options.varLocals ?? "it";
        this.$parent = options.parent;
        this.$root = options.root ? resolve(options.root).replace(/\\/g, '/') : process.cwd().replace(/\\/g, '/');
        
        if (options.files) {
            for (const key in options.files) {
                this.$sources[this.resolve(key)] = options.files[key]!;
            }
        }

        if (options.vfiles) {
            for (const key in options.vfiles) {
                this.$vfiles[this.resolve(key)] = options.vfiles[key]!;
            }
        }

        if (options.bundled) {
            for (const key in options.bundled) {
                const item = options.bundled[key]!;
                const path = this.resolve(key);
                if (typeof item === 'function') {
                    this.$files[path] = {
                        execute: item,
                        isAsync: (item as any)._isAsync ?? true,
                        path: key,
                        code: "",
                        source: "",
                        usedElements: (item as any)._usedElements
                    };
                } else {
                    this.$files[path] = item;
                }
            }
        }

        this.$hooks = new KireHooks();

        if (this.$parent) {
            this.$globals = Object.create(this.$parent.$globals);
            this.$props = Object.create(this.$parent.$props);
            this.$executor = this.$parent.$executor;
            this.$parser = this.$parent.$parser;
            this.$compiler = this.$parent.$compiler;
            this.$files = this.$parent.$files;
            this.$vfiles = this.$parent.$vfiles;
            this.$sources = this.$parent.$sources;
            this.$cache = this.$parent.$cache;
            this.$directives = this.$parent.$directives;
            this.$elements = this.$parent.$elements;
            this.$elementMatchers = this.$parent.$elementMatchers;
            this.$namespaces = this.$parent.$namespaces;
            this.$types = this.$parent.$types;
            this.$schemaDefinition = this.$parent.$schemaDefinition;
        } else {
            this.$globals = new NullProtoObj();
            this.$props = new NullProtoObj();

            this.$executor = options.executor ?? ((code, params) => {
                const isAsync = code.includes("await");
                if (isAsync) return new AsyncFunction(...params, code);
                return new Function(...params, code);
            });
            this.$parser = options.engine?.parser ?? Parser;
            this.$compiler = options.engine?.compiler ?? Compiler;
            
            if (options.directives !== false) {
                this.plugin(KireDirectives);
                nativeElements(this);
            }

            if (options.plugins) {
                const sorted = options.plugins.map(p => Array.isArray(p) ? { p: p[0], o: p[1] } : { p }).sort((a, b) => (a.p.sort ?? 100) - (b.p.sort ?? 100));
                for (const item of sorted) this.plugin(item.p, item.o);
            }
        }

        this.rebuildElements();
        (this.$error as any).html = (e: any, ctx?: KireContext<Streaming>) => this.renderError(e, ctx);
    }

    public fork(): Kire<Streaming> {
        return new Kire<Streaming>({ parent: this as any, stream: this.$stream });
    }

    public cacheClear() {
        this.$files = new NullProtoObj();
        this.$cache = new NullProtoObj();
    }

    public on(event: KireHookName, callback: KireHookCallback) {
        this.$hooks[event].push(callback);
        return this;
    }

    public plugin<KirePlugged extends KirePlugin<any>>(
        plugin: KirePlugged,
        opts?: KirePlugged["options"],
    ) {
        if (typeof plugin === "function") {
            (plugin as any)(this, opts);
        } else if (plugin.load) {
            plugin.load(this, opts);
        }
        return this;
    }

    // --- Data Management ---

    public $prop(keyOrObj: string | Record<string, any>, value?: any) {
        if (typeof keyOrObj === "string") {
            this.$props[keyOrObj] = value;
        } else if (typeof keyOrObj === "object") {
            for (const key in keyOrObj) {
                this.$props[key] = keyOrObj[key];
            }
        }
        return this;
    }

    public $global(key: string, value: any) {
        this.$globals[key] = value;
        const typeName = typeof value;
        this.type({ variable: key, type: 'global', comment: `Global Variable ${key} (${typeName})`, tstype: typeName });
        return this;
    }

    public $ctx(key: string, value: any) {
        this.$globals[key] = value;
        const typeName = typeof value;
        this.type({ variable: "$ctx." + key, type: 'context', comment: `Context Helper $ctx.${key}`, tstype: typeName });
        return this;
    }

    // --- Compilation & Rendering ---

    public parse(template: string) {
        const parser = new this.$parser(template, this as any);
        return parser.parse();
    }

    public compile(template: string, filename?: string, globals: string[] = []): string {
        const parser = new this.$parser(template, this as any);
        const nodes = parser.parse();
        const compiler = new this.$compiler(this as any, filename);
        return compiler.compile(nodes, globals, parser.usedElements);
    }

    public async compileFn(content: string, filename = "template.kire", globals: string[] = []): Promise<CompiledTemplate> {
        const key = this.production && filename !== "template.kire" 
            ? `${filename}:${globals.sort().join(",")}` 
            : `tpl:${content.length}:${content.slice(0, 100)}:${globals.sort().join(",")}`;
        
        // NÃO usa cache se estiver em $vfiles
        if (this.production && !this.$vfiles[filename] && this.$files[key]) {
            return this.$files[key]!;
        }
        
        const parser = new this.$parser(content, this as any);
        const nodes = parser.parse();
        const compilerInstance = new this.$compiler(this as any, filename);
        const code = compilerInstance.compile(nodes, globals, parser.usedElements);

        const dependencies: Record<string, CompiledTemplate> = new NullProtoObj();
        const depsEntries = (compilerInstance as any).dependencies ? Array.from(((compilerInstance as any).dependencies as Map<string, {id: string, globals: string[]}>).entries()) : [];
        
        for (const [depPath, data] of depsEntries) {
            dependencies[depPath] = await this.viewCompiled(depPath, data.globals);
        }

        const mainFn = this.$executor(code, ["$ctx", "$deps"]);
        const template: CompiledTemplate = {
            execute: mainFn,
            isAsync: code.includes("await") || (mainFn as any).constructor.name === 'AsyncFunction',
            usedElements: new Set(parser.usedElements),
            path: filename,
            code: code,
            source: content,
            dependencies
        };
        
        if (this.production && !this.$vfiles[filename]) {
            this.$files[key] = template;
        }
        
        return template;
    }

    public async viewCompiled(path: string, extraGlobals: string[] = []): Promise<CompiledTemplate> {
        const resolvedPath = this.resolve(path);
        const key = this.production && !this.$vfiles[resolvedPath] 
            ? `${resolvedPath}:${extraGlobals.sort().join(",")}` 
            : null;

        if (key && this.$files[key]) {
            return this.$files[key]!;
        }
        const content = await this.readFile(resolvedPath);
        const tpl = await this.compileFn(content, resolvedPath, extraGlobals);
        if (key) {
            this.$files[key] = tpl;
        }
        return tpl;
    }

    public async render(
        template: string,
        locals: Record<string, any> = new NullProtoObj(),
        controller?: ReadableStreamDefaultController,
        filename = "template.kire",
    ): Promise<Streaming extends true ? ReadableStream : string> {
        const compiled = await this.compileFn(template, filename, Object.keys(locals));
        return this.run(compiled, locals, false, controller) as any;
    }

    public async view(
        path: string,
        locals: Record<string, any> = new NullProtoObj(),
        controller?: ReadableStreamDefaultController,
    ): Promise<Streaming extends true ? ReadableStream : string> {
        const resolvedPath = this.resolve(path);

        if (this.production && !this.$vfiles[resolvedPath] && this.$files[resolvedPath]) {
            return this.run(this.$files[resolvedPath]!, locals, false, controller) as any;
        }

        const content = await this.readFile(resolvedPath);
        const tpl = await this.compileFn(content, resolvedPath, Object.keys(locals));
        return this.run(tpl, locals, false, controller) as any;
    }

    public run(
        template: CompiledTemplate,
        locals: Record<string, any>,
        children = false,
        controller?: ReadableStreamDefaultController,
    ): Streaming extends true ? ReadableStream : string | Promise<string> {
        return KireRuntime(this as any, locals, {
            ...template,
            name: template.execute.name || 'anonymous',
            children,
            controller,
            usedElements: template.usedElements
        }) as any;
    }

    public renderError(e: any, ctx?: KireContext<Streaming>): string {
        return renderErrorHtml(e, ctx);
    }

    // --- File System & Resolution ---

    public resolve(filepath: string): string {
        return this.resolvePath(filepath);
    }

    private resolvePath(filepath: string): string {
        if (!filepath) return filepath;
        if (filepath.startsWith('http')) return filepath;

        let path = filepath.replace(/\\/g, '/');
        
        const firstSep = path.search(/[.\/]/);
        const prefix = firstSep !== -1 ? path.slice(0, firstSep) : path;
        
        if (this.$namespaces.has(prefix)) {
            const ns = this.$namespaces.get(prefix)!;
            let rest = firstSep !== -1 ? path.slice(firstSep + 1) : '';
            if (rest && !rest.includes('/') && rest.includes('.') && !rest.endsWith('.' + this.$extension)) {
                rest = rest.replace(/\./g, '/');
            }
            path = join(ns, rest).replace(/\\/g, '/');
        } else if (!path.includes('/') && path.includes('.') && !path.endsWith('.' + this.$extension)) {
             path = path.replace(/\./g, '/');
        }

        if (this.$extension) {
            const lastSlash = path.lastIndexOf('/');
            const lastDot = path.lastIndexOf('.');
            if (lastDot === -1 || lastDot < lastSlash) {
                path += `.${this.$extension}`;
            }
        }

        if (!isAbsolute(path)) {
            path = join(this.$root, path).replace(/\\/g, '/');
        }

        return path.replace(/\\/g, '/');
    }

    public readFile(path: string): Promise<string> | string {
        const normalizedPath = path.replace(/\\/g, '/');
        if (this.$vfiles[normalizedPath]) return this.$vfiles[normalizedPath]!;
        if (this.$sources[normalizedPath]) return this.$sources[normalizedPath]!;

        return new Promise((resolve, reject) => {
            readFile(path, 'utf-8', (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    public $existFile(path: string): boolean {
        const resolved = this.resolve(path);
        if (this.$vfiles[resolved] || this.$sources[resolved]) return true;
        return existsSync(resolved);
    }

    public namespace(name: string, path: string) {
        this.$namespaces.set(name, resolve(this.$root, path).replace(/\\/g, '/'));
        return this;
    }

    public isAsync(path: string): boolean {
        const resolved = this.resolve(path);
        if (this.$files.has(resolved)) {
            return this.$files.get(resolved)!.isAsync;
        }
        return true;
    }

    public directive(def: DirectiveDefinition) {
        this.$directives.set(def.name, def);
        this.type({ variable: "@" + def.name, type: 'directive', comment: def.description, example: def.example, tstype: 'directive' });
        if (def.parents) def.parents.forEach(p => this.directive(p));
        return this;
    }

    public getDirective(name: string) {
        return this.$directives.get(name);
    }

    public element(def: ElementDefinition) {
        this.$elements = new Set([def, ...this.$elements]);
        if (typeof def.name === 'string') {
            this.type({ variable: def.name, type: 'element', comment: def.description, tstype: 'element' });
        }
        if (def.parents) def.parents.forEach(p => this.element(p));
        this.rebuildElements();
        return this;
    }

    private rebuildElements() {
        const allElements = Array.from(this.$elements);
        if (allElements.length === 0) return;
        this.$elementMatchers = allElements.map(def => ({ def }));
    }

    public type(def: TypeDefinition) {
        this.$types.set(def.variable, def);
        return this;
    }

    public kireSchema(def: KireSchemaDefinition) {
        this.$schemaDefinition = def;
        return this;
    }

    public cached<T = any>(namespace: string): KireCache<T> {
        if (!this.$cache[namespace]) {
            this.$cache[namespace] = new NullProtoObj();
        }
        return this.$cache[namespace];
    }
}
