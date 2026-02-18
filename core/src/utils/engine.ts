import type { Kire } from "../kire";
import type { 
    KireCacheEntry, 
    KireTplFunction, 
    KireRendered, 
    Node 
} from "../types";
import { Compiler } from "../compiler";
import { Parser } from "../parser";
import { NullProtoObj } from "./regex";
import { resolvePath as resolvePathUtil } from "./resolve";

/**
 * Core de compilação e execução do Kire.
 */

export function resolvePath(this: Kire<any>, filepath: string): string {
    return resolvePathUtil(filepath, this.$config, this.$platform);
}

export function readFile(this: Kire<any>, path: string): string {
    const normalized = path.replace(/\\/g, '/');
    const stored = this.$kire["~store"].files[normalized];
    if (stored) {
        if (typeof stored === 'string') return stored;
        throw new Error(`Path ${path} points to a pre-compiled function, not source text.`);
    }
    if (this.$platform.exists(path)) return this.$platform.readFile(path);
    throw new Error(`Template file not found: ${path}`);
}

export function parse(this: Kire<any>, content: string): Node[] {
    return new Parser(content, this).parse();
}

export function compile(this: Kire<any>, content: string, filename = "template.kire", extraGlobals: string[] = [], isDependency = false): KireCacheEntry {
    try {
        const nodes = this.parse(content);
        const compilerInstance = new Compiler(this, filename);
        const code = compilerInstance.compile(nodes, extraGlobals, isDependency);
        const isAsync = compilerInstance.isAsync;
        const dependencies: Record<string, string> = new NullProtoObj();
        
        for (const [path, id] of Object.entries(compilerInstance.getDependencies())) {
            dependencies[path] = id;
        }

        const AsyncFunc = (async () => {}).constructor;
        const coreFunction = isAsync 
            ? new (AsyncFunc as any)("$props, $globals, $kire", code)
            : new Function("$props, $globals, $kire", code);

        const fn = this.$runtime.createKireFunction(this, coreFunction, {
            async: isAsync, 
            path: filename, 
            code, 
            source: content, 
            map: undefined, 
            dependencies
        });

        return { ast: nodes, code, fn, async: isAsync, time: Date.now(), dependencies, source: content };
    } catch (e) {
        if (!this.$silent) { 
            console.error(`Compilation error in ${filename}:`); 
            console.error(e); 
        }
        if (e instanceof this.KireError) throw e;
        throw new this.KireError(e as Error, { 
            execute: () => {}, 
            isAsync: false, 
            path: filename, 
            code: "", 
            source: content, 
            map: undefined, 
            dependencies: new NullProtoObj() 
        } as any);
    }
}

export function getOrCompile(this: Kire<any>, path: string, isDependency = false): KireTplFunction {
    const resolved = this.resolvePath(path);
    const stored = this.$kire["~store"].files[resolved];
    
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

    const content = source ?? this.readFile(resolved);
    const entry = this.compile(content, resolved, [], isDependency);
    
    if (!source && this.$platform.exists(resolved)) {
        entry.time = this.$platform.stat(resolved).mtimeMs;
    }

    this.$cache.files.set(resolved, entry);
    return entry.fn!;
}

export function run(this: Kire<any>, template: KireTplFunction, locals: Record<string, any>, globals?: Record<string, any>): KireRendered<any> {
    try {
        let effectiveProps = locals;
        let effectiveGlobals = globals || this.$globals;
        
        if (this["~parent"]) {
            effectiveProps = Object.assign(Object.create(this.$props), locals);
        }
        
        const result = template.call(this, effectiveProps, effectiveGlobals);
        
        if (!this.$async && result instanceof Promise) {
            throw new Error(`Template ${template.meta.path} contains async code but was called synchronously.`);
        }
        
        return result as any;
    } catch (e) {
        throw e instanceof this.KireError ? e : new this.KireError(e as Error, template);
    }
}

export function render(this: Kire<any>, template: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>, filename = "template.kire"): KireRendered<any> {
    let bucket = this.$cache.files.get(this["~render-symbol"]) as Map<string, KireCacheEntry>;
    if (!bucket) {
        bucket = new Map();
        this.$cache.files.set(this["~render-symbol"], bucket);
    }

    let entry = bucket.get(template);
    if (!entry) {
        entry = this.compile(template, filename, Object.keys(locals));
        if (bucket.size >= this.max_renders) {
            const first = bucket.keys().next().value;
            bucket.delete(first);
        }
        bucket.set(template, entry);
    }
    
    return this.run(entry.fn!, locals, globals);
}

export function view(this: Kire<any>, path: string, locals: Record<string, any> = new NullProtoObj(), globals?: Record<string, any>): KireRendered<any> {
    return this.run(this.getOrCompile(path), locals, globals);
}

export function compileAndBuild(this: Kire<any>, directories: string[], outputFile: string) {
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
                    ? `async function($props = {}, $globals = {}, $kire) {\n${entry.code}\n}`
                    : `function($props = {}, $globals = {}, $kire) {\n${entry.code}\n}`;
            }
        }
    };
    for (const dir of directories) scan(this.$platform.resolve(this.$root, dir));
    const exportLine = typeof module !== 'undefined' ? 'module.exports = _kire_bundled;' : 'export default _kire_bundled;';
    const output = `// Kire Bundled Templates\n// Generated at ${new Date().toISOString()}\n\nconst _kire_bundled = {\n${Object.entries(bundled).map(([key, fn]) => `  "${key}": ${fn}`).join(',\n')}\n};\n\n${exportLine}\n`;
    this.$platform.writeFile(outputFile, output);
}

