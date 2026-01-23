import type { Kire } from "./kire";
import type { Node } from "./types";
export declare class Compiler {
    private kire;
    private preBuffer;
    private resBuffer;
    private posBuffer;
    private usedDirectives;
    constructor(kire: Kire);
    /**
     * Compiles a list of AST nodes into a JavaScript function body string.
     * @param nodes The root nodes of the AST.
     * @returns The compiled JavaScript code as a string.
     */
    compile(nodes: Node[]): Promise<string>;
    /**
     * Iterates over AST nodes and delegates compilation based on node type.
     * @param nodes List of nodes to compile.
     */
    private compileNodes;
    /**
     * Injects a comment indicating the source line number of the current node.
     * Used for error reporting mapping.
     * @param node The AST node.
     */
    private addSourceLine;
    /**
     * Compiles a text node, appending it to the result buffer.
     * @param node The text node.
     */
    private compileText;
    /**
     * Compiles a variable node, dealing with raw vs escaped output.
     * @param node The variable node.
     */
    private compileVariable;
    /**
     * Compiles a server-side JS node, injecting code directly into the buffer.
     * @param node The javascript node.
     */
    private compileJavascript;
    /**
     * Processes a directive node, executing its 'onCall' handler with a specific context.
     * @param node The directive node.
     */
    private processDirective;
    /**
     * Creates the CompilerContext API that is exposed to directive handlers.
     * @param node The current directive node.
     * @param directive The directive definition.
     * @returns The context object.
     */
    private createCompilerContext;
}
