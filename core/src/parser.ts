import type { Kire } from "./kire";
import type { DirectiveDefinition, Node } from "./types";
import { isPatternDefinition } from "./utils/params";

export class Parser {
	public cursor = 0;
	public stack: Node[] = [];
	public rootChildren: Node[] = [];
	public line = 1;
	public column = 1;
	public usedElements: Set<string> = new Set();

	constructor(
		public template: string,
		public kire: Kire,
	) {}

	/**
	 * Main parsing loop. Iterates through the template string and delegates parsing to specific methods.
	 * @returns The root nodes of the parsed AST.
	 */
	public parse(): Node[] {
		this.cursor = 0;
		this.stack = [];
		this.rootChildren = [];
		const len = this.template.length;

		while (this.cursor < len) {
			if (this.checkComment()) continue;
			if (this.checkRawInterpolation()) continue;
			if (this.checkJavascript()) continue;
			if (this.checkInterpolation()) continue;
			if (this.checkEscapedDirective()) continue;
			if (this.checkDirective()) continue;

			this.parseText();
		}

		return this.rootChildren;
	}

	/**
	 * Checks for and parses Blade-style comments {{-- ... --}}.
	 * Comments are stripped from the output.
	 */
	private checkComment(): boolean {
		if (this.template.startsWith("{{--", this.cursor)) {
			const end = this.template.indexOf("--}}", this.cursor + 4);
			if (end !== -1) {
				const content = this.template.slice(this.cursor, end + 4);
				this.advance(content);
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks for and parses raw interpolation blocks {{{ ... }}}.
	 * Example: {{{ content }}} -> { type: 'variable', raw: true, content: 'content' }
	 * @returns True if a match was found and processed, false otherwise.
	 */
	private checkRawInterpolation(): boolean {
		if (this.template.startsWith("{{{", this.cursor)) {
			const end = this.template.indexOf("}}}", this.cursor + 3);
			if (end !== -1) {
				const content = this.template.slice(this.cursor, end + 3);
				const inner = this.template.slice(this.cursor + 3, end);
				this.addNode({
					type: "variable",
					content: inner.trim(),
					raw: true,
					start: this.cursor,
					end: end + 3,
					loc: this.getLoc(content),
				});
				this.advance(content);
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks for and parses server-side JavaScript blocks <?js ... ?>.
	 * Example: <?js console.log('hi') ?> -> { type: 'javascript', content: "console.log('hi')" }
	 * @returns True if a match was found and processed, false otherwise.
	 */
	private checkJavascript(): boolean {
		if (this.template.startsWith("<?js", this.cursor)) {
			const end = this.template.indexOf("?>", this.cursor + 4);
			if (end !== -1) {
				const content = this.template.slice(this.cursor, end + 2);
				const inner = this.template.slice(this.cursor + 4, end);
				this.addNode({
					type: "javascript",
					content: inner,
					start: this.cursor,
					end: end + 2,
					loc: this.getLoc(content),
				});
				this.advance(content);
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks for and parses standard interpolation blocks {{ ... }}.
	 * Example: {{ name }} -> { type: 'variable', raw: false, content: 'name' }
	 * @returns True if a match was found and processed, false otherwise.
	 */
	private checkInterpolation(): boolean {
		if (this.template.startsWith("{{", this.cursor)) {
			const end = this.template.indexOf("}}", this.cursor + 2);
			if (end !== -1) {
				const content = this.template.slice(this.cursor, end + 2);
				const inner = this.template.slice(this.cursor + 2, end);
				this.addNode({
					type: "variable",
					content: inner.trim(),
					raw: false,
					start: this.cursor,
					end: end + 2,
					loc: this.getLoc(content),
				});
				this.advance(content);
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks for and parses escaped directive markers @@.
	 * Example: @@if -> text node "@" + following text "if"
	 * @returns True if a match was found and processed, false otherwise.
	 */
	private checkEscapedDirective(): boolean {
		if (this.template.startsWith("@@", this.cursor)) {
			this.addNode({
				type: "text",
				content: "@",
				start: this.cursor,
				end: this.cursor + 2,
				loc: this.getLoc("@@"),
			});
			this.advance("@@");
			return true;
		}
		return false;
	}

	/**
	 * Checks for and parses directives starting with @.
	 * Handles nested directives, sub-directives (else/elseif), arguments, and blocks.
	 * Example: @if(true) ... @end
	 * @returns True if a match was found and processed, false otherwise.
	 */
	private checkDirective(): boolean {
		if (this.template[this.cursor] !== "@") return false;

		const identifierMatch = this.template
			.slice(this.cursor)
			.match(/^@([a-zA-Z0-9_]+)/);
		if (!identifierMatch) return false;

		let [fullMatch, name] = identifierMatch;

		let isSubDirective = false;
		let subDef: DirectiveDefinition | undefined;
		let parentNode: Node | undefined;
		let validName = name;
		let foundDirective: DirectiveDefinition | undefined;

		if (this.stack.length > 0) {
			for (let i = this.stack.length - 1; i >= 0; i--) {
				const currentParent = this.stack[i];
				const parentDef = this.kire.getDirective(currentParent?.name as string);

				if (parentDef?.parents) {
					const candidates = parentDef.parents.filter((p) =>
						name!.startsWith(p.name),
					);
					candidates.sort((a, b) => b.name.length - a.name.length);

					if (candidates.length > 0) {
						validName = candidates[0]!.name;
						subDef = candidates[0];
						parentNode = currentParent;
						isSubDirective = true;

						while (this.stack.length > i + 1) {
							this.stack.pop();
						}
						break;
					}
				}
			}
		}

		if (!isSubDirective) {
			foundDirective = this.kire.getDirective(name!);
			if (!foundDirective) {
				const allDirectives = Array.from(this.kire.$directives.values()).sort(
					(a, b) => b.name.length - a.name.length,
				);
				for (const d of allDirectives) {
					if (name!.startsWith(d.name)) {
						validName = d.name;
						foundDirective = d;
						break;
					}
				}
			}
		}

		if (validName !== name) {
			name = validName;
			fullMatch = `@${name}`;
		} else if (!foundDirective && !isSubDirective && name === "end") {
			// keep "end"
		} else if (!isSubDirective && !foundDirective) {
			foundDirective = this.kire.getDirective(name!);
		}

		let argsStr: string | undefined;
		let argsEndIndex = fullMatch.length;

		if (this.template[this.cursor + fullMatch.length] === "(") {
			const result = this.extractArgs(fullMatch.length);
			if (result) {
				argsStr = result.argsStr;
				argsEndIndex = result.endIndex;
			}
		}

		if (name === "end" || name!.startsWith("end")) {
			const targetName = name === "end" ? undefined : name!.slice(3);
			this.handleEndDirective(targetName);
			this.advance(
				this.template.slice(this.cursor, this.cursor + argsEndIndex),
			);
			return true;
		}

		const directiveDef = foundDirective;

		if (isSubDirective && subDef && parentNode) {
			const fullContent = this.template.slice(
				this.cursor,
				this.cursor + argsEndIndex,
			);
			this.handleSubDirective(
				name!,
				argsStr,
				fullContent,
				parentNode,
				subDef,
				this.getLoc(fullContent),
			);
			this.advance(fullContent);
			return true;
		}

		if (!directiveDef && !isSubDirective) {
			this.addNode({
				type: "text",
				content: fullMatch,
				start: this.cursor,
				end: this.cursor + fullMatch.length,
				loc: this.getLoc(fullMatch),
			});
			this.advance(fullMatch);
			return true;
		}

		let args: any[] = [];
		if (argsStr) {
			// Check if we should use pattern parsing instead of splitting args
			const targetDef = isSubDirective ? subDef : directiveDef;
			if (
				targetDef?.params?.length === 1 &&
				isPatternDefinition(targetDef.params[0]!)
			) {
				args = [argsStr.trim()];
			} else {
				args = this.parseArgs(argsStr);
			}
		}

		const fullContent = this.template.slice(
			this.cursor,
			this.cursor + argsEndIndex,
		);

		const node: Node = {
			type: "directive",
			name: name,
			args: args,
			start: this.cursor,
			end: this.cursor + argsEndIndex,
			loc: this.getLoc(fullContent),
			children: [],
			related: [],
		};

		this.addNode(node);

		if (directiveDef?.children) {
			if (
				this.handleDirectiveChildren(
					directiveDef,
					node,
					argsEndIndex,
					fullContent,
				)
			) {
				return true;
			}
		}

		this.advance(fullContent);
		return true;
	}

	/**
	 * Extracts arguments from a directive string, handling nested parentheses and quotes.
	 * @param offset The starting offset of the arguments in the template relative to the current cursor.
	 * @returns An object containing the arguments string and the end index, or null if arguments are not balanced.
	 */
	private extractArgs(offset: number) {
		let depth = 1;
		let i = this.cursor + offset + 1;
		let inQuote = false;
		let quoteChar = "";
		const len = this.template.length;

		while (i < len && depth > 0) {
			const char = this.template[i];
			if (
				(char === '"' || char === "'") &&
				(i === 0 || this.template[i - 1] !== "\\")
			) {
				if (inQuote && char === quoteChar) {
					inQuote = false;
				} else if (!inQuote) {
					inQuote = true;
					quoteChar = char;
				}
			}
			if (!inQuote) {
				if (char === "(") depth++;
				else if (char === ")") depth--;
			}
			i++;
		}

		if (depth === 0) {
			return {
				argsStr: this.template.slice(this.cursor + offset + 1, i - 1),
				endIndex: i - this.cursor,
			};
		}
		return null;
	}

	/**
	 * Handles children of a directive, determining if they should be parsed recursively or treated as raw text.
	 * @param directiveDef The definition of the directive being processed.
	 * @param node The current directive AST node.
	 * @param argsEndIndex The end index of the directive's arguments.
	 * @param fullContent The full string content of the directive (e.g. "@if(true)").
	 * @returns True if raw children were processed and the cursor advanced, false otherwise.
	 */
	private handleDirectiveChildren(
		directiveDef: DirectiveDefinition,
		node: Node,
		argsEndIndex: number,
		fullContent: string,
	): boolean {
		let shouldHaveChildren = true;
		if (directiveDef.children === "auto") {
			let balance = 1;
			const lookaheadCursor = this.cursor + argsEndIndex;
			let foundEnd = false;

			const tagRegex = /@([a-zA-Z0-9_]+)/g;
			tagRegex.lastIndex = lookaheadCursor;

			let match: RegExpExecArray | null;
			while ((match = tagRegex.exec(this.template)) !== null) {
				const tagName = match[1];
				if (tagName === "end") {
					balance--;
					if (balance === 0) {
						foundEnd = true;
						break;
					}
				} else {
					const d = this.kire.getDirective(tagName!);
					if (d?.children) {
						balance++;
					}
				}
			}
			shouldHaveChildren = foundEnd;
		}

		if (shouldHaveChildren) {
			if (directiveDef.childrenRaw) {
				return this.handleRawChildren(node, argsEndIndex, fullContent);
			} else {
				this.stack.push(node);
			}
		}
		return false;
	}

	/**
	 * Handles raw content for directives that do not parse their children (e.g. valid 'childrenRaw' directives).
	 * Finds the matching @end tag and treats everything in between as text.
	 * @param node The current directive AST node.
	 * @param argsEndIndex The end index of the directive's arguments.
	 * @param fullContent The full string content of the directive.
	 * @returns True indicating the content was processed.
	 */
	private handleRawChildren(
		node: Node,
		argsEndIndex: number,
		fullContent: string,
	): boolean {
		this.stack.push(node);
		const contentStart = this.cursor + argsEndIndex;
		const endRegex = /@end(?![a-zA-Z0-9_])/g;
		endRegex.lastIndex = contentStart;
		const endMatch = endRegex.exec(this.template);

		if (endMatch) {
			const content = this.template.slice(contentStart, endMatch.index);
			const directiveLoc = this.getLoc(fullContent);
			const startLoc = directiveLoc.end;

			const contentLines = content.split("\n");
			let endLine = startLoc.line;
			let endCol = startLoc.column;
			if (contentLines.length > 1) {
				endLine += contentLines.length - 1;
				endCol = (contentLines[contentLines.length - 1]?.length || 0) + 1;
			} else {
				endCol += content.length;
			}

			this.addNode({
				type: "text",
				content: content,
				start: contentStart,
				end: contentStart + content.length,
				loc: {
					start: startLoc,
					end: { line: endLine, column: endCol },
				},
			});

			this.stack.pop();
			this.advance(
				this.template.slice(this.cursor, contentStart) + content + endMatch[0],
			);
			return true;
		} else {
			const content = this.template.slice(contentStart);
			this.addNode({
				type: "text",
				content: content,
				start: contentStart,
				end: this.template.length,
			});
			this.stack.pop();
			this.advance(this.template.slice(this.cursor));
			return true;
		}
	}

	/**
	 * Parses plain text content until the next interpolation or directive is found.
	 */
	private parseText() {
		const nextInterpolation = this.template.indexOf("{{", this.cursor);
		const nextDirective = this.template.indexOf("@", this.cursor);
		const nextJs = this.template.indexOf("<?js", this.cursor);
		const nextRaw = this.template.indexOf("{{{", this.cursor);

		// Find the closest marker
		const indices = [nextInterpolation, nextDirective, nextJs, nextRaw].filter(
			(i) => i !== -1,
		);
		let nextIndex = -1;

		if (indices.length > 0) {
			nextIndex = Math.min(...indices);
		}

		if (nextIndex === -1) {
			const text = this.template.slice(this.cursor);
			this.checkUsedElements(text);
			this.addNode({
				type: "text",
				content: text,
				start: this.cursor,
				end: this.template.length,
				loc: this.getLoc(text),
			});
			this.advance(text);
		} else {
			if (nextIndex === this.cursor) {
				const char = this.template[this.cursor];
				this.addNode({
					type: "text",
					content: char,
					start: this.cursor,
					end: this.cursor + 1,
					loc: this.getLoc(char!),
				});
				this.advance(char!);
			} else {
				const text = this.template.slice(this.cursor, nextIndex);
				this.checkUsedElements(text);
				this.addNode({
					type: "text",
					content: text,
					start: this.cursor,
					end: this.cursor + text.length,
					loc: this.getLoc(text),
					raw: false,
				});
				this.advance(text);
			}
		}
	}

	private checkUsedElements(text: string) {
		if (this.kire.$elements.size === 0) return;
		const tagRegex = /<([a-zA-Z0-9_\-:]+)/g;
		let match: RegExpExecArray | null;
		while ((match = tagRegex.exec(text)) !== null) {
			const tagName = match[1]!;
			for (const def of this.kire.$elements) {
				if (def.name instanceof RegExp) {
					if (def.name.test(tagName)) {
						this.usedElements.add(tagName);
						break;
					}
				} else {
					const prefix = def.parent ? `${def.name}${def.parent}` : def.name;
					if (tagName === prefix || (def.parent && tagName.startsWith(prefix))) {
						this.usedElements.add(tagName);
						break;
					}
				}
			}
		}
	}

	/**
	 * Handles the @end directive, closing the current block and potentially parent blocks (e.g. closing @if when @else ends).
	 * Supports named end directives like @endif.
	 */
	private handleEndDirective(name?: string) {
		if (this.stack.length > 0) {
			const current = this.stack[this.stack.length - 1];
			
			// If a name is provided (e.g. @endif), try to find that specific directive
			if (name) {
				let foundIndex = -1;
				for (let i = this.stack.length - 1; i >= 0; i--) {
					if (this.stack[i]?.name?.toLowerCase() === name.toLowerCase()) {
						foundIndex = i;
						break;
					}
				}
				
				if (foundIndex !== -1) {
					while (this.stack.length > foundIndex) {
						this.stack.pop();
					}
                    // Handle parent relations (like @else associated with @if)
                    if (this.stack.length > 0) {
                        const parent = this.stack[this.stack.length - 1];
                        if (parent?.related?.includes(current!)) {
                            this.stack.pop();
                        }
                    }
				}
				return;
			}

			// Standard @end logic
			const popped = this.stack.pop();
			if (this.stack.length > 0) {
				const parent = this.stack[this.stack.length - 1];
				if (parent?.related?.includes(popped!)) {
					this.stack.pop();
				}
			}
		}
	}

	/**
	 * Handles sub-directives like @else or @elseif, attaching them to their parent directive.
	 * @param name The name of the sub-directive.
	 * @param argsStr The arguments string.
	 * @param fullMatch The full match string of the directive start.
	 * @param parentNode The parent directive node (e.g. the @if node).
	 * @param subDef The definition of the sub-directive.
	 * @param loc The source location.
	 */
	private handleSubDirective(
		name: string,
		argsStr: string | undefined,
		fullMatch: string,
		parentNode: Node,
		subDef: DirectiveDefinition,
		loc: any,
	) {
		const args = argsStr ? this.parseArgs(argsStr) : [];
		const node: Node = {
			type: "directive",
			name: name,
			args: args,
			start: this.cursor,
			end: this.cursor + fullMatch.length,
			loc: loc,
			children: [],
			related: [],
		};

		if (this.stack.length > 0) {
			const currentTop = this.stack[this.stack.length - 1];
			if (parentNode.related?.includes(currentTop!)) {
				this.stack.pop();
			}
		}

		if (!parentNode.related) parentNode.related = [];
		parentNode.related.push(node);

		if (subDef.children) {
			this.stack.push(node);
		}
	}

	/**
	 * Calculates the end location (line, column) for a given text content starting from the current parser position.
	 * @param content The text content to measure.
	 * @returns An object with start and end location info.
	 */
	private getLoc(content: string) {
		const start = { line: this.line, column: this.column };
		const lines = content.split("\n");
		let endLine = this.line;
		let endColumn = this.column;

		if (lines.length > 1) {
			endLine += lines.length - 1;
			endColumn = (lines[lines.length - 1]?.length || 0) + 1;
		} else {
			endColumn += content.length;
		}

		return {
			start,
			end: { line: endLine, column: endColumn },
		};
	}

	/**
	 * Adds a node to the current stack tip or to the root children if the stack is empty.
	 * @param node The node to add.
	 */
	private addNode(node: Node) {
		if (this.stack.length > 0) {
			const current = this.stack[this.stack.length - 1];
			if (current && !current.children) current.children = [];
			if (current?.children) {
				current.children.push(node);
			}
		} else {
			this.rootChildren.push(node);
		}
	}

	/**
	 * Advances the cursor, line, and column numbers based on the consumed string.
	 * @param str The string content that has been processed.
	 */
	private advance(str: string) {
		const lines = str.split("\n");
		if (lines.length > 1) {
			this.line += lines.length - 1;
			this.column = (lines[lines.length - 1]?.length || 0) + 1;
		} else {
			this.column += str.length;
		}
		this.cursor += str.length;
	}

	/**
	 * Parses a string of arguments (e.g. "var1, 'string', 123") into an array of values.
	 * Handles quoted strings and nested parentheses/brackets.
	 * @param argsStr The raw arguments string.
	 * @returns An array of parsed arguments.
	 */
	private parseArgs(argsStr: string): any[] {
		const args: any[] = [];
		let current = "";
		let inQuote = false;
		let quoteChar = "";
		let braceDepth = 0;
		let bracketDepth = 0;
		let parenDepth = 0;

		for (let i = 0; i < argsStr.length; i++) {
			const char = argsStr[i];

			// Handle quotes
			if (
				(char === '"' || char === "'") &&
				(i === 0 || argsStr[i - 1] !== "\\")
			) {
				if (inQuote && char === quoteChar) {
					inQuote = false;
				} else if (!inQuote) {
					inQuote = true;
					quoteChar = char;
				}
			}

			if (!inQuote) {
				if (char === "{") braceDepth++;
				else if (char === "}") braceDepth--;
				else if (char === "[") bracketDepth++;
				else if (char === "]") bracketDepth--;
				else if (char === "(") parenDepth++;
				else if (char === ")") parenDepth--;
			}

			if (
				char === "," &&
				!inQuote &&
				braceDepth === 0 &&
				bracketDepth === 0 &&
				parenDepth === 0
			) {
				args.push(current.trim());
				current = "";
			} else {
				current += char;
			}
		}
		if (current) args.push(current.trim());

		return args.map((arg) => {
			if (
				(arg.startsWith('"') && arg.endsWith('"')) ||
				(arg.startsWith("'") && arg.endsWith("'"))
			) {
				return arg.slice(1, -1);
			}
			if (arg === "true") return true;
			if (arg === "false") return false;
			if (!Number.isNaN(Number(arg))) return Number(arg);
			return arg;
		});
	}
}
