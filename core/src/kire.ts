import { platform as nodePlatform } from "./utils/node";
import { createKireFunction } from "./runtime";
import { KireError, renderErrorHtml } from "./utils/error";
import { escapeHtml } from "./utils/html";
import { NullProtoObj, createFastMatcher } from "./utils/regex";
import { KireDirectives } from "./directives/index";
import { Compiler } from "./compiler";
import { Parser } from "./parser";
import { resolvePath as resolvePathUtil } from "./utils/resolve";

import type {
    DirectiveDefinition,
    ElementDefinition,
    KireOptions,
    KireTplFunction,
    KireCacheEntry,
    KireSchemaObject,
    KireExistVar,
    KirePlatform,
    KireConfig,
    KireRuntime,
    KireHandler,
    KirePlugin,
    KireRendered,
    Node,
    TypeDefinition,
    KireAttributeDeclaration
} from "./types";

export interface ElementMatcher {
    def: ElementDefinition;
}

/**
 * Helper to create a Kire Plugin with default options.
 */
export function kirePlugin<Options extends object>(
    defaultOptions: Options,
    load: (kire: Kire<any>, opts: Options) => void
): KirePlugin<Options> {
    return {
        options: defaultOptions,
        load
    };
}

/**
 * The main Kire engine class.
 * Handles configuration, compilation, and rendering of templates.
 */
export class Kire<Asyncronos extends boolean = true> {
    public __valor = "";
    /** 
     * The Root Engine Instance (Source of Truth).
     */
    public readonly $kire: Kire<any>;

    /** 
     * Internal Storage Structures 
     */
    public ["~elements"] = {
        matchers: [] as ElementMatcher[],
        pattern: /$^/,
        list: [] as ElementDefinition[]
    };

    public ["~directives"] = {
        pattern: /$^/,
        records: new NullProtoObj() as Record<string, DirectiveDefinition>
    };

    public ["~cache"] = {
        modules: new Map<string, any>(),
        files: new Map<string | symbol, KireCacheEntry>()
    };

    public ["~store"] = {
        globals: new NullProtoObj() as Record<string, any>,
        props: new NullProtoObj() as Record<string, any>,
        files: new NullProtoObj() as Record<string, string | KireTplFunction>,
        config: new NullProtoObj() as KireConfig,
        // Platform and Runtime functions shared across forks
        platform: new NullProtoObj() as KirePlatform,
        runtime: new NullProtoObj() as KireRuntime
    };

    public ["~handlers"] = {
        exists_vars: new Map<RegExp | string, KireExistVar[]>(),
        forks: [] as ((fork: Kire<Asyncronos>) => void)[]
    };

    public ["~schema"]: KireSchemaObject = {
        name: "kire-app",
        version: "1.0.0",
        repository: "",
        dependencies: [],
        directives: [],
        elements: [],
        attributes: [],
        types: []
    };

    public ["~parent"]?: Kire<any>;
    public ["~compiling"] = new Set<string>();
    
    // Delegation getters
    public get $elements() { return this.$kire["~elements"]; }
    public get $directives() { return this.$kire["~directives"]; }
    public get $cache() { return this.$kire["~cache"]; }
    public get $files(): Record<string, string | KireTplFunction> { 
        const stored = this["~store"].files;
        const cache = this.$cache.files;
        return new Proxy(stored, {
            get: (target, prop) => {
                if (typeof prop !== 'string') return Reflect.get(target, prop);
                const s = target[prop];
                if (typeof s === 'function') return s;
                
                // Also check parent if we are a fork and don't have it locally
                if (s === undefined && this["~parent"]) {
                    const ps = this["~parent"].$files[prop];
                    if (ps !== undefined) return ps;
                }

                const cached = cache.get(prop);
                return (cached && cached.fn) ? cached.fn : s;
            },
            set: (target, prop, value) => {
                return Reflect.set(target, prop, value);
            }
        }) as any;
    }
    public get $schema() { return this.$kire["~schema"]; };

    public get $elementMatchers() { return this.$elements.matchers; }
    public get $elementsPattern() { return this.$elements.pattern; }
    public get $directivesPattern() { return this.$directives.pattern; }

