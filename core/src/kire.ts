import { readFile, existsSync } from "node:fs";
import { resolve, join, isAbsolute } from "node:path";
import { Compiler } from "./compiler";
import { Parser } from "./parser";
import { createKireFunction } from "./runtime";
import { KireError, renderErrorHtml } from "./utils/error";
import { NullProtoObj, createFastMatcher } from "./utils/regex";
import { KireDirectives } from "./directives/index";
import type {
    DirectiveDefinition,
    ElementDefinition,
    ICompilerConstructor,
    IParserConstructor,
    KireOptions,
    KirePlugin,
    KireContext,
    KireTplFunction,
    KireRendered,
    DependencyMetadata,
    KireSchemaDefinition,
    TypeDefinition
} from "./types";

export interface ElementMatcher {
    def: ElementDefinition;
}

export class Kire<Streaming extends boolean = false, Asyncronos extends boolean = true> {
    public $directives: Map<string, DirectiveDefinition> = new Map();
    public $elements: Set<ElementDefinition> = new Set();
    public $elementMatchers: ElementMatcher[] = [];
    
    // Optimized Matchers
    public $elementsPattern: RegExp = /$^/; // Matches nothing initially
    public $directivesPattern: RegExp = /$^/;

    public $globals: Record<string, any> = new NullProtoObj();
    public $props: Record<string, any> = new NullProtoObj();
    public $namespaces: Map<string, string> = new Map();

    public production: boolean;
    public $root: string;
    public $extension: string;
    public $stream: Streaming;
    public $async: Asyncronos;
    public $silent: boolean;
    public $var_locals: string;
    
    public $files: Record<string, KireTplFunction> = new NullProtoObj();
    public $vfiles: Record<string, string> = new NullProtoObj();
    public $sources: Record<string, string> = new NullProtoObj();

    public $parser: IParserConstructor;
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
                // Assume pre-compiled functions are valid KireTplFunction or compatible
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

    public plugin<KirePlugged extends KirePlugin<any>>(plugin: KirePlugged, opts?: any) {
        plugin.load(this, opts); return this;
    }

    public parse(content: string): any[] {
        const parser = new this.$parser(content, this as any);
        return parser.parse();
    }

    public $global(key: string, value: any) { this.$globals[key] = value; return this; }
    public $prop(key: string, value: any) { this.$props[key] = value; return this; }

    public compile(content: string, filename = "template.kire", extraGlobals: string[] = []): KireTplFunction {
        const parser = new this.$parser(content, this as any);
        const nodes = parser.parse();
        const compilerInstance = new this.$compiler(this as any, filename);
        const code = compilerInstance.compile(nodes, extraGlobals);

        const isAsync = compilerInstance.isAsync;
        const AsyncFunc = (async () => {}).constructor;
        let execFunc;
        try {
            execFunc = isAsync 
                ? new (AsyncFunc as any)("$ctx", "$deps", code)
                : new Function("$ctx", "$deps", code);
        } catch (e) {
            if (!this.$silent) { console.log("--- FAILED CODE ---\n" + code + "\n-------------------"); }
            let map;
            const smMatch = code.match(/\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,(.*)$/m);
            if (smMatch && smMatch[1]) {
                try { map = JSON.parse(Buffer.from(smMatch[1], 'base64').toString()); } catch(ex) {}
            }
            throw new KireError(e as Error, { execute: () => {}, isAsync, path: filename, code, source: content, map, dependencies: new NullProtoObj() } as any);
        }
        
        let map;
        if (!this.production) {
            const smMatch = code.match(/\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,(.*)$/m);
            if (smMatch && smMatch[1]) {
                try { map = JSON.parse(Buffer.from(smMatch[1], 'base64').toString()); } catch(e) {}
            }
        }
        
        // Convert Map<string, string> to Record<string, string> for JSON-safe metadata
        const dependencies: Record<string, string> = new NullProtoObj();
        for (const [path, id] of compilerInstance.getDependencies()) {
            dependencies[path] = id;
        }

        return createKireFunction(this as any, execFunc, {
            async: isAsync,
            path: filename,
            code,
            source: content,
            map,
            dependencies
        });
    }

    private async getOrCompile(path: string): Promise<KireTplFunction> {
        const resolved = this.resolvePath(path);
        if (this.production && this.$files[resolved]) return this.$files[resolved];
        const content = await this.readFile(resolved);
        const compiled = this.compile(content, resolved);
        if (this.production) this.$files[resolved] = compiled;
        return compiled;
    }

    public render(template: string, locals: Record<string, any> = new NullProtoObj(), filename = "template.kire"): KireRendered<Streaming, Asyncronos> {
        const compiled = this.compile(template, filename, Object.keys(locals));
        if (this.$stream) return compiled.stream(this, locals) as any;
        if (this.$async) return compiled.async(this, locals) as any;
        return compiled.sync(this, locals) as any;
    }

    public async view(path: string, locals: Record<string, any> = new NullProtoObj()): Promise<KireRendered<Streaming, Asyncronos>> {
        const compiled = await this.getOrCompile(path);
        if (this.$stream) return compiled.stream(this, locals) as any;
        if (this.$async) return compiled.async(this, locals) as any;
        return compiled.sync(this, locals) as any;
    }

    public run(template: KireTplFunction, locals: Record<string, any>): KireRendered<Streaming, Asyncronos> {
        if (this.$stream) return template.stream(this, locals) as any;
        if (this.$async) return template.async(this, locals) as any;
        return template.sync(this, locals) as any;
    }

    public resolve(path: string): string { return this.resolvePath(path); }

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

    public readFile(path: string): Promise<string> {
        const normalized = path.replace(/\\/g, '/');
        if (this.$vfiles[normalized]) return Promise.resolve(this.$vfiles[normalized]!);
        if (this.$sources[normalized]) return Promise.resolve(this.$sources[normalized]!);
        return new Promise((resolve, reject) => {
            readFile(path, 'utf-8', (err, data) => { if (err) reject(err); else resolve(data); });
        });
    }

    public namespace(name: string, path: string) {
        this.$namespaces.set(name, resolve(this.$root, path).replace(/\\/g, '/')); return this;
    }

    public directive(def: DirectiveDefinition) { 
        this.$directives.set(def.name, def); 
        this.$directivesPattern = createFastMatcher(Array.from(this.$directives.keys()));
        return this; 
    }
    public getDirective(name: string) { return this.$directives.get(name); }
    public element(def: ElementDefinition) { 
        this.$elements.add(def); 
        this.$elementMatchers.unshift({ def }); 
        this.$elementsPattern = createFastMatcher(
            this.$elementMatchers.map(m => m.def.name)
        );
        return this; 
    }

    public $types: Map<string, TypeDefinition> = new Map();
    public $schemaDefinition?: KireSchemaDefinition;
    public kireSchema(def: KireSchemaDefinition) { this.$schemaDefinition = def; return this; }
    public type(def: TypeDefinition) { this.$types.set(def.variable, def); return this; }
    public renderError(e: any, ctx?: KireContext): string { return renderErrorHtml(e, ctx); }
}
