import type { Kire } from "./kire";

export interface KireOptions<Streaming extends boolean = boolean> {
    production?: boolean;
    stream?: Streaming;
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
    bundled?: Record<string, Function | CompiledTemplate>;
    varLocals?: string;
}

export interface KireContext<Streaming extends boolean = boolean> {
    $globals: Record<string, any>;
    $props: Record<string, any>;
    $kire: Kire<Streaming>;
    $response: string;
    $escape: (v: any) => string;
    [key: string]: any;
}

export interface DependencyMetadata {
    execute: Function;
    isAsync: boolean;
}

export interface CompiledTemplate {
    execute: Function;
    isAsync: boolean;
    path: string;
    code: string;
    source: string;
    dependencies: Record<string, DependencyMetadata>; // MUDANÇA AQUI
}

export interface CompilerApi {
    prologue(jsCode: string): void;
    write(jsCode: string): void;
    epilogue(jsCode: string): void;
    append(content: string | number | boolean): void;
    renderChildren(nodes?: Node[]): void;
    uid(prefix: string): string;
    getAttribute(name: string): any;
    getArgument(index: number): any;
    depend(path: string): string;
    markAsync(): void;
    kire: Kire<any>;
    node: Node;
    [key: string]: any;
}

export type KireHandler = (api: CompilerApi) => void;

export interface ElementDefinition {
    name: string | RegExp;
    void?: boolean;
    onCall: KireHandler;
    related?: string[];
}

export interface DirectiveDefinition {
    name: string;
    params?: string[];
    children?: boolean | "auto";
    onCall: KireHandler;
    related?: string[];
    exposes?: string[];
}

export interface KirePlugin<Options extends object | undefined = {}> {
    name: string;
    sort?: number;
    load(kire: Kire<any>, opts?: Options): void;
}

export interface IParser {
    parse(): Node[];
    usedElements: Set<string>;
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
