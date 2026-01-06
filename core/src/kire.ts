import { Compiler } from "./compiler";
import { KireDirectives } from "./directives";
import { Parser } from "./parser";
import { kireRuntime } from "./runtime";
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
	KireSchematic,
} from "./types";
import { resolvePath } from "./utils/resolve";

export class Kire {
	public $directives: Map<string, DirectiveDefinition> = new Map();
	public $elements: Set<ElementDefinition> = new Set();
	public $globals: Map<string, any> = new Map();

	public root: string;
	public production: boolean;
	public $resolver: (filename: string) => Promise<string>;
	public $readdir?: (pattern: string) => Promise<string[]>;
	public alias: Record<string, string>;
	extension: string;
	public $files: Map<string, Function> = new Map();
	public $parser: IParserConstructor;
	public $compiler: ICompilerConstructor;
	public $var_locals: string;
	public $expose_locals: boolean;
	public $cache: Map<string, Map<string, any>> = new Map();

	public cacheClear() {
		this.$cache.clear();
		this.$files.clear();
	}

	public cached<T = any>(namespace: string): KireCache<T> {
		if (!this.$cache.has(namespace)) {
			this.$cache.set(namespace, new Map());
		}
		const store = this.$cache.get(namespace)!;
		return store;
	}

	constructor(options: KireOptions = {}) {
		this.root = options.root ?? "./";
		this.production = options.production ?? true;
		this.alias = options.alias ?? { "~/": this.root };
		this.extension = options.extension ?? "kire";
		this.$var_locals = options.varLocals ?? "it";
		this.$expose_locals = options.exposeLocals ?? true;

		this.$resolver =
			options.resolver ??
			(async (filename) => {
				throw new Error(`No resolver defined for path: ${filename}`);
			});

		this.$parser = options.engine?.parser ?? Parser;
		this.$compiler = options.engine?.compiler ?? Compiler;

		// Collect plugins to load
		const pluginsToLoad: Array<{ p: KirePlugin<any>; o?: any }> = [];

		// Register default directives
		if (
			typeof options.directives === "undefined" ||
			options.directives === true
		) {
			pluginsToLoad.push({ p: KireDirectives });
		}

		// User provided plugins
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

	public pkgSchema(
		name: string,
		repository?: string | { type: string; url: string },
		version?: string,
	): KireSchematic {
		const globals: Record<string, any> = {};
		this.$globals.forEach((value, key) => {
			globals[key] = value;
		});

		return {
			package: name,
			repository,
			version,
			directives: Array.from(this.$directives.values()),
			elements: Array.from(this.$elements.values()),
			globals: globals,
		};
	}

	public element(
		nameOrDef: string | RegExp | ElementDefinition,
		handler?: KireElementHandler,
		options?: KireElementOptions,
	) {
		if (
			typeof nameOrDef === "object" &&
			"onCall" in nameOrDef &&
			!("source" in nameOrDef)
		) {
			this.$elements.add(nameOrDef as ElementDefinition);
		} else {
			if (!handler) throw new Error("Handler is required for legacy element()");
			this.$elements.add({
				name: nameOrDef as string | RegExp,
				void: options?.void ?? false, // Default to false if not provided
				onCall: handler,
			});
		}
		return this;
	}

	public directive(def: DirectiveDefinition) {
		this.$directives.set(def.name, def);
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
		this.$globals.set(key, value);
		return this;
	}

	public parse(template: string) {
		const parser = new this.$parser(template, this);
		return parser.parse();
	}

	public async compile(template: string): Promise<string> {
		const parser = new this.$parser(template, this);
		const nodes = parser.parse();
		const compiler = new this.$compiler(this);
		return compiler.compile(nodes);
	}

	public async compileFn(content: string): Promise<Function> {
		const code = await this.compile(content);
		//console.log(code)
		try {
			const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

			const mainFn = new AsyncFunction("$ctx", code);
			(mainFn as any)._code = code;

			// Return the separated functions
			return mainFn;
		} catch (e) {
			console.error("Error creating function from code:", code);
			throw e;
		}
	}

	public async render(
		template: string,
		locals: Record<string, any> = {},
	): Promise<string> {
		const fn = await this.compileFn(template);
		return this.run(fn, locals);
	}

	public async view(
		path: string,
		locals: Record<string, any> = {},
	): Promise<string> {
		const resolvedPath = resolvePath(
			path,
			this.root,
			this.alias,
			this.extension,
		);
		let compiled: Function | undefined;

		if (this.production && this.$files.has(resolvedPath)) {
			compiled = this.$files.get(resolvedPath) as any;
		} else {
			const content = await this.$resolver(resolvedPath);
			compiled = await this.compileFn(content);
			if (this.production) {
				this.$files.set(resolvedPath, compiled as any);
			}
		}

		if (!compiled) throw new Error(`Could not load view: ${path}`);
		return this.run(compiled, locals);
	}

	public resolvePath(filepath: string, currentFile?: string): string {
		return resolvePath(
			filepath,
			this.root,
			this.alias,
			this.extension,
			currentFile,
		);
	}

	public async run(
		mainFn: Function,
		locals: Record<string, any>,
		children = false,
	) {
		return kireRuntime(this, mainFn, locals, children);
	}
}