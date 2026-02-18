import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, join, isAbsolute, relative } from "node:path";
import { Compiler } from "./compiler";
import { Parser } from "./parser";
import { createKireFunction } from "./runtime";
import { KireError, renderErrorHtml } from "./utils/error";
import { escapeHtml } from "./utils/html";
import { NullProtoObj, createFastMatcher } from "./utils/regex";
import { KireDirectives } from "./directives/index";
import type {
    DirectiveDefinition,
    ElementDefinition,
    ICompilerConstructor,
    IParserConstructor,
    KireOptions,
    KirePlugin,
    KireTplFunction,
    KireRendered,
    KireSchemaDefinition,
    TypeDefinition,
    KireHandler,
    AttributeDefinition
} from "./types";

export interface ElementMatcher {
    def: ElementDefinition;
}

/**
 * The main Kire engine class.
 * Handles configuration, compilation, and rendering of templates.
 */
export class Kire<Asyncronos extends boolean = true> {
    /** Internal storage with optimized objects */
    private ["~directives"] = new NullProtoObj<DirectiveDefinition>();
    private ["~elements"] = new NullProtoObj<ElementDefinition>();
    private ["~namespaces"] = new NullProtoObj<string>();
    private ["~types"] = new NullProtoObj<TypeDefinition>();
    private ["~attributes"] = new NullProtoObj<AttributeDefinition>();
    private ["~varThens"] = new NullProtoObj<KireHandler>();
    private ["~onForkHandlers"]: ((fork: Kire<any>) => void)[] = [];

    /** Map of registered directives (Public Alias) */
    public get $directives() { return new Map(Object.entries(this["~directives"])); }
    
    /** Set of registered custom elements (Public Alias) */
    public get $elements() { return new Set(Object.values(this["~elements"])); }

    /** Map of registered global attributes (Public Alias) */
    public get $attributes() { return new Map(Object.entries(this["~attributes"])); }
    
    /** Internal matchers for elements to optimize parsing */
    public $elementMatchers: ElementMatcher[] = [];
    
    /** Optimized regex pattern for matching elements */
    public $elementsPattern: RegExp = /$^/; 
    
    /** Optimized regex pattern for matching directives */
    public $directivesPattern: RegExp = /$^/;

    /** Global variables available to all templates */
    public $globals: Record<string, any> = {};
    
    /** Shared properties (legacy alias) */
    public $props: Record<string, any> = {};
    
    /** Namespace mappings for template resolution (Public Alias) */
    public get $namespaces() { return new Map(Object.entries(this["~namespaces"])); }

    /** Registered types for type checking support (Public Alias) */
    public get $types() { return new Map(Object.entries(this["~types"])); }

    /** Registered variable handlers for conditional injection (Public Alias) */
    public get $varThens() { return new Map(Object.entries(this["~varThens"])); }
    
    /** Schema definition for the project */
    public $schemaDefinition?: KireSchemaDefinition;

    /** Production mode flag (disables detailed error maps and enables caching) */
    public production: boolean;
    
    /** Root directory for template resolution */
    public $root: string;
    
    /** Default file extension */
    public $extension: string;
    
    /** Async mode flag */
    public $async: Asyncronos;
    
    /** Silent mode flag (suppresses console logs) */
    public $silent: boolean;
    
    /** Variable name for local variables in compiled code */
    public $var_locals: string;
    
    /** Cache of compiled templates */
    public $files: Record<string, KireTplFunction> = new NullProtoObj();
    
    /** Virtual files (memory-based templates) */
    public $vfiles: Record<string, string> = new NullProtoObj();
    
    /** Raw source cache */
    public $sources: Record<string, string> = new NullProtoObj();

    /** NullProtoObj constructor */
    public NullProtoObj = NullProtoObj;

    /** mtime cache for files (path -> mtime) */
    private $mtimes: Record<string, number> = new NullProtoObj();

    /** Set of templates currently being compiled to prevent loops */
    private _compiling: Set<string> = new Set();

    /** Weak cache for dynamic render calls (object -> { template -> compiledFunction }) */
    private _weakCache = new WeakMap<object, Record<string, KireTplFunction>>();

    /** Escape helper */
    public $escape = escapeHtml;

    /** Parent instance if this is a fork */
    public parent?: Kire<any>;

