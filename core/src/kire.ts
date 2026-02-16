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
    KireHandler
} from "./types";

export interface ElementMatcher {
    def: ElementDefinition;
}

/**
 * The main Kire engine class.
 * Handles configuration, compilation, and rendering of templates.
 */
export class Kire<Streaming extends boolean = false, Asyncronos extends boolean = true> {
    /** Map of registered directives */
    public $directives: Map<string, DirectiveDefinition> = new Map();
    
    /** Set of registered custom elements */
    public $elements: Set<ElementDefinition> = new Set();
    
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
    
    /** Namespace mappings for template resolution */
    public $namespaces: Map<string, string> = new Map();

    /** Registered types for type checking support */
    public $types: Map<string, TypeDefinition> = new Map();

    /** Registered variable handlers for conditional injection */
    public $varThens: Map<string, KireHandler> = new Map();
    
    /** Schema definition for the project */
    public $schemaDefinition?: KireSchemaDefinition;

    /** Production mode flag (disables detailed error maps and enables caching) */
    public production: boolean;
    
    /** Root directory for template resolution */
    public $root: string;
    
    /** Default file extension */
    public $extension: string;
    
    /** Stream mode flag */
    public $stream: Streaming;
    
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

    /** Escape helper */
    public $escape = escapeHtml;

    /** Parser constructor */
    public $parser: IParserConstructor;
    
    /** Compiler constructor */
    public $compiler: ICompilerConstructor;

    constructor(options: KireOptions<Streaming, Asyncronos> = new NullProtoObj()) {
        this.production = options.production ?? process.env.NODE_ENV === 'production';
        this.$stream = (options.stream ?? false) as Streaming;
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
     * Loads a plugin into the Kire instance.
     * @param plugin The plugin object or function.
     * @param opts Optional configuration for the plugin.
     */
    public plugin<KirePlugged extends KirePlugin<any>>(plugin: KirePlugged, opts?: any) {
        plugin.load(this, opts); return this;
    }

    /**
     * Registers a conditional variable handler.
     * If the variable is used in the template, the callback is executed during compilation.
     * @param name The variable name to watch for.
     * @param callback The callback to execute.
     */
    public varThen(name: string, callback: KireHandler) {
        this.$varThens.set(name, callback);
        return this;
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
            // If already compiling, we can't inline yet. 
            // In a better system we'd return a proxy, but for now we just throw to avoid stack overflow
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
            const coreFunction = isAsync 
                ? new (AsyncFunc as any)("$props = {}", "$globals = {}", code)
                : new Function("$props = {}", "$globals = {}", code);

            return createKireFunction(this as any, coreFunction, {
                async: isAsync,
                path: filename,
                code,
                source: content,
                map: undefined, 
                dependencies
            });
        } catch (e) {
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
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    scan(fullPath);
                } else if (stat.isFile() && (fullPath.endsWith(this.$extension) || fullPath.endsWith('.kire'))) {
                    const content = readFileSync(fullPath, 'utf-8');
                    const resolved = this.resolvePath(fullPath);
                    // Compile directly to get the code string
                    const parser = new this.$parser(content, this as any);
                    const nodes = parser.parse();
                    const compilerInstance = new this.$compiler(this as any, resolved);
                    const code = compilerInstance.compile(nodes, []);
                    
                    // We need to wrap it in a function string
                    const isAsync = compilerInstance.isAsync;
                    bundled[resolved] = isAsync 
                        ? `async function($props = {}, $globals = {}) { ${code} }`
                        : `function($props = {}, $globals = {}) { ${code} }`;
                }
            }
        };

        for (const dir of directories) {
            scan(resolve(this.$root, dir));
        }

        const output = `
// Kire Bundled Templates
// Generated at ${new Date().toISOString()}

module.exports = {
${Object.entries(bundled).map(([key, fn]) => `  "${key}": ${fn}`).join(',\n')}
};
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
        
        if (this.production && this.$files[resolved]) return this.$files[resolved];
        
        // In dev mode, check mtime
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
    public render(template: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>, filename = "template.kire"): KireRendered<Streaming, Asyncronos> {
        const compiled = this.compile(template, filename, Object.keys(locals));
        return this.run(compiled, locals, globals);
    }

    /**
     * Renders a template from a file.
     * @param path The file path.
     * @param locals Local variables.
     * @param globals Optional extra global variables.
     */
    public view(path: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>): KireRendered<Streaming, Asyncronos> {
        const compiled = this.getOrCompile(path);
        return this.run(compiled, locals, globals);
    }

    /**
     * Runs a pre-compiled template function.
     * @param template The compiled template function.
     * @param locals Local variables.
     * @param globals Optional global variables.
     */
    public run(template: KireTplFunction, locals: Record<string, any>, globals?: Record<string, any>): KireRendered<Streaming, Asyncronos> {
        if (this.$stream) {
            const encoder = new TextEncoder();
            return new ReadableStream({
                async start(controller) {
                    try {
                        const result = template.call(this as any, locals, globals);
                        const final = result instanceof Promise ? await result : result;
                        if (final) controller.enqueue(encoder.encode(final));
                        controller.close();
                    } catch (e) {
                        controller.error(e);
                    }
                }
            }) as any;
        }

        const result = template.call(this, locals, globals);
        
        if (!this.$async && result instanceof Promise) {
             throw new Error(`Template ${template.meta.path} contains async code but was called synchronously.`);
        }

        return result as any;
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
        if (path.includes('.')) {
            const parts = path.split('.'); const ns = parts[0]!;
            if (this.$namespaces.has(ns)) path = join(this.$namespaces.get(ns)!, parts.slice(1).join('/')).replace(/\\/g, '/');
            else if (!path.endsWith('.' + this.$extension)) path = path.replace(/\./g, '/');
        }
        if (!path.endsWith('.' + this.$extension)) {
            const lastSlash = path.lastIndexOf('/'); const lastDot = path.lastIndexOf('.');
            if (lastDot === -1 || lastDot < lastSlash) path += `.${this.$extension}`;
        }
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
        this.$namespaces.set(name, resolve(this.$root, path).replace(/\\/g, '/')); return this;
    }

    /**
     * Registers a directive.
     * @param def The directive definition.
     */
    public directive(def: DirectiveDefinition) { 
        this.$directives.set(def.name, def); 
        this.$directivesPattern = createFastMatcher(Array.from(this.$directives.keys()));
        return this; 
    }
    
    public getDirective(name: string) { return this.$directives.get(name); }
    
    /**
     * Registers a custom element.
     * @param def The element definition.
     */
    public element(def: ElementDefinition) { 
        this.$elements.add(def); 
        this.$elementMatchers.unshift({ def }); 
        this.$elementsPattern = createFastMatcher(
            this.$elementMatchers.map(m => m.def.name)
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
    public type(def: TypeDefinition) { this.$types.set(def.variable, def); return this; }
    
    /**
     * Renders an error into HTML.
     */
    public renderError(e: any, ctx?: any): string { return renderErrorHtml(e, this, ctx); }
}
