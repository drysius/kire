import type { Kire } from "./kire";

export type KireCache<T = any> = Record<string, T>;

export interface IParser {
	parse(): Node[];
	usedElements: Set<string>;
}

export type IParserConstructor = new (template: string, kire: Kire<any>) => IParser;

export interface ICompiler {
	compile(nodes: Node[], extraGlobals?: string[], usedElements?: Set<string>): string;
}
export type ICompilerConstructor = new (
	kire: Kire<any>,
	filename?: string,
) => ICompiler;

export type KireExecutor = (code: string, params: string[]) => Function;

/**
 * Options for configuring the Kire instance.
 */
export interface KireOptions<Streaming extends boolean = boolean> {
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
	stream?: Streaming;
	/**
	 * Root directory for resolving templates. Defaults to process.cwd().
	 */
	root?: string;
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
	 * Map of pre-loaded template files (cached).
	 */
	files?: Record<string, string>;
    /**
     * Map of virtual template files (not cached).
     */
    vfiles?: Record<string, string>;
	/**
	 * Map of pre-compiled JavaScript functions or templates.
	 */
	bundled?: Record<string, Function | CompiledTemplate>;
	/**
	 * Name of the variable exposing locals in the template. Defaults to "it".
	 */
	varLocals?: string;
	/**
	 * Parent Kire instance if this is a fork
	 */
	parent?: Kire<any>;
}

export type KireHookName = "before" | "rendered" | "after" | "end";
export type KireHookCallback = (ctx: KireContext<any>) => Promise<void> | void;

export class KireHooks {
    before: KireHookCallback[] = [];
    rendered: KireHookCallback[] = [];
    after: KireHookCallback[] = [];
    end: KireHookCallback[] = [];
}

/**
 * The runtime context object ($ctx) used during template execution.
 */
export interface KireContext<Streaming extends boolean = boolean> {
	$globals: Record<string, any>;
	$props: Record<string, any>;
	$file: KireFileMeta;
	$kire: Kire<Streaming>;
	$response: string;

	$add(str: string): void;
	$on(event: KireHookName, callback: KireHookCallback): void;
	$emit(event: KireHookName): Promise<void>;
	$resolve(path: string): string;
	$merge(func: (ctx: KireContext<Streaming>) => Promise<void>): Promise<void>;
	$require?(path: string, locals?: Record<string, any>, controller?: ReadableStreamDefaultController): Promise<string | null>;
	$md5(str: string): string;
	$escape(unsafe: any): string;
	$typed<T>(key: string): T;
	$emptyResponse(): KireContext<Streaming>;
	$hooks: KireHooks;
	[key: string]: any;
	$deferred?: (() => Promise<any>)[];
    $fork(): KireContext<Streaming>;
}

export interface CompiledTemplate {
	execute: Function;
	isAsync: boolean;
	usedElements?: Set<string>;
	path: string;
	code: string;
	source: string;
	map?: any;
    dependencies?: Record<string, CompiledTemplate>;
}

export interface KireFileMeta extends CompiledTemplate {
	name: string;
	children?: boolean;
	controller?: ReadableStreamDefaultController;
}

/**
 * The context object passed to directives and elements during compilation.
 */
export interface CompilerContext {
	kire: Kire<any>;
	count(name: string): string;
	node: Node;
	param(name: string | number): any;
	render(content: string): string;
	func(code: string): string;
	pre(code: string): void;
	res(content: string): void;
	raw(code: string): void;
	pos(code: string): void;
	$pre(code: string): void;
	$pos(code: string): void;
	error(message: string): void;
	resolve(path: string): string;
    depend(path: string, extraGlobals?: string[]): string;
	children?: Node[];
	parents?: Node[];
	merge(callback: (ctx: CompilerContext) => void): void;
	set(nodes: Node[]): void;
}

export interface ElementCompilerContext extends CompilerContext {
    tagName: string;
    attributes: Record<string, string>;
    attribute(name: string): any;
    wildcard?: string;
}

export type KireElementCompilerHandler = (ctx: ElementCompilerContext) => void;

export interface ElementDefinition {
	name: string | RegExp;
	description?: string;
	example?: string;
	void?: boolean;
	declare?: Record<string, any>;
	type?: "html" | "javascript" | "css";
	attributes?: string[] | Record<string, AttributeDefinition | string>;
	onCall: KireElementCompilerHandler;
	parents?: ElementDefinition[];
}

export interface DirectiveDefinition {
	name: string;
	params?: string[];
	children?: boolean | "auto";
	childrenRaw?: boolean;
	parents?: DirectiveDefinition[];
	onCall: (compiler: CompilerContext) => void;
	onInit?: (ctx: KireContext<any>) => void | Promise<void>;
	description?: string;
	example?: string;
	type?: "css" | "js" | "html";
}

export interface AttributeDefinition {
	type: string;
	comment?: string;
	example?: string;
}

export interface KirePlugin<Options extends object | undefined = {}> {
	name: string;
	sort?: number;
	options: Options;
	load(kire: Kire<any>, opts?: Options): void;
}

// AST Types
export type NodeType = "text" | "variable" | "directive" | "javascript" | "element";

export interface SourceLocation {
	line: number;
	column: number;
}

export interface Node {
	type: NodeType;
	content?: string;
	name?: string; 
	args?: any[]; 
    attributes?: Record<string, string>; 
    tagName?: string; 
    wildcard?: string; 
	start?: number;
	end?: number;
	loc?: {
		start: SourceLocation;
		end: SourceLocation;
	};
	children?: Node[]; 
	related?: Node[]; 
	raw?: boolean;
    void?: boolean; 
}

export interface TypeDefinition {
	variable: string;
	type: "global" | "context" | "element" | "directive";
	comment?: string;
	example?: string;
	tstype?: string | string[];
}

export interface KireSchemaDefinition {
    name: string;
    author?: string;
    version?: string;
    repository?: string;
}