    /** Parser constructor */
    public $parser: IParserConstructor;
    
    /** Compiler constructor */
    public $compiler: ICompilerConstructor;

    constructor(options: KireOptions<Asyncronos> = new NullProtoObj()) {
        if (options.parent) {
            this.parent = options.parent;
            this.production = options.parent.production;
            this.$async = options.parent.$async as Asyncronos;
            this.$extension = options.parent.$extension;
            this.$silent = options.parent.$silent;
            this.$var_locals = options.parent.$var_locals;
            this.$root = options.parent.$root;
            
            this.$parser = options.parent.$parser;
            this.$compiler = options.parent.$compiler;

            // Share caches
            this.$files = options.parent.$files;
            this.$vfiles = options.parent.$vfiles;
            this.$sources = options.parent.$sources;
            this.$mtimes = options.parent['$mtimes'];
            this._pluginCache = options.parent._pluginCache;
            this._weakCache = options.parent._weakCache;

            // Inherit registry references
            this["~directives"] = options.parent["~directives"];
            this["~elements"] = options.parent["~elements"];
            this["~namespaces"] = options.parent["~namespaces"];
            this["~attributes"] = options.parent["~attributes"];
            this.$elementMatchers = options.parent.$elementMatchers;
            this.$elementsPattern = options.parent.$elementsPattern;
            this.$directivesPattern = options.parent.$directivesPattern;
            this["~types"] = options.parent["~types"];
            this["~varThens"] = options.parent["~varThens"];
            this["~onForkHandlers"] = options.parent["~onForkHandlers"];

            // Prototype chain for state isolation
            this.$globals = Object.create(options.parent.$globals);
            this.$props = Object.create(options.parent.$props);
            
            return;
        }

        this.production = options.production ?? process.env.NODE_ENV === 'production';
        this.$async = (options.async ?? true) as Asyncronos;
        this.$extension = options.extension ?? "kire";
        this.$silent = options.silent ?? false;
        this.$var_locals = options.varLocals ?? "it";
        this.$root = options.root ? resolve(options.root).replace(/\\/g, '/') : process.cwd().replace(/\\/g, '/');
        
        this.$parser = options.engine?.parser ?? Parser;
        this.$compiler = options.engine?.compiler ?? Compiler;

        if (options.files) {
            for (const key in options.files) {
                this.$sources[this.resolvePath(key)] = options.files[key]!;
            }
        }

        if (options.vfiles) {
            for (const key in options.vfiles) {
                this.$vfiles[this.resolvePath(key)] = options.vfiles[key]!;
            }
        }

        if (options.attributes) {
            for (const [key, val] of Object.entries(options.attributes)) {
                this.attribute(val);
            }
        }

        if (options.bundled) {
            for (const key in options.bundled) {
                const item = options.bundled[key]!;
                const path = this.resolvePath(key);
                this.$files[path] = item as KireTplFunction;
            }
        }

        if (options.directives !== false) this.plugin(KireDirectives);
        if (options.plugins) {
            for (const p of options.plugins) {
                const [plugin, opts] = Array.isArray(p) ? p : [p, undefined];
                this.plugin(plugin, opts);
            }
        }
    }

    /**
     * Creates a new Kire instance that inherits from this one.
     * Useful for request-specific contexts.
     */
    public fork(): Kire<Asyncronos> {
        const fork = new Kire<Asyncronos>({ parent: this as any });
        
        // Notify handlers
        for (const handler of this["~onForkHandlers"]) {
            handler(fork as any);
        }
        
        return fork;
    }

    /**
     * Registers a callback to be called when a fork is created.
     */
    public onFork(callback: (fork: Kire<any>) => void) {
        this["~onForkHandlers"].push(callback);
        return this;
    }

    /**
     * Loads a plugin into the Kire instance.
     * @param plugin The plugin object or function.
     * @param opts Optional configuration for the plugin.
     */
    public plugin<KirePlugged extends KirePlugin<any>>(plugin: KirePlugged, opts?: any) {
        plugin.load(this as any, opts); return this;
    }

    /**
     * Registers a conditional variable handler.
     * If the variable is used in the template, the callback is executed during compilation.
     * @param name The variable name to watch for.
     * @param callback The callback to execute.
     */
    public varThen(name: string, callback: KireHandler) {
        this["~varThens"][name] = callback;
        return this;
    }

