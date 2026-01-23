import type { Kire } from "./kire";
import type { Node } from "./types";
export declare class Parser {
    template: string;
    kire: Kire;
    cursor: number;
    stack: Node[];
    rootChildren: Node[];
    line: number;
    column: number;
    constructor(template: string, kire: Kire);
    /**
     * Main parsing loop. Iterates through the template string and delegates parsing to specific methods.
     * @returns The root nodes of the parsed AST.
     */
    parse(): Node[];
    /**
     * Checks for and parses raw interpolation blocks {{{ ... }}}.
     * Example: {{{ content }}} -> { type: 'variable', raw: true, content: 'content' }
     * @returns True if a match was found and processed, false otherwise.
     */
    private checkRawInterpolation;
    /**
     * Checks for and parses server-side JavaScript blocks <?js ... ?>.
     * Example: <?js console.log('hi') ?> -> { type: 'javascript', content: "console.log('hi')" }
     * @returns True if a match was found and processed, false otherwise.
     */
    private checkJavascript;
    /**
     * Checks for and parses standard interpolation blocks {{ ... }}.
     * Example: {{ name }} -> { type: 'variable', raw: false, content: 'name' }
     * @returns True if a match was found and processed, false otherwise.
     */
    private checkInterpolation;
    /**
     * Checks for and parses escaped directive markers @@.
     * Example: @@if -> text node "@" + following text "if"
     * @returns True if a match was found and processed, false otherwise.
     */
    private checkEscapedDirective;
    /**
     * Checks for and parses directives starting with @.
     * Handles nested directives, sub-directives (else/elseif), arguments, and blocks.
     * Example: @if(true) ... @end
     * @returns True if a match was found and processed, false otherwise.
     */
    private checkDirective;
    /**
     * Extracts arguments from a directive string, handling nested parentheses and quotes.
     * @param offset The starting offset of the arguments in the template relative to the current cursor.
     * @returns An object containing the arguments string and the end index, or null if arguments are not balanced.
     */
    private extractArgs;
    /**
     * Handles children of a directive, determining if they should be parsed recursively or treated as raw text.
     * @param directiveDef The definition of the directive being processed.
     * @param node The current directive AST node.
     * @param argsEndIndex The end index of the directive's arguments.
     * @param fullContent The full string content of the directive (e.g. "@if(true)").
     * @returns True if raw children were processed and the cursor advanced, false otherwise.
     */
    private handleDirectiveChildren;
    /**
     * Handles raw content for directives that do not parse their children (e.g. valid 'childrenRaw' directives).
     * Finds the matching @end tag and treats everything in between as text.
     * @param node The current directive AST node.
     * @param argsEndIndex The end index of the directive's arguments.
     * @param fullContent The full string content of the directive.
     * @returns True indicating the content was processed.
     */
    private handleRawChildren;
    /**
     * Parses plain text content until the next interpolation or directive is found.
     */
    private parseText;
    /**
     * Handles the @end directive, closing the current block and potentially parent blocks (e.g. closing @if when @else ends).
     */
    private handleEndDirective;
    /**
     * Handles sub-directives like @else or @elseif, attaching them to their parent directive.
     * @param name The name of the sub-directive.
     * @param argsStr The arguments string.
     * @param fullMatch The full match string of the directive start.
     * @param parentNode The parent directive node (e.g. the @if node).
     * @param subDef The definition of the sub-directive.
     * @param loc The source location.
     */
    private handleSubDirective;
    /**
     * Calculates the end location (line, column) for a given text content starting from the current parser position.
     * @param content The text content to measure.
     * @returns An object with start and end location info.
     */
    private getLoc;
    /**
     * Adds a node to the current stack tip or to the root children if the stack is empty.
     * @param node The node to add.
     */
    private addNode;
    /**
     * Advances the cursor, line, and column numbers based on the consumed string.
     * @param str The string content that has been processed.
     */
    private advance;
    /**
     * Parses a string of arguments (e.g. "var1, 'string', 123") into an array of values.
     * Handles quoted strings and nested parentheses/brackets.
     * @param argsStr The raw arguments string.
     * @returns An array of parsed arguments.
     */
    private parseArgs;
}
