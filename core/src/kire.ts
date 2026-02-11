import { Compiler } from "./compiler";
import { KireDirectives } from "./directives";
import { Parser } from "./parser";
import KireRuntime from "./runtime";
import { KireError } from "./utils/error";
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
    KireSchemaDefinition
} from "./types";
import { LayeredMap } from "./utils/layered-map";
import { resolvePath } from "./utils/resolve";
import { AsyncFunction, scoped } from "./utils/scoped";
import { resolveSourceLocation } from "./utils/source-map";

export class Kire {
	public $scoped = scoped;
    public $error = KireError;

	public $directives: Map<string, DirectiveDefinition> = new Map();
	public $elements: Set<ElementDefinition> = new Set();
	public $globals: LayeredMap<string, any> = new LayeredMap();
	public $contexts: LayeredMap<string, any> = new LayeredMap();
	public $props: LayeredMap<string, any> = new LayeredMap();
	public $namespaces: Map<string, string> = new Map();

	public production: boolean;
	public $resolver: (filename: string) => Promise<string>;
	public $readdir?: (pattern: string) => Promise<string[]>;
	public $extension: string;
	public $stream: boolean;
    public $silent: boolean;
	public $files: Map<string, Function> = new Map();
	public $parser: IParserConstructor;
	public $compiler: ICompilerConstructor;
	public $var_locals: string;
	public $cache: Map<string, Map<string, any>> = new Map();
	public $executor: KireExecutor;

	public cacheClear() {
		this.$cache.clear();
		this.$files.clear();
	}

	protected $parent?: Kire;
    public $forkHooks: Set<(fork: Kire) => void> = new Set();

    public onFork(hook: (fork: Kire) => void) {
        this.$forkHooks.add(hook);
        return this;
    }

    public $errorHooks: Set<(err: any) => string | void> = new Set();

    public onError(hook: (err: any) => string | void) {
        this.$errorHooks.add(hook);
        return this;
    }

	public fork(): Kire {
		const fork = new Kire({
			directives: false,
			parent: this,
		});

		fork.$parent = this;
		fork.production = this.production;
		fork.$stream = this.$stream;
		fork.$extension = this.$extension;
        fork.$silent = this.$silent;
		fork.$var_locals = this.$var_locals;
		fork.$resolver = this.$resolver;
		fork.$executor = this.$executor;
		fork.$parser = this.$parser;
		fork.$compiler = this.$compiler;
		fork.$readdir = this.$readdir;

		fork.$cache = this.$cache;
		fork.$files = this.$files;
		fork.$directives = this.$directives;
		fork.$elements = this.$elements;
		fork.$namespaces = this.$namespaces;
        fork.$forkHooks = this.$forkHooks;
        fork.$types = this.$types; 
        fork.$schemaDefinition = this.$schemaDefinition;

		fork.$globals = new LayeredMap(this.$globals);
		fork.$contexts = new LayeredMap(this.$contexts);
		fork.$props = new LayeredMap(this.$props);

        if (this.$forkHooks.size > 0) {
            for (const hook of this.$forkHooks) {
                hook(fork);
            }
        }

		return fork;
	}

	public cached<T = any>(namespace: string): KireCache<T> {
		if (!this.$cache.has(namespace)) {
			this.$cache.set(namespace, new Map());
		}
		const store = this.$cache.get(namespace)!;
		return store;
	}

	constructor(options: KireOptions = {}) {
		this.production = options.production ?? true;
		this.$stream = options.stream ?? false;
		this.$extension = options.extension ?? "kire";
        this.$silent = options.silent ?? false;
		this.$var_locals = options.varLocals ?? "it";
		this.$parent = options.parent;

		this.$executor =
			options.executor ??
			((code, params) => new AsyncFunction(...params, code));

		this.$resolver =
			options.resolver ??
			(async (filename) => {
				throw new Error(`No resolver defined for path: ${filename}`);
			});

		this.$parser = options.engine?.parser ?? Parser;
		this.$compiler = options.engine?.compiler ?? Compiler;

		const pluginsToLoad: Array<{ p: KirePlugin<any>; o?: any }> = [];

		if (
			typeof options.directives === "undefined" ||
			options.directives === true
		) {
			pluginsToLoad.push({ p: KireDirectives });
		}

		if (options.plugins) {
			for (const p of options.plugins) {
				if (Array.isArray(p)) {
					pluginsToLoad.push({ p: p[0], o: p[1] });
				} else {
					pluginsToLoad.push({ p });
				}
			}
		}

		pluginsToLoad.sort((a, b) => (a.p.sort ?? 100) - (b.p.sort ?? 100));

		for (const item of pluginsToLoad) {
			this.plugin(item.p, item.o);
		}

        (this.$error as any).html = (e: any, ctx?: KireContext) => this.renderError(e, ctx);
	}

