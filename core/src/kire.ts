import { readFile, existsSync } from "node:fs";
import { resolve, join, dirname, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
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

export interface ElementMatcher {
    def: ElementDefinition;
}

export class Kire {
    public $scoped = scoped;
    public $error = KireError;

    public $directives: Map<string, DirectiveDefinition> = new Map();
    public $elements: Set<ElementDefinition> = new Set();
    
    // Elements Cache
    public $elementMatchers: ElementMatcher[] = [];

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
    public $cache: Record<string, any> = new NullProtoObj();

    public $parser: IParserConstructor;
    public $compiler: ICompilerConstructor;
    public $var_locals: string;
    public $executor: KireExecutor;

    public $hooks: KireHooks;
    protected $parent?: Kire;

    public $types: Map<string, TypeDefinition> = new Map();
    public $schemaDefinition?: KireSchemaDefinition;
    public $virtualFiles: Record<string, string> = new NullProtoObj();

    constructor(options: KireOptions = {}) {
        this.production = options.production ?? process.env.NODE_ENV === 'production';
        this.$stream = options.stream ?? false;
        this.$extension = options.extension ?? "kire";
        this.$silent = options.silent ?? false;
        this.$var_locals = options.varLocals ?? "it";
        this.$parent = options.parent;
        this.$root = options.root ? resolve(options.root).replace(/\\/g, '/') : process.cwd().replace(/\\/g, '/');
        
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
            this.$elementMatchers = this.$parent.$elementMatchers;
            this.$elementRegex = this.$parent.$elementRegex;
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

        this.rebuildElements();
        (this.$error as any).html = (e: any, ctx?: KireContext) => this.renderError(e, ctx);
    }

    public fork(): Kire {
        return new Kire({ parent: this });
    }

    public cacheClear() {
        this.$files.clear();
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
        this.type({
            variable: key,
            type: 'global',
            comment: `Global Variable ${key} (${typeName})`,
            tstype: typeName
        });
        return this;
    }

    public $ctx(key: string, value: any) {
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
        
        if (!this.$elementRegex) this.rebuildElements();

        const parser = new this.$parser(content, this);
        const nodes = parser.parse();
        const compiler = new this.$compiler(this, filename);
        const code = compiler.compile(nodes, globals, parser.usedElements) as string;

        let mainFn;
        try {
            mainFn = this.$executor(code, ["$ctx"]);
        } catch (e) {
            console.error("Error compiling template function:");
            console.error(code);
            throw e;
        }
        const template: CompiledTemplate = {
            execute: mainFn,
            isAsync: code.includes("await") || (mainFn as any).constructor.name === 'AsyncFunction',
            usedElements: new Set(parser.usedElements),
            path: filename,
            code: code,
            source: content
        };
        
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
            usedElements: template.usedElements
        });
    }

    public renderError(e: any, ctx?: KireContext): string {
        return renderErrorHtml(e, ctx);
    }

    // --- File System & Resolution ---

    public resolvePath(filepath: string): string {
        if (!filepath) return filepath;
        if (filepath.startsWith('http')) return filepath;

        let path = filepath.replace(/\\/g, '/');
        
        // Handle namespaces
        const firstSep = path.search(/[.\/]/);
        const prefix = firstSep !== -1 ? path.slice(0, firstSep) : path;
        
        if (this.$namespaces.has(prefix)) {
            const ns = this.$namespaces.get(prefix)!;
            const rest = firstSep !== -1 ? path.slice(firstSep + 1).replace(/\./g, '/') : '';
            path = join(ns, rest).replace(/\\/g, '/');
        } else if (!path.includes('/') && path.includes('.')) {
             path = path.replace(/\./g, '/');
        }

        // Add Extension if missing
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
        if (this.$virtualFiles[normalizedPath]) return this.$virtualFiles[normalizedPath]!;

        return new Promise((resolve, reject) => {
            readFile(path, 'utf-8', (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    public namespace(name: string, path: string) {
        this.$namespaces.set(name, resolve(this.$root, path).replace(/\\/g, '/'));
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

    public element(def: ElementDefinition) {
        // Add to the beginning to ensure precedence over previous/native elements
        this.$elements = new Set([def, ...this.$elements]);
        
        if (typeof def.name === 'string') {
            this.type({ variable: def.name, type: 'element', comment: def.description, tstype: 'element' });
        }
        
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
