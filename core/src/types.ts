import type { Kire } from "./kire";
import type { LayeredMap } from "./utils/layered-map";

export type KireCache<T = any> = Map<string, T>;

export interface IParser {
	parse(): Node[];
}

export type IParserConstructor = new (template: string, kire: Kire) => IParser;

export interface ICompiler {
	compile(nodes: Node[]): Promise<string>;
}
export type ICompilerConstructor = new (
	kire: Kire,
	filename?: string,
) => ICompiler;

export type KireExecutor = (code: string, params: string[]) => Function;
/**
 * Options for configuring the Kire instance.
 */
export interface KireOptions {
	/**
	 * Custom code executor (e.g., for VM isolation).
	 */
	executor?: KireExecutor;
	/**
	 * Whether to run in production mode (enables caching). Defaults to true.
	 */
	production?: boolean;
	/**
	 * Whether to stream the response instead of buffering. Defaults to false.
	 */
	stream?: boolean;
	/**
	 * Custom file resolver function.
	 */
	resolver?: (filename: string) => Promise<string>;
	/**
	 * Default file extension for templates. Defaults to "kire".
	 */
	extension?: string;
	/**
	 * Whether to load default directives. Defaults to true.
	 */
	directives?: boolean;
	/**
	 * Whether to suppress warnings and logs of kire.
	 */
	silent?:boolean;
	/**
	 * List of plugins to load.
	 */
	plugins?: (KirePlugin | [KirePlugin, any])[];
	/**
	 * Custom engine components.
	 */
	engine?: {
		parser?: IParserConstructor;
		compiler?: ICompilerConstructor;
	};
	/**
	 * Name of the variable exposing locals in the template. Defaults to "it".
	 */
	varLocals?: string;
	/**
	 * Parent Kire instance if this is a fork
	 */
	parent?: Kire;
}

export type KireHook = "before" | "after" | "end";

/**
 * The runtime context object ($ctx) used during template execution.
 */
export interface KireContext {
	/**
	 * The LayeredMap containing global variables.
	 * Can be destructured at the start of the template.
	 */
	$globals: LayeredMap<string, any> | Map<string, any>;

	/**
	 * The local variables passed to the render function.
	 * Often aliased as 'it' or defined via varLocals option.
	 */
	$props: Record<string, any>;

	/**
	 * Information about the current file being rendered.
	 */
	$file: KireFileMeta;

	/**
	 * The Kire instance (or fork) executing this template.
	 */
	$kire: Kire;

	/**
	 * The accumulated output string.
	 */
	$response: string;

	/**
	 * Appends content to the response buffer.
	 * @param str The content to append.
	 */
	$add(str: string): void;

	/**
	 * Adds an event listener for lifecycle hooks.
	 * @param event The event name ('before', 'after', 'end').
	 * @param callback The function to execute.
	 */
	$on(
		event: KireHook,
		callback: (ctx: KireContext) => Promise<void> | void,
	): void;

	/**
	 * Emits a lifecycle event.
	 * @param event The event name.
	 */
	$emit(event: KireHook): Promise<void>;

	/**
	 * Resolves a file path relative to the project root and aliases.
	 */
	$resolve(path: string): string;

	/**
	 * Creates a new isolation scope for capturing output (e.g. for slots or defines).
	 * @param func The function to execute within the merged scope.
	 */
	$merge(func: (ctx: KireContext) => Promise<void>): Promise<void>;

	/**
	 * Imports and renders another .kire template.
	 */
	$require?(path: string, locals?: Record<string, any>, controller?: ReadableStreamDefaultController): Promise<string | null>;

	/**
	 * Helper for MD5 hashing.
	 */
	$md5(str: string): string;

	/**
	 * Helper for HTML escaping.
	 */
	$escape(unsafe: any): string;

	/**
	 * Typed $ctx context use key of $ctx context with you type
	 * @param key
	 */
	$typed<T>(key: string): T;

	/**
	 * Runtime hooks
	 * @param key
	 */
	$hooks: Map<KireHook, ((ctx: KireContext) => Promise<void> | void)[]>;

	/**
	 * Arbitrary locals and globals access (fallback).
	 */
	[key: string]: any;

	/**
	 * Pending deferred tasks for out-of-order streaming.
	 */
	$deferred?: (() => Promise<any>)[];

    /**
     * Forks the context for isolated execution (e.g. deferred tasks).
     */
    $fork(): KireContext;
}

export interface KireFileMeta {
	path: string;
	name: string;
	execute: Function;
	code: string;
	source: string;
	map?: any; // Source Map
	children?: boolean;
	controller?: ReadableStreamDefaultController;
}

/**
 * The context object passed to directives during compilation.
 * Renamed from KireContext to CompilerContext to avoid confusion with the runtime context.
 */
export interface CompilerContext {
	/**
	 * Kire instance
	 */
	kire: Kire;

	/**
	 * Generates a unique ID for the current compilation.
	 */
	count(name: string): string;

	/**
	 * The current node being compiled.
	 */
	node: Node;

	/**
	 * Retrieves a parameter passed to the directive.
	 * @param name The name or index of the parameter.
	 */
	param(name: string | number): any;

	/**
	 * Compiles a string of Kire template content.
	 * @param content The template string to compile.
	 * @returns The compiled function code as a string.
	 */
	render(content: string): Promise<string>;

