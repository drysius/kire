import { Compiler } from "./compiler";
import { KireDirectives } from "./directives";
import { Parser } from "./parser";
import KireRuntime from "./runtime";
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
import { LayeredMap } from "./utils/layered-map";
import { resolvePath } from "./utils/resolve";
import { AsyncFunction, scoped } from "./utils/scoped";

export class Kire {
	/**
	 * Helper to execute code within a specific scope.
	 */
	public $scoped = scoped;

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
	public $globals: LayeredMap<string, any> = new LayeredMap();

	/**
	 * Registry of application-level $ctx variables accessible directly in templates.
	 */
	public $contexts: LayeredMap<string, any> = new LayeredMap();

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
	 * General purpose cache for plugins and internal features.
	 */
	public $cache: Map<string, Map<string, any>> = new Map();

	/**
	 * The function used to execute compiled code.
	 */
	public $executor: (code: string, params: string[]) => Function;

	/**
	 * Clears the internal file and data cache.
	 */
	public cacheClear() {
		this.$cache.clear();
		this.$files.clear();
	}

	/**
	 * Reference to the parent Kire instance if this is a fork.
	 */
	protected $parent?: Kire;

	/**
	 * Creates a forked instance of Kire.
	 * The fork shares cache, compiled files, directives, elements, and configuration with the parent,
	 * but has isolated context ($globals and $app_globals).
	 *
	 * Use this for per-request isolation while maintaining performance.
	 */
	public fork(): Kire {
		// Initialize without default directives to avoid overhead
		const fork = new Kire({
			directives: false,
			parent: this,
		});

		// Link to parent
		fork.$parent = this;

		// Copy configuration
		fork.production = this.production;
		fork.extension = this.extension;
		fork.$var_locals = this.$var_locals;
		fork.$resolver = this.$resolver;
		fork.$executor = this.$executor;
		fork.$parser = this.$parser;
		fork.$compiler = this.$compiler;
		fork.$readdir = this.$readdir;

		// Share heavyweight/static resources by reference
		fork.$cache = this.$cache;
		fork.$files = this.$files;
		fork.$directives = this.$directives;
		fork.$elements = this.$elements;
		fork.$schematics = this.$schematics;
		fork.namespaces = this.namespaces;
		fork.mounts = this.mounts;

		fork.$globals = new LayeredMap(this.$globals);
		fork.$contexts = new LayeredMap(this.$contexts);

		return fork;
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
		this.$parent = options.parent;

		// Default executor using AsyncFunction
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
	public schematic(
		type: "attributes" | "attributes.global" | string,
		data: any,
	) {
		if (type === "attributes") {
			if (!this.$schematics.has(type)) {
				this.$schematics.set(type, {});
			}
			const current = this.$schematics.get(type);
			for (const key in data) {
				if (!current[key]) current[key] = {};
				Object.assign(current[key], data[key]);
			}
		} else if (type === "attributes.global") {
			if (!this.$schematics.has("attributes")) {
				this.$schematics.set("attributes", {});
			}
			const current = this.$schematics.get("attributes");
			if (!current.global) current.global = {};
			Object.assign(current.global, data);
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

		this.$contexts.forEach((value, key) => {
			globals[key] = processValue(value);
		});

		const elements = Array.from(this.$elements.values());
		const schematicElements = this.$schematics.get("elements");
		if (schematicElements) {
			// schematicElements is a Record<string, ElementDefinition>
			Object.entries(schematicElements).forEach(
				([name, def]: [string, any]) => {
					elements.push({ name, ...def });
				},
			);
		}

		return {
			$schema:
				"https://raw.githubusercontent.com/drysius/kire/refs/heads/main/schema.json",
			package: name,
			repository,
			version,
			directives: Array.from(this.$directives.values()),
			elements,
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
		opts?: KireElementOptions,
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
				void: opts?.void ?? false, // Default to false if not provided
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
		this.$contexts.set(key, value);
		return this;
	}

	/**
	 * Registers an application-level global variable accessible directly in all templates.
	 * Unlike $ctx, these are intended for data/constants rather than helpers.
	 * @param key The variable name.
	 * @param value The value.
	 * @returns The Kire instance for chaining.
	 */
	public $global(key: string, value: any) {
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
		const code = `${await this.compile(content)}`;
		try {
			const mainFn = this.$executor(code, ["$ctx"]);
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
	 * Generates a styled HTML error page for a given error.
	 * Use this in your catch blocks to display errors nicely in the browser.
	 * @param e The error object caught during rendering.
	 * @returns A string containing the HTML error page.
	 */
	public renderError(e: any): string {
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
	</style>
</head>
<body>
	<div class="error-container">
		<div class="error-header">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
			Kire Runtime Error
		</div>
		<div class="error-content">
			<pre>${(e.message || e.toString()).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
		</div>
	</div>
</body>
</html>`;
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
		mainFn: Function & { [key: string]: any },
		locals: Record<string, any>,
		children = false,
	) {
		return KireRuntime(this, locals, {
			children,
			code: mainFn._code,
			execute: mainFn,
			name: mainFn.name,
			source: mainFn._source,
			path: mainFn._path,
		});
	}
}