    private _pluginCache: Record<string, any> = new NullProtoObj();

    /**
     * Returns a persistent cache Object for a specific key (e.g. plugin name).
     * @param key Namespace key
     */
    public cached(key: string): Record<any, any> {
        if (!this._pluginCache[key]) {
            this._pluginCache[key] = new NullProtoObj();
        }
        return this._pluginCache[key]!;
    }

    /**
     * Registers a global attribute definition.
     */
    public attribute(def: AttributeDefinition) {
        this["~attributes"][def.name] = def;
        return this;
    }

    /**
     * Generates a schema object for the project.
     * @param name Project name
     */
    public pkgSchema(name: string) {
        const schema: any = {
            name,
            directives: {},
            elements: {},
            attributes: {},
            types: [],
            ...this.$schemaDefinition
        };

        for (const key in this["~directives"]) {
            const def = this["~directives"][key];
            schema.directives[key] = {
                params: def.params,
                children: def.children,
                description: def.description,
                example: def.example,
                related: def.related
            };
        }

        for (const key in this["~elements"]) {
            const def = this["~elements"][key];
            schema.elements[key] = {
                void: def.void,
                description: def.description,
                example: def.example,
                related: def.related
            };
        }

        for (const key in this["~attributes"]) {
            const def = this["~attributes"][key];
            schema.attributes[key] = {
                type: def.type,
                description: def.description,
                example: def.example
            };
        }

        for (const key in this["~types"]) {
            schema.types.push(this["~types"][key]);
        }

        return schema;
    }

    /**
     * Parses a template string into an AST.
     * @param content The template content.
     */
    public parse(content: string): any[] {
        const parser = new this.$parser(content, this as any);
        return parser.parse();
    }

    /**
     * Registers a global variable.
     * @param key The variable name.
     * @param value The value.
     */
    public $global(key: string, value: any) { this.$globals[key] = value; return this; }
    
    /**
     * Registers a shared property (alias for globals/props).
     * @param key The property name.
     * @param value The value.
     */
    public $prop(key: string, value: any) { this.$props[key] = value; return this; }

    /**
     * Compiles a template string into a KireTplFunction.
     * @param content The template source code.
     * @param filename The filename for debug/source map purposes.
     * @param extraGlobals List of extra global variable names to inject.
     */
    public compile(content: string, filename = "template.kire", extraGlobals: string[] = []): KireTplFunction {
        if (this._compiling.has(filename)) {
            throw new Error(`Circular dependency detected while compiling: ${filename}`);
        }
        
        this._compiling.add(filename);
        try {
            const parser = new this.$parser(content, this as any);
            const nodes = parser.parse();
            const compilerInstance = new this.$compiler(this as any, filename);
            const code = compilerInstance.compile(nodes, extraGlobals);

            const isAsync = compilerInstance.isAsync;
            
            // Convert Map to Record for metadata
            const dependencies: Record<string, string> = new NullProtoObj();
            for (const [path, id] of compilerInstance.getDependencies()) {
                dependencies[path] = id;
            }

            const AsyncFunc = (async () => {}).constructor;
            try {
                const coreFunction = isAsync 
                    ? new (AsyncFunc as any)("$props, $globals, $kire", code)
                    : new Function("$props, $globals, $kire", code);

                return createKireFunction(this as any, coreFunction, {
                    async: isAsync,
                    path: filename,
                    code,
                    source: content,
                    map: undefined, 
                    dependencies
                });
            } catch (syntaxError) {
                if (!this.$silent) {
                    console.log("FAILED CODE:\n", code);
                }
                throw syntaxError;
            }
        } catch (e) {
            if (!this.$silent) {
                console.error(`Compilation error in ${filename}:`);
                console.error(e);
            }
            if (e instanceof KireError) throw e;
            throw new KireError(e as Error, { execute: () => {}, isAsync: false, path: filename, code: "", source: content, map: undefined, dependencies: new NullProtoObj() } as any);
        } finally {
            this._compiling.delete(filename);
        }
    }

