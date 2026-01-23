import type { DirectiveDefinition, ElementDefinition, ICompilerConstructor, IParserConstructor, KireCache, KireClass, KireElementHandler, KireElementOptions, KireOptions, KirePlugin, KireSchematic } from "./types";
export declare class Kire implements KireClass {
    /**
     * Registry of available directives (e.g., @if, @for).
     * Maps directive names to their definitions.
     */
    $directives: Map<string, DirectiveDefinition>;
    /**
     * Set of registered custom HTML elements (e.g., <my-component>).
     */
    $elements: Set<ElementDefinition>;
    /**
     * Registry of global variables accessible in all templates.
     */
    $globals: Map<string, any>;
    /**
     * Registry of application-level global variables accessible directly in templates.
     */
    $app_globals: Map<string, any>;
    /**
     * Registry of namespaces for path resolution.
     * Maps prefix (e.g. "~") to absolute path templates.
     */
    namespaces: Map<string, string>;
    /**
     * Registry of default data for namespaces.
     */
    mounts: Map<string, Record<string, any>>;
    /**
     * Whether the instance is running in production mode.
     * In production, compiled templates are cached.
     */
    production: boolean;
    /**
     * Function used to resolve file content from a given path.
     * Defaults to throwing an error if not configured.
     */
    $resolver: (filename: string) => Promise<string>;
    /**
     * Optional function to list files in a directory, used by glob features.
     */
    $readdir?: (pattern: string) => Promise<string[]>;
    /**
     * Default extension for template files (e.g., "kire").
     */
    extension: string;
    /**
     * Cache of compiled template functions, keyed by file path.
     */
    $files: Map<string, Function>;
    /**
     * Constructor for the Parser class used by this instance.
     */
    $parser: IParserConstructor;
    /**
     * Constructor for the Compiler class used by this instance.
     */
    $compiler: ICompilerConstructor;
    /**
     * Name of the variable that holds local variables within the template scope.
     * Defaults to "it".
     */
    $var_locals: string;
    /**
     * Whether to expose local variables directly in the template scope (in addition to being under $var_locals).
     */
    $expose_locals: boolean;
    /**
     * General purpose cache for plugins and internal features.
     */
    $cache: Map<string, Map<string, any>>;
    /**
     * The function used to execute compiled code.
     */
    $executor: (code: string, params: string[]) => Function;
    /**
     * Clears the internal file and data cache.
     */
    cacheClear(): void;
    /**
     * Retrieves or initializes a namespaced cache store.
     * @param namespace The namespace for the cache.
     * @returns The cache map for the given namespace.
     */
    cached<T = any>(namespace: string): KireCache<T>;
    constructor(options?: KireOptions);
    /**
     * Registers a namespace with a path template.
     * @param name The namespace prefix (e.g. "~" or "plugin").
     * @param path The path template (e.g. "/abs/path/{theme}").
     * @returns The Kire instance.
     */
    namespace(name: string, path: string): this;
    /**
     * Mounts data to a namespace, used for resolving placeholders.
     * @param name The namespace prefix.
     * @param data The data object (e.g. { theme: 'dark' }).
     * @returns The Kire instance.
     */
    mount(name: string, data: Record<string, any>): this;
    /**
     * Registers a plugin with the Kire instance.
     * @param plugin The plugin object or function.
     * @param opts Optional configuration options for the plugin.
     * @returns The Kire instance for chaining.
     */
    plugin<KirePlugged extends KirePlugin<any>>(plugin: KirePlugged, opts?: KirePlugged["options"]): this;
    /**
     * Registry of schematics (e.g., custom attributes for IDE support).
     */
    $schematics: Map<string, any>;
    /**
     * Registers a schematic definition.
     * @param type The type of schematic (e.g., 'attributes').
     * @param data The schematic data.
     * @returns The Kire instance.
     */
    schematic(type: "attributes" | "attributes.global" | string, data: any): this;
    /**
     * Generates a schema definition for a package using this Kire instance configuration.
     * @param name Package name.
     * @param repository Repository URL or object.
     * @param version Package version.
     * @returns A KireSchematic object representing the current configuration.
     */
    pkgSchema(name: string, repository?: string | {
        type: string;
        url: string;
    }, version?: string): KireSchematic;
    /**
     * Registers a custom HTML element handler.
     * @param nameOrDef The tag name (string/RegExp) or a full element definition object.
     * @param handler The handler function to process the element.
     * @param options Additional options like 'void' (self-closing).
     * @returns The Kire instance for chaining.
     */
    element(nameOrDef: string | RegExp | ElementDefinition, handler?: KireElementHandler, options?: KireElementOptions): this;
    /**
     * Registers a custom directive.
     * @param def The directive definition object.
     * @returns The Kire instance for chaining.
     */
    directive(def: DirectiveDefinition): this;
    /**
     * Retrieves a registered directive by name.
     * @param name The name of the directive.
     * @returns The directive definition or undefined if not found.
     */
    getDirective(name: string): DirectiveDefinition | undefined;
    /**
     * Registers a global variable accessible in all templates.
     * @param key The variable name.
     * @param value The value.
     * @returns The Kire instance for chaining.
     */
    $ctx(key: string, value: any): this;
    /**
     * Registers an application-level global variable accessible directly in all templates.
     * Unlike $ctx, these are intended for data/constants rather than helpers.
     * @param key The variable name.
     * @param value The value.
     * @returns The Kire instance for chaining.
     */
    $global(key: string, value: any): this;
    /**
     * Parses a template string into an AST.
     * @param template The template string.
     * @returns An array of AST nodes.
     */
    parse(template: string): import("./types").Node[];
    /**
     * Compiles a template string into JavaScript source code.
     * @param template The template string.
     * @returns The compiled JavaScript code as a string.
     */
    compile(template: string): Promise<string>;
    /**
     * Compiles a template string into an executable async function.
     * @param content The template string.
     * @returns An async function that renders the template.
     */
    compileFn(content: string): Promise<Function>;
    /**
     * Renders a raw template string with provided locals.
     * @param template The template string.
     * @param locals Local variables for the template context.
     * @returns The rendered HTML string.
     */
    render(template: string, locals?: Record<string, any>): Promise<string>;
    /**
     * Generates a styled HTML error page for a given error.
     * Use this in your catch blocks to display errors nicely in the browser.
     * @param e The error object caught during rendering.
     * @returns A string containing the HTML error page.
     */
    renderError(e: any): string;
    /**
     * Renders a template file from the given path.
     * Uses the configured resolver and caches the compiled function in production mode.
     * @param path The file path relative to root or alias.
     * @param locals Local variables for the template context.
     * @returns The rendered HTML string.
     */
    view(path: string, locals?: Record<string, any>): Promise<string>;
    /**
     * Resolves a file path using namespaces and dot notation.
     * @param filepath The path to resolve (e.g. "theme.index" or "~/index").
     * @param locals Data to resolve path placeholders (e.g. {theme: 'dark'}).
     * @param extension Optional extension to use (defaults to instance extension). Pass null to avoid appending.
     * @returns The resolved absolute path.
     */
    resolvePath(filepath: string, locals?: Record<string, any>, extension?: string | null): string;
    /**
     * Executes a compiled template function with the given locals.
     * @param mainFn The compiled template function.
     * @param locals Local variables.
     * @param children Whether this run is for a child block (internal use).
     * @returns The rendered string.
     */
    run(mainFn: Function, locals: Record<string, any>, children?: boolean): Promise<any>;
}
