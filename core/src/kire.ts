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
	KireClass,
	KireElementHandler,
	KireElementOptions,
	KireOptions,
	KirePlugin,
	KireSchematic,
} from "./types";
import { resolvePath } from "./utils/resolve";

export class Kire implements KireClass {
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
	 * Registry of namespaces for path resolution.
	 * Maps prefix (e.g. "~") to absolute path templates.
	 */
	public namespaces: Map<string, string> = new Map();

	/**
	 * Registry of default data for namespaces.
	 */
	public mounts: Map<string, Record<string, any>> = new Map();

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
		this.production = options.production ?? true;
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
	 * Registers a namespace with a path template.
	 * @param name The namespace prefix (e.g. "~" or "plugin").
	 * @param path The path template (e.g. "/abs/path/{theme}").
	 * @returns The Kire instance.
	 */
	public namespace(name: string, path: string) {
		// Normalize to unix path
		const unixPath = path.replace(/\\/g, "/");
		this.namespaces.set(name, unixPath);
		return this;
	}

	/**
	 * Mounts data to a namespace, used for resolving placeholders.
	 * @param name The namespace prefix.
	 * @param data The data object (e.g. { theme: 'dark' }).
	 * @returns The Kire instance.
	 */
	public mount(name: string, data: Record<string, any>) {
		this.cacheClear();
		this.mounts.set(name, data);
		return this;
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
	 * Registry of schematics (e.g., custom attributes for IDE support).
	 */
	public $schematics: Map<string, any> = new Map();

	/**
	 * Registers a schematic definition.
	 * @param type The type of schematic (e.g., 'attributes').
	 * @param data The schematic data.
	 * @returns The Kire instance.
	 */
	public schematic(type: string, data: any) {
		if (type === "attributes") {
			if (!this.$schematics.has(type)) {
				this.$schematics.set(type, {});
			}
			const current = this.$schematics.get(type);
			for (const key in data) {
				if (!current[key]) current[key] = {};
				Object.assign(current[key], data[key]);
			}
		} else {
			this.$schematics.set(type, data);
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

		const processValue = (value: any): any => {
			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value)
			) {
				const result: Record<string, any> = {};

				Object.entries(value).forEach(([key, propValue]) => {
					result[key] = processValue(propValue);
				});

				return result;
			} else if (Array.isArray(value)) {
				return value.map((item) => processValue(item));
			} else {
				return typeof value;
			}
		};

		this.$globals.forEach((value, key) => {
			globals[key] = processValue(value);
		});

		return {
			package: name,
			repository,
			version,
			directives: Array.from(this.$directives.values()),
			elements: Array.from(this.$elements.values()),
			globals: globals,
			attributes: this.$schematics.get("attributes") || {},
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
				void: options?.void ?? false, // Default to false if not provided
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
		const code = `${await this.compile(content)}\n//# sourceURL=kire-generated.js`;
		try {
			const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

			const mainFn = new AsyncFunction("$ctx", code);
			(mainFn as any)._code = code;
			(mainFn as any)._source = content;

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
		let ext: string | null = this.extension;
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
			compiled = await this.compileFn(content);
			if (this.production) {
				this.$files.set(resolvedPath, compiled as any);
			}
		}

		if (!compiled) throw new Error(`Could not load view: ${path}`);
		return this.run(compiled, locals);
	}

	/**
	 * Resolves a file path using namespaces and dot notation.
	 * @param filepath The path to resolve (e.g. "theme.index" or "~/index").
	 * @param locals Data to resolve path placeholders (e.g. {theme: 'dark'}).
	 * @param extension Optional extension to use (defaults to instance extension). Pass null to avoid appending.
	 * @returns The resolved absolute path.
	 */
	public resolvePath(
		filepath: string,
		locals: Record<string, any> = {},
		extension: string | null = this.extension,
	): string {
		return resolvePath(
			filepath,
			this.namespaces,
			this.mounts,
			locals,
			extension === null ? "" : extension,
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