    /**
     * Compiles all templates in the given directories and bundles them into a single JS file.
     * This file can be loaded into Kire's bundled cache.
     * @param directories List of directories to scan for templates.
     * @param outputFile The output file path for the bundle.
     */
    public compileAndBuild(directories: string[], outputFile: string) {
        const bundled: Record<string, string> = {};
        
        const scan = (dir: string) => {
            if (!existsSync(dir)) return;
            const items = readdirSync(dir);
            for (const item of items) {
                const fullPath = join(dir, item).replace(/\\/g, '/');
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    scan(fullPath);
                } else if (stat.isFile() && (fullPath.endsWith(this.$extension) || fullPath.endsWith('.kire'))) {
                    const content = readFileSync(fullPath, 'utf-8');
                    const resolved = relative(this.$root, fullPath).replace(/\\/g, '/');
                    
                    // Compile directly to get the code string
                    const parser = new this.$parser(content, this as any);
                    const nodes = parser.parse();
                    const compilerInstance = new this.$compiler(this as any, resolved);
                    const code = compilerInstance.compile(nodes, []);
                    
                    // We need to wrap it in a function string
                    const isAsync = compilerInstance.isAsync;
                    bundled[resolved] = isAsync 
                        ? `async function($props = {}, $globals = {}) {\n${code}\n}`
                        : `function($props = {}, $globals = {}) {\n${code}\n}`;
                }
            }
        };

        for (const dir of directories) {
            scan(resolve(this.$root, dir).replace(/\\/g, '/'));
        }

        const isCjs = typeof module !== 'undefined';
        const exportLine = isCjs ? 'module.exports = _kire_bundled;' : 'export default _kire_bundled;';