	/**
	 * Wraps the provided code in an async function definition.
	 * @param code The function body.
	 */
	func(code: string): string;

	/**
	 * Appends code to the pre-buffer.
	 */
	pre(code: string): void;

	/**
	 * Appends content to the result buffer.
	 */
	res(content: string): void;

	/**
	 * Appends raw code to the result buffer.
	 */
	raw(code: string): void;

	/**
	 * Appends code to the pos-buffer.
	 */
	pos(code: string): void;

	/**
	 * Appends code to the global pre-hook.
	 */
	$pre(code: string): void;

	/**
	 * Appends code to the global post-hook.
	 */
	$pos(code: string): void;

	/**
	 * Throws a compilation error with a specific message.
	 */
	error(message: string): void;

	/**
	 * Resolves a file path relative to the project root and aliases.
	 */
	resolve(path: string): string;

	// --- Nesting & Structure ---

	/**
	 * The children nodes of the current directive (for block directives).
	 */
	children?: Node[];

	/**
	 * Related nodes, such as chained directives (e.g., elseif, else).
	 */
	parents?: Node[];

	/**
	 * Compiles and processes a set of nodes, appending their logic to the current flow.
	 */
	set(nodes: Node[]): Promise<void>;
}

/**
 * Context provided to element handlers (middleware) for manipulating HTML output.
 */
export interface KireElementContext extends KireContext {
	/**
	 * The current global HTML content string. This is mutable and represents the state of the document.
	 */
	content: string;

	/**
	 * Details about the specific HTML element being processed.
	 */
	element: {
		/**
		 * The tag name of the element (e.g., "div", "custom-tag").
		 */
		tagName: string;
		/**
		 * A map of the element's attributes.
		 */
		attributes: Record<string, string>;
		/**
		 * The inner HTML content of the element.
		 */
		inner: string;
		/**
		 * The full outer HTML of the element (including tags).
		 */
		outer: string;
	};

	/**
	 * Updates the entire global HTML content.
	 * @param newContent The new HTML content string.
	 */
	update(newContent: string): void;

	/**
	 * Replaces the current element's outer HTML in the global content.
	 * @param replacement The string to replace the element with.
	 */
	replace(replacement: string): void;

	/**
	 * Replaces the current element's outer HTML in the global content.
	 * @param replacement The string to replace the element with.
	 */
	replaceElement(replacement: string): void;

	/**
	 * Replaces the current element's inner HTML in the global content.
	 * @param replacement The string to replace the inner content with.
	 */
	replaceContent(replacement: string): void;
}

export type KireElementHandler = (
	ctx: KireElementContext,
) => Promise<void> | void;

export interface KireElementOptions {
	/**
	 * Whether the element is a void element (self-closing, no closing tag).
	 */
	void?: boolean;
}

export interface ElementDefinition {
	name: string | RegExp;
	description?: string;
	example?: string;
	void?: boolean;
	type?: "html" | "javascript" | "css";
	attributes?: Record<string, AttributeDefinition | string>;
	onCall?: KireElementHandler; // Optional because schematic-only elements don't have handlers
}

/**
 * Definition of a custom directive.
 */
export interface DirectiveDefinition {
	/**
	 * The name of the directive (used as @name).
	 */
	name: string;
	/**
	 * Parameter definitions (e.g., ['filepath:string']).
	 */
	params?: string[];
	/**
	 * Whether this directive accepts a block ending with @end.
	 * If "auto", the parser checks for a matching @end tag to decide.
	 */
	children?: boolean | "auto";
	/**
	 * Should the children be treated as raw text instead of parsed nodes?
	 */
	childrenRaw?: boolean;
	/**
	 * Sub-directives associated with this one (e.g., elseif, else for @if).
	 */
	parents?: DirectiveDefinition[];
	/**
	 * Function called when the directive is encountered during compilation.
	 */
	onCall: (compiler: CompilerContext) => void | Promise<void>;
	/**
	 * Function called once per compilation when the directive is first used.
	 */
	onInit?: (ctx: KireContext) => void | Promise<void>;

	description?: string;
	example?: string;
	/**
	 * The type of logic this directive handles (css, js, or html structure).
	 */
	type?: "css" | "js" | "html";
}

export interface AttributeDefinition {
	type: string;
	comment?: string;
	example?: string;
}

export interface KireSchematic {
	package: string;
	$schema: string;
	repository?: string | { type: string; url: string };
	version?: string;
	directives?: DirectiveDefinition[];
	elements?: ElementDefinition[];
	globals?: Record<string, any>;
	attributes?: Record<string, Record<string, AttributeDefinition | string>>;
}

export interface KirePlugin<Options extends object | undefined = {}> {
	name: string;
	sort?: number;
	options: Options;
	load(kire: Kire, opts?: Options): void;
}

// AST Types
export type NodeType = "text" | "variable" | "directive" | "javascript";

export interface SourceLocation {
	line: number;
	column: number;
}

export interface Node {
	type: NodeType;
	content?: string;
	name?: string; // For directives
	args?: any[]; // For directives
	start?: number;
	end?: number;
	loc?: {
		start: SourceLocation;
		end: SourceLocation;
	};
	children?: Node[]; // Inner content
	related?: Node[]; // For 'parents' (elseif, etc)
	raw?: boolean;
}
