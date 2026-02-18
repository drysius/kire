import type { Kire } from "./kire";

// ==========================================
// Kire Render & Options
// ==========================================

export type KireRendered<Asyncronos extends boolean = true> = 
    Asyncronos extends true ? Promise<string> : 
    string;

export interface KireOptions<Asyncronos extends boolean = boolean> {
    production?: boolean;
    async?: Asyncronos;
    root?: string;
    extension?: string;
    silent?: boolean;
    local_variable?: string;
    max_renders?: number;
    // Opção para definir o arquivo de cache/bundle inicial
    files?: Record<string, string | KireTplFunction>;
    // If true, doesn't load native elements and directives
    emptykire?: boolean;
    // Internal use for forking
    parent?: Kire<any>;
}

// ==========================================
// Cache & Compilation System
// ==========================================

// ==========================================
// Engine Interfaces & Types
// ==========================================

export interface KirePlatform {
    readFile(path: string): string;
    exists(path: string): boolean;
    readDir(path: string): string[];
    stat(path: string): any;
    writeFile(path: string, data: string): void;
    resolve(...args: string[]): string;
    join(...args: string[]): string;
    isAbsolute(path: string): boolean;
    relative(from: string, to: string): string;
    cwd(): string;
    env(key: string): string | undefined;
    isProd(): boolean;
}

export interface KireConfig {
    production: boolean;
    async: boolean;
    root: string;
    extension: string;
    silent: boolean;
    var_locals: string;
    namespaces: Record<string, string>;
    max_renders: number;
}

export interface KireRuntime {
    escapeHtml(v: any): string;
    NullProtoObj: any;
    KireError: any;
    renderErrorHtml: any;
    createKireFunction: any;
}

export interface KireCacheEntry {
    ast?: Node[];
    fn?: KireTplFunction;
    code?: string;
    async: boolean;
    time: number;
    dependencies: Record<string, string>;
    source: string;
    // ID único para sourcemaps/debug
    id?: string;
}


export interface DependencyMetadata {
    execute: KireTplFunction;
    async: boolean;
}

export type KireTplFunctionBase = (this: Kire<any>, locals?: object, globals?: object) => string | Promise<string>;

export interface KireTplFunction extends KireTplFunctionBase {
    /** Metadata about the compiled template */
    meta: {
        async: boolean;
        path: string;
        source: string;
        code: string;
        map?: any;
        dependencies: Record<string, string>;    
    }
}

// ==========================================
// Compiler API
// ==========================================

export interface CompilerApi {
    prologue(jsCode: string): void;
    write(jsCode: string): void;
    epilogue(jsCode: string): void;
    after(jsCode: string): void;
    markAsync(): void;
    getDependency(path: string): KireTplFunction;
    depend(path: string): string;
    append(content: string | number | boolean): void;
    renderChildren(nodes?: Node[]): void;
    uid(prefix: string): string;
    getAttribute(name: string): any;
    getArgument(index: number): any;
    transform(code: string): string;
    raw(jsCode: string): void;
    res(content: any): void;
    set(nodes: Node[]): void;
    attribute(name: string): any;
    param(name: string | number): any;
    inject(jsCode: string): void;
    existVar(name: string, callback: (api: CompilerApi) => void, unique?: boolean): void;
    
    kire: Kire<any>;
    node: Node;
    editable: boolean;
    fullBody: string;
    allIdentifiers: Set<string>;
    wildcard?: string;
    children?: Node[];
    [key: string]: any;
}

export type KireHandler = (api: CompilerApi) => void;

// ==========================================
// Definitions (Runtime Logic)
// ==========================================

export interface ElementDefinition {
    // Runtime matching
    name: string | RegExp;
    onCall: KireHandler;
    
    // Schema/Doc Metadata
    void?: boolean;
    description?: string;
    example?: string;
    related?: string[];
    attributes?: KireAttributeDeclaration[];
}

export interface DirectiveDefinition {
    // Runtime matching
    name: string;
    onCall: KireHandler;
    
    // Schema/Doc Metadata
    params?: string[];
    children?: boolean | "auto";
    related?: string[];
    exposes?: string[];
    description?: string;
    example?: string;
}

export interface KirePlugin<Options extends object | undefined = {}> {
    name: string;
    sort?: number;
    load(kire: Kire<any>, opts?: Options): void;
}

export interface KireExistVar {
    name: string | RegExp; // String or Regex pattern
    unique: boolean;
    callback: KireHandler;
}

// ==========================================
// Schema (VS Code / Tooling)
// ==========================================

export interface KireSchemaObject {
    name: string;
    version: string;
    author?:string;
    repository?: string;
    dependencies: string[];
    directives: KireDirectiveDeclaration[];
    elements: KireElementDeclaration[];
    attributes: KireAttributeDeclaration[];
    types: TypeDefinition[];
}

export interface KireDirectiveDeclaration {
    name: string;
    description?: string;
    params?: string[];
    children?: boolean | "auto";
    example?: string;
    related?: string[];
    exposes?: string[];
}

export interface KireElementDeclaration {
    name: string;
    description?: string;
    void?: boolean;
    attributes?: KireAttributeDeclaration[];
    example?: string;
    related?: string[];
}

export interface KireAttributeDeclaration {
    name: string;
    type?: string | string[];
    description?: string;
    example?: string;
}

export interface TypeDefinition {
    variable: string;
    type: "global" | "context" | "prop";
    comment?: string;
    tstype: string;
}

// ==========================================
// Engine Interfaces
// ==========================================

export interface IParser {
    parse(): Node[];
}
export type IParserConstructor = new (template: string, kire: Kire<any>) => IParser;

export interface ICompiler {
    compile(nodes: Node[], extraGlobals?: string[]): string;
    async: boolean;
    getDependencies(): Record<string, string>;
}
export type ICompilerConstructor = new (kire: Kire<any>, filename?: string) => ICompiler;

// ==========================================
// AST Nodes
// ==========================================

export type NodeType = "text" | "interpolation" | "directive" | "js" | "element";

export interface Node {
    type: NodeType;
    content?: string;
    name?: string; 
    args?: any[]; 
    attributes?: Record<string, string>; 
    tagName?: string; 
    wildcard?: string; 
    children?: Node[]; 
    related?: Node[]; 
    raw?: boolean;
    void?: boolean; 
    loc?: {
        line: number;
        column: number;
    };
}
