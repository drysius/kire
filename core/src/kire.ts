import { readFile, existsSync } from "node:fs";
import { resolve, join, dirname, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { Compiler } from "./compiler";
import { KireDirectives } from "./directives";
import { Parser } from "./parser";
import KireRuntime from "./runtime";
import { KireError, renderErrorHtml } from "./utils/error";
import type {
    DirectiveDefinition,
    ElementDefinition,
    ICompilerConstructor,
    IParserConstructor,
    KireCache,
    KireElementHandler,
    KireElementOptions,
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

export class Kire {
    public $scoped = scoped;
    public $error = KireError;

    public $directives: Map<string, DirectiveDefinition> = new Map();
    public $elements: Set<ElementDefinition> = new Set();
    
    // Optimized: Use objects instead of Maps for performance
    public $globals: Record<string, any>;
    public $props: Record<string, any>;
    public $namespaces: Map<string, string> = new Map();

    public production: boolean;
    public $root: string;
    public $extension: string;
    public $stream: boolean;
    public $silent: boolean;
    
    // Cache
    public $files: Map<string, CompiledTemplate> = new Map();
    public $cache: Record<string, any> = {};

    public $parser: IParserConstructor;
    public $compiler: ICompilerConstructor;
    public $var_locals: string;
    public $executor: KireExecutor;

    public $hooks: KireHooks;
    protected $parent?: Kire;

    public $types: Map<string, TypeDefinition> = new Map();
    public $schemaDefinition?: KireSchemaDefinition;
    public $virtualFiles: Record<string, string> = {};

    constructor(options: KireOptions = {}) {
        this.production = options.production ?? process.env.NODE_ENV === 'production';
        this.$stream = options.stream ?? false;
        this.$extension = options.extension ?? "kire";
        this.$silent = options.silent ?? false;
        this.$var_locals = options.varLocals ?? "it";
        this.$parent = options.parent;
        this.$root = options.root ? resolve(options.root) : process.cwd();
        
        if (options.files) {
            for (const key in options.files) {
                this.$virtualFiles[this.resolvePath(key)] = options.files[key]!;
            }
        }

        if (options.bundled) {
            for (const key in options.bundled) {
                const item = options.bundled[key]!;
                if (typeof item === 'function') {
                    this.$files.set(this.resolvePath(key), {
                        execute: item,
                        isAsync: (item as any)._isAsync ?? true,
                        path: key,
                        code: "",
                        source: "",
                        usedElements: (item as any)._usedElements
                    });
                } else {
                    this.$files.set(this.resolvePath(key), item);
                }
            }
        }

        // Optimized Hooks
        this.$hooks = new KireHooks();

        // Optimized Scope (Prototype Chain)
        if (this.$parent) {
            this.$globals = Object.create(this.$parent.$globals);
            this.$props = Object.create(this.$parent.$props);
            
            // Inherit config
            this.$executor = this.$parent.$executor;
            this.$parser = this.$parent.$parser;
            this.$compiler = this.$parent.$compiler;
            this.$files = this.$parent.$files;
            this.$cache = this.$parent.$cache;
            this.$directives = this.$parent.$directives;
            this.$elements = this.$parent.$elements;
            this.$namespaces = this.$parent.$namespaces;
            this.$types = this.$parent.$types;
            this.$schemaDefinition = this.$parent.$schemaDefinition;
            
            // Merge hooks? usually forks have their own lifecycle hooks
            // But we might want to trigger parent hooks? 
            // For now, fresh hooks for the fork.
        } else {
            this.$globals = {};
            this.$props = {};

            this.$executor = options.executor ?? ((code, params) => {
                const isAsync = code.includes("await");
                if (isAsync) return new AsyncFunction(...params, code);
                return new Function(...params, code);
            });
            this.$parser = options.engine?.parser ?? Parser;
            this.$compiler = options.engine?.compiler ?? Compiler;
            
            // Load Plugins
            if (options.directives !== false) {
                this.plugin(KireDirectives);
                nativeElements(this);
            }

            if (options.plugins) {
                const sorted = options.plugins.map(p => Array.isArray(p) ? { p: p[0], o: p[1] } : { p }).sort((a, b) => (a.p.sort ?? 100) - (b.p.sort ?? 100));
                for (const item of sorted) this.plugin(item.p, item.o);
            }
        }

        (this.$error as any).html = (e: any, ctx?: KireContext) => this.renderError(e, ctx);
    }

    public fork(): Kire {
        return new Kire({ parent: this });
    }

    public cacheClear() {
        this.$files.clear();
        this.$cache = {};
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
            Object.assign(this.$props, keyOrObj);
        }
        return this;
    }

    public $global(key: string, value: any) {
        this.$globals[key] = value;
        
        const typeName = typeof value;
        this.type({
            variable: key,
            type: 'global',
            comment: `Global Variable ${key} (${typeName})`,
            tstype: typeName
        });
        return this;
    }

    public $ctx(key: string, value: any) {
        // Legacy support: $ctx was often used for globals or helpers
        // We'll put it in globals for now, or create a specific context helper registry?
        // Kire 1.0 logic puts it in $contexts layered map.
        // We'll put it in $globals as that's the fastest access.
        this.$globals[key] = value;
        
        const typeName = typeof value;
        this.type({
            variable: "$ctx." + key,
            type: 'context',
            comment: `Context Helper $ctx.${key}`,
            tstype: typeName
        });
        return this;
    }

    // --- Compilation & Rendering ---

    public parse(template: string) {
        const parser = new this.$parser(template, this);
        return parser.parse();
    }

    public compile(template: string, filename?: string, globals: string[] = []): string {
        const parser = new this.$parser(template, this);
        const nodes = parser.parse();
        const compiler = new this.$compiler(this, filename);
        return compiler.compile(nodes, globals, parser.usedElements) as string;
    }

    public compileFn(content: string, filename = "template.kire", globals: string[] = []): CompiledTemplate | Promise<CompiledTemplate> {
        const key = this.production && filename !== "template.kire" 
            ? `${filename}:${globals.sort().join(",")}` 
            : `tpl:${content.length}:${content.slice(0, 100)}:${globals.sort().join(",")}`;
        
        if (this.production && this.$files.has(key)) return this.$files.get(key)!;
        
        const parser = new this.$parser(content, this);
        const nodes = parser.parse();
        const compiler = new this.$compiler(this, filename);
        const code = compiler.compile(nodes, globals, parser.usedElements) as string;

        const mainFn = this.$executor(code, ["$ctx"]);
        const template: CompiledTemplate = {
            execute: mainFn,
            isAsync: code.includes("await") || (mainFn as any).constructor.name === 'AsyncFunction',
            usedElements: new Set(parser.usedElements),
            path: filename,
            code: code,
            source: content
        };
        
        if (!this.production) {
            // console.log(`[Kire Debug] Generated code for ${filename}:\n${code}`);
        }
        
        if (this.production) {
            this.$files.set(key, template);
        }
        
        return template;
    }

    public render(
        template: string,
        locals: Record<string, any> = {},
        controller?: ReadableStreamDefaultController,
        filename = "template.kire",
    ): string | Promise<string | ReadableStream> | ReadableStream {
        const compiled = this.compileFn(template, filename, Object.keys(locals));
        
        if (compiled instanceof Promise) {
            return compiled.then(tpl => this.run(tpl, locals, false, controller));
        }

        return this.run(compiled, locals, false, controller);
    }

    public view(
        path: string,
        locals: Record<string, any> = {},
        controller?: ReadableStreamDefaultController,
    ): string | Promise<string | ReadableStream> | ReadableStream {
        const resolvedPath = this.resolvePath(path);

        if (this.production && this.$files.has(resolvedPath)) {
            return this.run(this.$files.get(resolvedPath)!, locals, false, controller);
        }

        const contentPromise = this.readFile(resolvedPath);
        if (contentPromise instanceof Promise) {
            return contentPromise.then(async content => {
                const tpl = await this.compileFn(content, resolvedPath, Object.keys(locals));
                return this.run(tpl, locals, false, controller);
            });
        }
        
        const tplPromise = this.compileFn(contentPromise, resolvedPath, Object.keys(locals));
        if (tplPromise instanceof Promise) {
            return tplPromise.then(tpl => this.run(tpl, locals, false, controller));
        }
        
        return this.run(tplPromise, locals, false, controller);
    }

    public run(
        template: CompiledTemplate,
        locals: Record<string, any>,
        children = false,
        controller?: ReadableStreamDefaultController,
    ): string | Promise<string | ReadableStream> | ReadableStream {
        return KireRuntime(this, locals, {
            ...template,
            name: template.execute.name || 'anonymous',
            children,
            controller,
        });
    }

    public renderError(e: any, ctx?: KireContext): string {
        return renderErrorHtml(e, ctx);
    }

    // --- File System & Resolution ---

    public resolvePath(filepath: string): string {
        // 1. Check aliases/namespaces
        if (filepath.includes('.')) {
             // Handle "namespace.view" or "dir.file"
             // Simplified resolution logic for speed
             const parts = filepath.split('.');
             if (this.$namespaces.has(parts[0]!)) {
                 const ns = this.$namespaces.get(parts[0]!)!;
                 const rest = parts.slice(1).join('/');
                 filepath = join(ns, rest);
             } else {
                 filepath = filepath.replace(/\./g, '/');
             }
        }

        // 2. Add Extension
        if (this.$extension && !filepath.endsWith(`.${this.$extension}`)) {
            filepath += `.${this.$extension}`;
        }

        // 3. Resolve absolute
        if (!isAbsolute(filepath)) {
            filepath = join(this.$root, filepath);
        }

        return filepath;
    }

    public readFile(path: string): Promise<string> | string {
        if (this.$virtualFiles[path]) return this.$virtualFiles[path]!;

        return new Promise((resolve, reject) => {
            readFile(path, 'utf-8', (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    public namespace(name: string, path: string) {
        this.$namespaces.set(name, resolve(this.$root, path));
        return this;
    }

    // --- Definitions ---

    public isAsync(path: string): boolean {
        const resolved = this.resolvePath(path);
        if (this.$files.has(resolved)) {
            return this.$files.get(resolved)!.isAsync;
        }
        return true;
    }

    public directive(def: DirectiveDefinition) {
        this.$directives.set(def.name, def);
        this.type({
            variable: "@" + def.name,
            type: 'directive',
            comment: def.description,
            example: def.example,
            tstype: 'directive'
        });
        if (def.parents) def.parents.forEach(p => this.directive(p));
        return this;
    }

    public getDirective(name: string) {
        return this.$directives.get(name);
    }

    public element(nameOrDef: string | RegExp | ElementDefinition, handler?: KireElementHandler, opts?: KireElementOptions) {
        if (typeof nameOrDef === "object" && !("source" in nameOrDef)) {
            const def = nameOrDef as ElementDefinition;
            this.$elements.add(def);
            if (typeof def.name === 'string') {
                this.type({ variable: def.name, type: 'element', comment: def.description, tstype: 'element' });
            }
        } else {
            if (!handler) throw new Error("Handler required");
            const name = nameOrDef as string | RegExp;
            this.$elements.add({ name, void: opts?.void ?? false, run: handler });
        }
        return this;
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
            this.$cache[namespace] = {};
        }
        return this.$cache[namespace];
    }
}