	public namespace(name: string, path: string) {
		const unixPath = path.replace(/\\/g, "/");
		this.$namespaces.set(name, unixPath);
		return this;
	}

	public $prop(keyOrObj: string | Record<string, any>, value?: any) {
		if (!this.$parent && !this.$silent) {
			console.warn("[Kire] Warning: You are setting props on the global instance. This data will be shared across all requests. Use kire.fork() for per-request isolation.");
		}
		if (typeof keyOrObj === "string") {
			this.$props.set(keyOrObj, value);
		} else if (typeof keyOrObj === "object") {
			for (const key in keyOrObj) {
				this.$props.set(key, keyOrObj[key]);
			}
		}
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

    public $types: Map<string, TypeDefinition> = new Map();
    public $schemaDefinition?: KireSchemaDefinition;

    public type(def: TypeDefinition) {
        this.$types.set(def.variable, def);
        return this;
    }

    public kireSchema(def: KireSchemaDefinition) {
        this.$schemaDefinition = def;
        return this;
    }

	public pkgSchema(): any {
        const schema: any = {
            $schema: "https://raw.githubusercontent.com/drysius/kire/refs/heads/main/schema.json",
            package: this.$schemaDefinition?.name || "kire-app",
            version: this.$schemaDefinition?.version || "0.0.0",
            author: this.$schemaDefinition?.author,
            repository: this.$schemaDefinition?.repository,
            directives: [],
            elements: [],
            globals: []
        };

        const groups = {
            element: [] as TypeDefinition[],
            global: [] as TypeDefinition[],
            context: [] as TypeDefinition[],
            directive: [] as TypeDefinition[],
            other: [] as TypeDefinition[]
        };

        this.$types.forEach(def => {
            if (def.type in groups) {
                groups[def.type as keyof typeof groups].push(def);
            } else {
                groups.other.push(def);
            }
        });

        const buildTree = (defs: TypeDefinition[]) => {
            const root: any[] = [];
            const find = (list: any[], key: string) => list.find(n => n.variable === key);

            defs.forEach(def => {
                const tokens = def.variable.split(/([:.])/);
                let currentList = root;

                for (let i = 0; i < tokens.length; i += 2) {
                    const part = tokens[i];
                    const sep = tokens[i + 1];

                    let node = find(currentList, part);
                    if (!node) {
                        node = { variable: part };
                        currentList.push(node);
                    }

                    if (i === tokens.length - 1) {
                        if (def.comment) node.description = def.comment;
                        if (def.comment) node.comment = def.comment;
                        if (def.example) node.example = def.example;
                        if (def.tstype) node.type = def.tstype;
                    }

                    if (sep) {
                        node.separator = sep;
                        if (!node.extends) node.extends = [];
                        currentList = node.extends;
                    }
                }
            });
            return root;
        };

        schema.elements = buildTree(groups.element);
        schema.globals = buildTree([...groups.global, ...groups.context]);

        schema.directives = Array.from(this.$directives.values()).map(d => {
            const item: any = {
                name: d.name,
                description: d.description,
                example: d.example,
                params: d.params,
                children: d.children
            };
            
            if (d.parents && d.parents.length > 0) {
                item.parents = d.parents.map(p => ({
                    name: p.name,
                    description: p.description,
                    example: p.example,
                    params: p.params
                }));
            }
            return item;
        });

		return schema;
	}

	public element(
		nameOrDef: string | RegExp | ElementDefinition,
		handler?: KireElementHandler,
		opts?: KireElementOptions,
	) {
		if (
			typeof nameOrDef === "object" &&
			!("source" in nameOrDef)
		) {
            const def = nameOrDef as ElementDefinition;
			this.$elements.add(def);
            if (typeof def.name === 'string') {
                this.type({
                    variable: def.name,
                    type: 'element',
                    comment: def.description,
                    example: def.example,
                    tstype: 'element'
                });
            }
		} else {
			if (!handler) throw new Error("Handler is required for legacy element()");
            const name = nameOrDef as string | RegExp;
			this.$elements.add({
				name: name,
				void: opts?.void ?? false,
				onCall: handler,
			});
            if (typeof name === 'string') {
                this.type({
                    variable: name,
                    type: 'element',
                    comment: "Custom element",
                    tstype: 'element'
                });
            }
		}
		return this;
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

		if (def.parents) {
			for (const parent of def.parents) {
				this.directive(parent);
			}
		}
		return this;
	}

	public getDirective(name: string) {
		return this.$directives.get(name);
	}

	public $ctx(key: string, value: any) {
		this.$contexts.set(key, value);
        
        const moduleName = this.$schemaDefinition?.name || "Kire";
        const typeName = typeof value;
        
        this.type({
            variable: "$ctx." + key,
            type: 'context',
            comment: `Global Variable of ${moduleName} $ctx.${key} with type ${typeName}`,
            tstype: typeName
        });
		return this;
	}

	public $global(key: string, value: any) {
		this.$globals.set(key, value);
        
        const moduleName = this.$schemaDefinition?.name || "Kire";
        const typeName = typeof value;

        this.type({
            variable: key,
            type: 'global',
            comment: `Global Variable of ${moduleName} ${key} with type ${typeName}`,
            tstype: typeName
        });
		return this;
	}

	public parse(template: string) {
		const parser = new this.$parser(template, this);
		return parser.parse();
	}

	public async compile(template: string, filename?: string): Promise<string> {
		const parser = new this.$parser(template, this);
		const nodes = parser.parse();
		const compiler = new this.$compiler(this, filename);
		return compiler.compile(nodes);
	}

	public async compileFn(
		content: string,
		filename = "template.kire",
	): Promise<Function> {
		const code = `${await this.compile(content, filename)}`;
		try {
			const mainFn = this.$executor(code, ["$ctx"]);
			(mainFn as any)._code = code;
			(mainFn as any)._source = content;
			(mainFn as any)._path = filename;

			const mapMatch = code.match(
				/\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,(.*)/,
			);
			if (mapMatch) {
				try {
					const json = Buffer.from(mapMatch[1]!, "base64").toString("utf8");
					(mainFn as any)._map = JSON.parse(json);
				} catch (e) {}
			}

			return mainFn;
		} catch (e) {
			console.error("Error creating function from code:", code);
			throw e;
		}
	}

	public async render(
		template: string,
		locals: Record<string, any> = {},
		controller?: ReadableStreamDefaultController,
		filename = "template.kire",
	): Promise<string | ReadableStream> {
		if (!this.$parent && !this.$silent) {
			console.warn("[Kire] Warning: You are rendering on the global instance. Use kire.fork() for per-request isolation.");
		}
		const fn = await this.compileFn(template, filename);
		return this.run(fn, locals, false, controller);
	}

	public renderError(e: any, ctx?: KireContext): string {
		let snippet = "";
		let location = "";

		if (ctx && ctx.$file && ctx.$file.code && e.stack) {
			const safePath = ctx.$file.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const match =
				e.stack.match(new RegExp(`${safePath}:(\\d+):(\\d+)`)) ||
				e.stack.match(/kire-generated\.js:(\d+):(\d+)/) ||
				e.stack.match(/eval:(\d+):(\d+)/) ||
				e.stack.match(/<anonymous>:(\d+):(\d+)/);

			if (match) {
				const genLine = parseInt(match[1]!) - 1;
				const genCol = parseInt(match[2]!);
				const lines = ctx.$file.code.split("\n");
				let sourceLine = -1;

				if (ctx.$file.map) {
					const resolved = resolveSourceLocation(
						ctx.$file.map,
						genLine + 1,
						genCol,
					);
					if (resolved) {
						sourceLine = resolved.line - 1;
					}
				}

				if (sourceLine === -1) {
					for (let i = genLine; i >= 0; i--) {
						const line = lines[i];
						if (line && line.trim().startsWith("// kire-line:")) {
							sourceLine = parseInt(line.split(":")[1]!.trim()) - 1;
							break;
						}
					}
				}

				if (sourceLine === -1 && match[0].includes(ctx.$file.path)) {
					sourceLine = genLine;
				}

				if (sourceLine !== -1 && ctx.$file.source) {
					location = ` at ${ctx.$file.path}:${sourceLine + 1}`;
					const sourceLines = ctx.$file.source.split("\n");
					const start = Math.max(0, sourceLine - 2);
					const end = Math.min(sourceLines.length, sourceLine + 3);

					snippet = sourceLines
						.slice(start, end)
						.map((l, i) => {
							const currentLine = start + i + 1;
							const isCurrent = currentLine === sourceLine + 1;
							return `<div style="display:flex; gap:1rem; ${isCurrent ? "background:rgba(239, 68, 68, 0.2);" : ""}"><span style="color:#666; user-select:none; width: 30px; text-align: right;">${currentLine}</span><span>${l.replace(/</g, "&lt;")}</span></div>`;
						})
						.join("");
				}
			}
		}

		const stack = (e.stack || "")
			.split("\n")
			.filter(
				(l: string) =>
					!l.includes("kire-generated.js") && !l.includes("new AsyncFunction"),
			)
			.join("\n");

		return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Kire Error</title>
	<style>
		body { font-family: system-ui, -apple-system, sans-serif; background: #1a1a1a; color: #fff; padding: 2rem; margin: 0; }
		.error-container { background: #2a2a2a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #444; max-width: 1200px; margin: 0 auto; }
		.error-header { background: #ef4444; color: white; padding: 1rem; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; }
		.error-content { padding: 1.5rem; overflow-x: auto; }
		pre { margin: 0; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; color: #e5e5e5; }
        .snippet { background: #111; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; border: 1px solid #333; }
	</style>
</head>
<body>
	<div class="error-container">
		<div class="error-header">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
			Kire Runtime Error${location}
		</div>
		<div class="error-content">
            ${snippet ? `<div class="snippet"><pre>${snippet}</pre></div>` : ""}
			<pre>${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
            <br>
            <pre style="color:#888;">${stack.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
		</div>
	</div>
</body>
</html>`;
	}

	public async view(
		path: string,
		locals: Record<string, any> = {},
		controller?: ReadableStreamDefaultController,
	): Promise<string | ReadableStream> {
		if (!this.$parent && !this.$silent) {
			console.warn(
				"[Kire] Warning: You are rendering a view on the global instance. Use kire.fork() for per-request isolation.",
			);
		}

		let ext: string | null = this.$extension;
		if (path.endsWith(".md") || path.endsWith(".markdown")) {
			ext = null;
		}
		const resolvedPath = this.resolvePath(path, locals, ext);

		if (
			(resolvedPath.endsWith(".md") || resolvedPath.endsWith(".markdown")) &&
			typeof (this as any).mdview === "function"
		) {
			return (this as any).mdview(resolvedPath, locals);
		}

		let compiled: Function | undefined;

		if (this.production && this.$files.has(resolvedPath)) {
			compiled = this.$files.get(resolvedPath) as any;
		} else {
			const content = await this.$resolver(resolvedPath);
			compiled = await this.compileFn(content, resolvedPath);
			if (this.production) {
				this.$files.set(resolvedPath, compiled as any);
			}
		}

		if (!compiled) throw new Error(`Could not load view: ${path}`);
		return this.run(compiled, locals, false, controller);
	}

	public resolvePath(
		filepath: string,
		locals: Record<string, any> = {},
		extension: string | null = this.$extension,
	): string {
		return resolvePath(
			filepath,
			this.$namespaces,
			{ ...this.$globals.toObject(), ...this.$props.toObject(), ...locals },
			extension === null ? "" : extension,
		);
	}

	public async run(
		mainFn: Function & { [key: string]: any },
		locals: Record<string, any>,
		children = false,
		controller?: ReadableStreamDefaultController,
	) {
		return KireRuntime(this, locals, {
			children,
			code: mainFn._code,
			execute: mainFn,
			name: mainFn.name,
			source: mainFn._source,
			path: mainFn._path,
			map: mainFn._map,
			controller,
		});
	}
}
