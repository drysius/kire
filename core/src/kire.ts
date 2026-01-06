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
	/**
	 * Registry of available directives (e.g., @if, @for).
	 * Maps directive names to their definitions.
	 */
	public $directives: Map<string, DirectiveDefinition> = new Map();

	/**
	 * Set of registered custom HTML elements (e.g., <my-component>).
	 */
	public $elements: Set<ElementDefinition> = new Set();

	/**
	 * Registry of global variables accessible in all templates.
	 */
	public $globals: Map<string, any> = new Map();

	/**
	 * The root directory for file resolution.
	 */
	public root: string;

	/**
	 * Whether the instance is running in production mode.
	 * In production, compiled templates are cached.
	 */
	public production: boolean;

	/**
	 * Function used to resolve file content from a given path.
	 * Defaults to throwing an error if not configured.
	 */
	public $resolver: (filename: string) => Promise<string>;

	/**
	 * Optional function to list files in a directory, used by glob features.
	 */
	public $readdir?: (pattern: string) => Promise<string[]>;

	/**
	 * Path aliases for imports (e.g., { "@": "./src" }).
	 */
	public alias: Record<string, string>;

	/**
	 * Default extension for template files (e.g., "kire").
	 */
	public extension: string;

	/**
	 * Cache of compiled template functions, keyed by file path.
	 */
	public $files: Map<string, Function> = new Map();

	/**
	 * Constructor for the Parser class used by this instance.
	 */
	public $parser: IParserConstructor;

	/**
	 * Constructor for the Compiler class used by this instance.
	 */
	public $compiler: ICompilerConstructor;

	/**
	 * Name of the variable that holds local variables within the template scope.
	 * Defaults to "it".
	 */
	public $var_locals: string;

	/**
	 * Whether to expose local variables directly in the template scope (in addition to being under $var_locals).
	 */
	public $expose_locals: boolean;

	/**
	 * General purpose cache for plugins and internal features.
	 */
	public $cache: Map<string, Map<string, any>> = new Map();

	/**
	 * Clears the internal file and data cache.
	 */
	public cacheClear() {
		this.$cache.clear();
		this.$files.clear();
	}

	/**
	 * Retrieves or initializes a namespaced cache store.
	 * @param namespace The namespace for the cache.
	 * @returns The cache map for the given namespace.
	 */
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

	/**
	 * Registers a plugin with the Kire instance.
	 * @param plugin The plugin object or function.
	 * @param opts Optional configuration options for the plugin.
	 * @returns The Kire instance for chaining.
	 */
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

	/**
	 * Generates a schema definition for a package using this Kire instance configuration.
	 * @param name Package name.
	 * @param repository Repository URL or object.
	 * @param version Package version.
	 * @returns A KireSchematic object representing the current configuration.
	 */
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

	/**
	 * Registers a custom HTML element handler.
	 * @param nameOrDef The tag name (string/RegExp) or a full element definition object.
	 * @param handler The handler function to process the element.
	 * @param options Additional options like 'void' (self-closing).
	 * @returns The Kire instance for chaining.
	 */
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
				void: options?.void ?? false,
				onCall: handler,
			});
		}
		return this;
	}

	/**
	 * Registers a custom directive.
	 * @param def The directive definition object.
	 * @returns The Kire instance for chaining.
	 */
	public directive(def: DirectiveDefinition) {
		this.$directives.set(def.name, def);
		if (def.parents) {
			for (const parent of def.parents) {
				this.directive(parent);
			}
		}
		return this;
	}

	/**
	 * Retrieves a registered directive by name.
	 * @param name The name of the directive.
	 * @returns The directive definition or undefined if not found.
	 */
	public getDirective(name: string) {
		return this.$directives.get(name);
	}

	/**
	 * Registers a global variable accessible in all templates.
	 * @param key The variable name.
	 * @param value The value.
	 * @returns The Kire instance for chaining.
	 */
	public $ctx(key: string, value: any) {
		this.$globals.set(key, value);
		return this;
	}

	/**
	 * Parses a template string into an AST.
	 * @param template The template string.
	 * @returns An array of AST nodes.
	 */
	public parse(template: string) {
		const parser = new this.$parser(template, this);
		return parser.parse();
	}

	/**
	 * Compiles a template string into JavaScript source code.
	 * @param template The template string.
	 * @returns The compiled JavaScript code as a string.
	 */
	public async compile(template: string): Promise<string> {
		const parser = new this.$parser(template, this);
		const nodes = parser.parse();
		const compiler = new this.$compiler(this);
		return compiler.compile(nodes);
	}

	/**
	 * Compiles a template string into an executable async function.
	 * @param content The template string.
	 * @returns An async function that renders the template.
	 */
	public async compileFn(content: string): Promise<Function> {
		const code = await this.compile(content);
		try {
			const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

			const mainFn = new AsyncFunction("$ctx", code);
			(mainFn as any)._code = code;

			return mainFn;
		} catch (e) {
			console.error("Error creating function from code:", code);
			throw e;
		}
	}

	/**
	 * Renders a raw template string with provided locals.
	 * @param template The template string.
	 * @param locals Local variables for the template context.
	 * @returns The rendered HTML string.
	 */
	public async render(
		template: string,
		locals: Record<string, any> = {},
	): Promise<string> {
		const fn = await this.compileFn(template);
		return this.run(fn, locals);
	}

	/**
	 * Renders a template file from the given path.
	 * Uses the configured resolver and caches the compiled function in production mode.
	 * @param path The file path relative to root or alias.
	 * @param locals Local variables for the template context.
	 * @returns The rendered HTML string.
	 */
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

	/**
	 * Resolves a file path relative to the project root and aliases.
	 * @param filepath The path to resolve.
	 * @param currentFile Optional path of the current file for relative resolution.
	 * @returns The resolved absolute path.
	 */
	public resolvePath(filepath: string, currentFile?: string): string {
		return resolvePath(
			filepath,
			this.root,
			this.alias,
			this.extension,
			currentFile,
		);
	}

	/**
	 * Executes a compiled template function with the given locals.
	 * @param mainFn The compiled template function.
	 * @param locals Local variables.
	 * @param children Whether this run is for a child block (internal use).
	 * @returns The rendered string.
	 */
	public async run(
		mainFn: Function,
		locals: Record<string, any>,
		children = false,
	) {
		return kireRuntime(this, mainFn, locals, children);
	}
}