    /** Aliases for ~store (readonly) */
    public readonly $globals!: Record<string, any>;
    public readonly $props!: Record<string, any>;
    public readonly $config!: KireConfig;
    public readonly $platform!: KirePlatform;
    public readonly $runtime!: KireRuntime;

    /** Config Getters (Delegating to $config) */
    public get $production(): boolean { return this.$config.production; }
    public get $root(): string { return this.$config.root; }
    public get $extension(): string { return this.$config.extension; }
    public get $async(): Asyncronos { return this.$config.async as Asyncronos; }
    public get $silent(): boolean { return this.$config.silent; }
    public get $var_locals(): string { return this.$config.var_locals; }
    public get $namespaces(): Record<string, string> { return this.$config.namespaces; }
    public get $max_renders(): number { return this.$config.max_renders; }
    
    /** Runtime Getters */
    public get $escape() { return this.$runtime.escapeHtml; }
    public get NullProtoObj() { return this.$runtime.NullProtoObj; }
    public get KireError() { return this.$runtime.KireError; }
    public get renderErrorHtml() { return this.$runtime.renderErrorHtml; }

    public ["~render-symbol"] = Symbol.for("~templates");

    constructor(options: KireOptions<Asyncronos> = new NullProtoObj()) {
        this.$kire = options.parent ? options.parent.$kire : this;

        if (options.parent) {
            this["~parent"] = options.parent;
            
            Object.defineProperty(this, '$globals', {
                value: this.createStoreProxy(this["~store"].globals, options.parent.$globals),
                writable: true,
                enumerable: true,
                configurable: true
            });
            
            Object.defineProperty(this, '$props', {
                value: this.createStoreProxy(this["~store"].props, options.parent.$props),
                writable: true,
                enumerable: true,
                configurable: true
            });
            
            Object.defineProperty(this, '$config', {
                value: this.createStoreProxy(this["~store"].config, options.parent.$config),
                writable: true,
                enumerable: true,
                configurable: true
            });
            
            Object.defineProperty(this, '$platform', {
                value: this.createStoreProxy(this["~store"].platform, options.parent.$platform),
                writable: true,
                enumerable: true,
                configurable: true
            });
            
            Object.defineProperty(this, '$runtime', {
                value: this.createStoreProxy(this["~store"].runtime, options.parent.$runtime),
                writable: true,
                enumerable: true,
                configurable: true
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
        Object.assign(plat, nodePlatform);

        const conf = this["~store"].config;
        conf.production = options.production ?? plat.isProd();
        conf.async = (options.async ?? true);
        conf.extension = options.extension ?? "kire";
        conf.silent = options.silent ?? false;
        conf.var_locals = options.local_variable ?? "it";
        conf.max_renders = options.max_renders ?? 1000;
        conf.root = options.root ? plat.resolve(options.root) : plat.cwd();
        conf.namespaces = new NullProtoObj();
        
        if (options.files) {
            this["~store"].files = { ...options.files };
        }

        Object.defineProperty(this, '$globals', {
            value: this["~store"].globals,
            writable: true,
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(this, '$props', {
            value: this["~store"].props,
            writable: true,
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(this, '$config', {
            value: this["~store"].config,
            writable: true,
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(this, '$platform', {
            value: this["~store"].platform,
            writable: true,
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(this, '$runtime', {
            value: this["~store"].runtime,
            writable: true,
            enumerable: true,
            configurable: true
        });

        if (!options.emptykire) {
            this.plugin(KireDirectives);
        }
    }

    public createStoreProxy(localStore: any, parentStore: any) {
        return new Proxy(localStore, {
            get: (target, prop, receiver) => {
                if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);
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
                if (Reflect.has(target, prop)) return Reflect.getOwnPropertyDescriptor(target, prop);
                const parentDesc = Reflect.getOwnPropertyDescriptor(parentStore, prop);
                if (parentDesc && !parentDesc.configurable) {
                    // To satisfy Proxy invariants, we must return a configurable descriptor 
                    // if it doesn't exist on the target yet.
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
            }
        });
    }

    // --- State Methods ---

    public cached(name: string): any {
        let mod = this.$cache.modules.get(name);
        if (!mod) {
            mod = new this.NullProtoObj();
            this.$cache.modules.set(name, mod);
        }
        return mod;
    }

    public fork(): Kire<Asyncronos> {
        const fork = new (this.constructor as any)({ parent: this });
        const handlers = this.$kire["~handlers"].forks;
        for (const handler of handlers) {
            handler(fork);
        }
        return fork;
    }

    public onFork(callback: (fork: Kire<Asyncronos>) => void) {
        this.$kire["~handlers"].forks.push(callback);
        return this;
    }

    public plugin<Options extends object>(plugin: KirePlugin<Options>, opts?: Partial<Options>) {
        const merged = Object.assign({}, plugin.options, opts);
        plugin.load(this, merged as Options); 
        return this;
    }

    public existVar(name: string | RegExp, callback: KireHandler, unique = false) {
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

    public $global(key: string, value: any) { 
        this.$globals[key] = value; 
        return this; 
    }

    public $prop(key: string, value: any) { 
        this.$props[key] = value; 
        return this; 
    }

    public resolve(path: string): string { 
        return this.resolvePath(path); 
    }

    public renderError(e: any, ctx?: any): string { 
        return this.renderErrorHtml(e, this, ctx); 
    }

    // --- Schema Methods ---

    public kireSchema(def: Partial<KireSchemaObject>) { 
        Object.assign(this.$schema, def); 
        return this; 
    }

    public type(def: TypeDefinition) { 
        this.$schema.types.push(def);
        return this; 
    }

    public attribute(def: KireAttributeDeclaration) {
        this.$schema.attributes.push(def);
        return this;
    }

    public directive(def: DirectiveDefinition) {
        this.$directives.records[def.name] = def;
        this.$directives.pattern = createFastMatcher(Object.keys(this.$directives.records));
        this.$schema.directives.push({
            name: def.name,
            description: def.description,
            params: def.params,
            children: def.children,
            example: def.example,
            related: def.related,
            exposes: def.exposes
        });
        return this;
    }

    public getDirective(name: string) {
        return this.$directives.records[name];
    }

    public element(def: ElementDefinition) {
        this.$elements.list.push(def);
        this.$elements.matchers.unshift({ def });
        const names = this.$elements.list.map(d => d.name);
        this.$elements.pattern = createFastMatcher(names);
        if (typeof def.name === 'string') {
            this.$schema.elements.push({
                name: def.name,
                description: def.description,
                void: def.void,
                attributes: def.attributes,
                example: def.example,
                related: def.related
            });
        }
        return this;
    }

    public namespace(name: string, path: string) {
        this.$namespaces[name] = this.$platform.resolve(this.$root, path);
        return this;
    }

    // --- Engine Methods ---

    public resolvePath(filepath: string): string {
        return resolvePathUtil(filepath, this.$config, this.$platform);
    }

    public readFile(path: string): string {
        const normalized = path.replace(/\\/g, '/');
        
        // Check cache first for source
        const entry = this.$cache.files.get(normalized);
        if (entry?.source) return entry.source;

        const stored = this.$files[normalized];
        if (stored) {
            if (typeof stored === 'string') return stored;
            if (typeof stored === 'function' && (stored as KireTplFunction).meta?.source) {
                return (stored as KireTplFunction).meta.source;
            }
            throw new Error(`Path ${path} points to a pre-compiled function without source text.`);
        }
        if (this.$platform.exists(path)) return this.$platform.readFile(path);
        throw new Error(`Template file not found: ${path}`);
    }

    public parse(content: string): Node[] {
        return new Parser(content, this).parse();
    }

    public compile(content: string, filename = "template.kire", extraGlobals: string[] = [], isDependency = false): KireCacheEntry {
        try {
            const nodes = this.parse(content);
            const compilerInstance = new Compiler(this, filename);
            const code = compilerInstance.compile(nodes, extraGlobals, isDependency);
            const async = compilerInstance.async;
            const dependencies = new NullProtoObj();
            
            for (const [path, id] of Object.entries(compilerInstance.getDependencies())) {
                dependencies[path] = id;
            }

            const AsyncFunc = (async () => {}).constructor;
            const coreFunction = async 
                ? new (AsyncFunc as any)("$props, $globals, $kire", code)
                : new Function("$props, $globals, $kire", code);

            const fn = this.$runtime.createKireFunction(this, coreFunction, {
                async, 
                path: filename, 
                code, 
                source: content, 
                map: undefined, 
                dependencies
            });

            return { ast: nodes, code, fn, async, time: Date.now(), dependencies, source: content };
        } catch (e) {
            if (!this.$silent) { 
                console.error(`Compilation error in ${filename}:`); 
                console.error(e); 
            }
            if (e instanceof this.KireError) throw e;
            throw new this.KireError(e as Error, { 
                execute: () => {}, 
                async: false, 
                path: filename, 
                code: "", 
                source: content, 
                map: undefined, 
                dependencies: new NullProtoObj() 
            } as any);
        }
    }

    public getOrCompile(path: string, isDependency = false): KireTplFunction {
        const resolved = this.resolvePath(path);
        const stored = this.$files[resolved];
        
        if (typeof stored === 'function') return stored as KireTplFunction;
        
        const cached = this.$cache.files.get(resolved);
        const source = typeof stored === 'string' ? stored : undefined;

        if (this.$production && cached) return cached.fn!;
        
        if (!this.$production && !source && this.$platform.exists(resolved)) {
            const mtime = this.$platform.stat(resolved).mtimeMs;
            if (cached && cached.time === mtime) return cached.fn!;
        } else if (source && cached) {
            return cached.fn!;
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
            return entry.fn!;
        } finally {
            this.$kire["~compiling"].delete(resolved);
        }
    }

    public run(template: KireTplFunction, locals: Record<string, any>, globals?: Record<string, any>): KireRendered<Asyncronos> {
        try {
            let effectiveProps = locals;
            let effectiveGlobals = globals || this.$globals;
            
            if (this["~parent"]) {
                effectiveProps = Object.assign(Object.create(this.$props), locals);
            }
            
            const result = template.call(this, effectiveProps, effectiveGlobals, this as never);
            
            if (!this.$async && result instanceof Promise) {
                throw new Error(`Template ${template.meta.path} contains async code but was called synchronously.`);
            }
            
            return result as any;
        } catch (e) {
            throw e instanceof this.KireError ? e : new this.KireError(e as Error, template);
        }
    }

    public render(template: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>, filename = "template.kire"): KireRendered<Asyncronos> {
        let bucket = this.$cache.files.get(this["~render-symbol"]) as unknown as Map<string, KireCacheEntry>;
        if (!bucket) {
            bucket = new Map();
            this.$cache.files.set(this["~render-symbol"], bucket as never);
        }

        let entry = bucket.get(template);
        if (!entry) {
            entry = this.compile(template, filename, Object.keys(locals));
            if (bucket.size >= this.$max_renders) {
                const first = bucket.keys().next().value;
                bucket.delete(first!);
            }
            bucket.set(template, entry);
        }
        
        return this.run(entry.fn!, locals, globals);
    }

    public view(path: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>): KireRendered<Asyncronos> {
        return this.run(this.getOrCompile(path), locals, globals);
    }

    public compileAndBuild(directories: string[], outputFile: string) {
        const bundled: Record<string, string> = {};
        const scan = (dir: string) => {
            if (!this.$platform.exists(dir)) return;
            const items = this.$platform.readDir(dir);
            for (const item of items) {
                const fullPath = this.$platform.join(dir, item);
                const stat = this.$platform.stat(fullPath);
                if (stat.isDirectory()) scan(fullPath);
                else if (stat.isFile() && (fullPath.endsWith(this.$extension) || fullPath.endsWith('.kire'))) {
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
        for (const dir of directories) scan(this.$platform.resolve(this.$root, dir));
        const exportLine = typeof module !== 'undefined' ? 'module.exports = _kire_bundled;' : 'export default _kire_bundled;';
        const output = `// Kire Bundled Templates
// Generated at ${new Date().toISOString()}

const _kire_bundled = {
${Object.entries(bundled).map(([key, fn]) => `  "${key}": ${fn}`).join(',\n')}
};

${exportLine}
`;
        this.$platform.writeFile(outputFile, output);
    }
}