        const output = `
// Kire Bundled Templates
// Generated at ${new Date().toISOString()}

const _kire_bundled = {
${Object.entries(bundled).map(([key, fn]) => `  "${key}": ${fn}`).join(',\n')}
};

${exportLine}
`;
        writeFileSync(outputFile, output, 'utf-8');
    }

    /**
     * Gets a compiled template from cache or compiles it from file.
     * Synchronous operation.
     * @param path The file path.
     */
    public getOrCompile(path: string): KireTplFunction {
        const resolved = this.resolvePath(path);
        
        if (this.$files[resolved]) return this.$files[resolved];
        
        // In dev mode, check mtime if it's a real file
        if (!this.production && existsSync(resolved)) {
            const mtime = statSync(resolved).mtimeMs;
            if (this.$files[resolved] && this.$mtimes[resolved] === mtime) {
                return this.$files[resolved];
            }
            this.$mtimes[resolved] = mtime;
        } else if (this.$files[resolved]) {
            return this.$files[resolved];
        }
        
        const content = this.readFile(resolved);
        const compiled = this.compile(content, resolved);
        
        this.$files[resolved] = compiled;
        return compiled;
    }

    /**
     * Renders a raw template string.
     * @param template The template string.
     * @param locals Local variables.
     * @param globals Optional extra global variables.
     * @param filename Filename for debug.
     */
    public render(template: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>, filename = "template.kire"): KireRendered<Asyncronos> {
        // Optimization: Try to find in weak cache first
        const cacheKey = (locals && typeof locals === 'object') ? locals : (globals && typeof globals === 'object' ? globals : null);
        
        if (cacheKey) {
            let record = this._weakCache.get(cacheKey);
            if (record && record[template]) return this.run(record[template], locals, globals);
            
            if (!record) {
                record = new NullProtoObj();
                this._weakCache.set(cacheKey, record);
            }
            
            const compiled = this.compile(template, filename, Object.keys(locals));
            record[template] = compiled;
            return this.run(compiled, locals, globals);
        }

        const compiled = this.compile(template, filename, Object.keys(locals));
        return this.run(compiled, locals, globals);
    }

    /**
     * Renders a template from a file.
     * @param path The file path.
     * @param locals Local variables.
     * @param globals Optional extra global variables.
     */
    public view(path: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>): KireRendered<Asyncronos> {
        const compiled = this.getOrCompile(path);
        return this.run(compiled, locals, globals);
    }

    /**
     * Runs a pre-compiled template function.
     * @param template The compiled template function.
     * @param locals Local variables.
     * @param globals Optional global variables.
     */
    public run(template: KireTplFunction, locals: Record<string, any>, globals?: Record<string, any>): KireRendered<Asyncronos> {
        try {
            const result = template.call(this, locals, globals, template);
            
            if (!this.$async && result instanceof Promise) {
                 throw new Error(`Template ${template.meta.path} contains async code but was called synchronously.`);
            }

            return result as any;
        } catch (e) {
            throw e instanceof KireError ? e : new KireError(e as Error, template);
        }
    }

    /**
     * Resolves a file path using configured root and namespaces.
     * @param path The raw path.
     */
    public resolve(path: string): string { return this.resolvePath(path); }

    /**
     * Internal path resolution logic.
     * @param filepath The path to resolve.
     */
    public resolvePath(filepath: string): string {
        if (!filepath || filepath.startsWith('http')) return filepath;
        let path = filepath.replace(/\\/g, '/');
        const ext = '.' + this.$extension;

        // 1. Handle Namespaces (e.g., ~/path or ns.path)
        let matchedNS = false;
        for (const ns in this["~namespaces"]) {
            // Check for prefix match: "ns/" or "ns."
            if (path.startsWith(ns + '/') || path.startsWith(ns + '.')) {
                const target = this["~namespaces"][ns]!;
                let suffix = path.slice(ns.length + 1);
                
                // Only replace dots and add extension if it doesn't already have it
                if (!suffix.endsWith(ext)) {
                    suffix = suffix.replace(/\./g, '/') + ext;
                }
                
                path = join(target, suffix).replace(/\\/g, '/');
                matchedNS = true;
                break;
            }
        }

        // 2. Legacy/Fallback resolution if no namespace prefix matched
        if (!matchedNS) {
            if (path.includes('.')) {
                const parts = path.split('.');
                const ns = parts[0]!;
                // Check if the first part is a registered namespace
                if (this["~namespaces"][ns]) {
                    const target = this["~namespaces"][ns]!;
                    let suffix = parts.slice(1).join('/');
                    if (!suffix.endsWith(ext)) suffix += ext;
                    path = join(target, suffix).replace(/\\/g, '/');
                } else if (!path.endsWith(ext)) {
                    // Treat all dots as separators if extension is missing
                    path = path.replace(/\./g, '/') + ext;
                }
            } else if (!path.endsWith(ext)) {
                path += ext;
            }
        }

        // 3. Final normalization
        if (!isAbsolute(path)) path = join(this.$root, path).replace(/\\/g, '/');
        return path.replace(/\\/g, '/');
    }

    /**
     * Synchronously reads a file from the filesystem or memory.
     * @param path The resolved file path.
     */
    public readFile(path: string): string {
        const normalized = path.replace(/\\/g, '/');
        if (this.$vfiles[normalized]) return this.$vfiles[normalized]!;
        if (this.$sources[normalized]) return this.$sources[normalized]!;
        
        if (existsSync(path)) {
            return readFileSync(path, 'utf-8');
        }
        throw new Error(`Template file not found: ${path}`);
    }

    /**
     * Registers a namespace for template resolution.
     * @param name The namespace prefix.
     * @param path The directory path.
     */
    public namespace(name: string, path: string) {
        this["~namespaces"][name] = resolve(this.$root, path).replace(/\\/g, '/'); return this;
    }

    /**
     * Registers a directive.
     * @param def The directive definition.
     */
    public directive(def: DirectiveDefinition) { 
        this["~directives"][def.name] = def; 
        this.$directivesPattern = createFastMatcher(Object.keys(this["~directives"]));
        return this; 
    }
    
    public getDirective(name: string) { return this["~directives"][name]; }
    
    /**
     * Registers a custom element.
     * @param def The element definition.
     */
    public element(def: ElementDefinition) { 
        const name = def.name;
        if (typeof name === "string") {
            this["~elements"][name] = def;
        } else if (name instanceof RegExp) {
            this["~elements"][name.source] = def;
        }
        this.$elementMatchers.unshift({ def }); 
        this.$elementsPattern = createFastMatcher(
            Object.values(this["~elements"]).map(m => m.name)
        );
        return this; 
    }

    /**
     * Registers schema information.
     */
    public kireSchema(def: KireSchemaDefinition) { this.$schemaDefinition = def; return this; }
    
    /**
     * Registers a type definition.
     */
    public type(def: TypeDefinition) { this["~types"][def.variable] = def; return this; }
    
    /**
     * Renders an error into HTML.
     */
    public renderError(e: any, ctx?: any): string { return renderErrorHtml(e, this as any, ctx); }
}
