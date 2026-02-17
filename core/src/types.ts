import type { Kire } from "./kire";

export type KireRendered<Streaming extends boolean = false, Asyncronos extends boolean = true> = 
    Streaming extends true ? ReadableStream : 
    Asyncronos extends true ? Promise<string> : 
    string;

export interface KireOptions<Streaming extends boolean = boolean, Asyncronos extends boolean = boolean> {
    production?: boolean;
    stream?: Streaming;
    async?: Asyncronos;
    root?: string;
    extension?: string;
    directives?: boolean;
    silent?: boolean;
    plugins?: (KirePlugin | [KirePlugin, any])[];
    engine?: {
        parser?: IParserConstructor;
        compiler?: ICompilerConstructor;
    };
    files?: Record<string, string>;
    vfiles?: Record<string, string>;
    bundled?: Record<string, KireTplFunction>;
    varLocals?: string;
    parent?: Kire<any>;
    attributes?: Record<string, AttributeDefinition | string>;
}

export interface DependencyMetadata {
    execute: KireTplFunction;
    isAsync: boolean;
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
    varThen(name: string, callback: (api: CompilerApi) => void): void;
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

export interface ElementDefinition {
    name: string | RegExp;
    void?: boolean;
    onCall: KireHandler;
    related?: string[];
    description?: string;
    example?: string;
}

export interface DirectiveDefinition {
    name: string;
    params?: string[];
    children?: boolean | "auto";
    onCall: KireHandler;
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

export interface KireSchemaDefinition {
    name: string;
    author?: string;
    version?: string;
    repository?: string;
    attributes?: Record<string, AttributeDefinition | string>;
}

export interface AttributeDefinition {
    type: string | string[];
    description?: string;
    example?: string;
}

export interface TypeDefinition {
    variable: string;
    type: "global" | "context" | "prop";
    comment?: string;
    tstype: string;
}

export interface IParser {
    parse(): Node[];
}
export type IParserConstructor = new (template: string, kire: Kire<any>) => IParser;

export interface ICompiler {
    compile(nodes: Node[], extraGlobals?: string[]): string;
    isAsync: boolean;
    getDependencies(): Map<string, string>;
}
export type ICompilerConstructor = new (kire: Kire<any>, filename?: string) => ICompiler;

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
