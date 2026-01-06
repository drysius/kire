import type { Kire } from "./kire";
import type { DirectiveDefinition, Node } from "./types";

export class Parser {
	public cursor = 0;
	public stack: Node[] = [];
	public rootChildren: Node[] = [];
	public line = 1;
	public column = 1;

	constructor(
		public template: string,
		public kire: Kire,
	) {}

	public parse(): Node[] {
		this.cursor = 0;
		this.stack = [];
		this.rootChildren = [];
		const len = this.template.length;

		while (this.cursor < len) {
			// Check for raw interpolation {{{ ... }}}
			if (
				this.template.startsWith("{{{", this.cursor)
			) {
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
					continue;
				}
			}

			// Check for serverjs <?js ... ?>
			if (this.template.startsWith("<?js", this.cursor)) {
				const end = this.template.indexOf("?>", this.cursor + 4);
				if (end !== -1) {
					const content = this.template.slice(this.cursor, end + 2);
					const inner = this.template.slice(this.cursor + 4, end);
					this.addNode({
						type: "serverjs",
						content: inner.trim(),
						start: this.cursor,
						end: end + 2,
						loc: this.getLoc(content),
					});
					this.advance(content);
					continue;
				}
			}

			// Check for interpolation {{ ... }}
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
					continue;
				}
			}

			// Check for escaped directive @@
			if (this.template.startsWith("@@", this.cursor)) {
				this.addNode({
					type: "text",
					content: "@",
					start: this.cursor,
					end: this.cursor + 2,
					loc: this.getLoc("@@"),
				});
				this.advance("@@");
				continue;
			}

			// Check for directive @name(...) or @name
			if (this.template[this.cursor] === "@") {
				// Use a sticky regex or slice just a small chunk to check the name
				// Optimization: Slice enough to likely cover a directive name, or match properly
				// Since we can't easily use sticky regex across environments reliably without 'y' flag support check,
				// we will slice a small chunk, but much better than slicing the whole rest of file.
				// However, match is usually fast enough if anchored. Let's try to grab the identifier.
				
				const identifierMatch = this.template.slice(this.cursor).match(/^@([a-zA-Z0-9_]+)/);
				
				if (identifierMatch) {
					let [fullMatch, name] = identifierMatch;
					
					// 1. First, check if this is a sub-directive of any active parent in the stack.
					// This takes precedence over global directives and prefix matching in global scope.
					// We iterate backwards to find the nearest parent that accepts this as a sub-directive.
					let isSubDirective = false;
					let subDef: DirectiveDefinition | undefined;
					let parentNode: Node | undefined;
					let validName = name;
					let foundDirective: DirectiveDefinition | undefined;

					if (this.stack.length > 0) {
						for (let i = this.stack.length - 1; i >= 0; i--) {
							const currentParent = this.stack[i];
							const parentDef = this.kire.getDirective(
								currentParent?.name as string,
							);

							if (parentDef?.parents) {
								const candidates = parentDef.parents.filter((p) =>
									name!.startsWith(p.name),
								);
								candidates.sort((a, b) => b.name.length - a.name.length);

								if (candidates.length > 0) {
									const p = candidates[0];
									validName = p!.name;
									subDef = p;
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

					// 2. If not a sub-directive, check global directives with prefix matching
					if (!isSubDirective) {
						foundDirective = this.kire.getDirective(name!);

						if (!foundDirective) {
							const allDirectives = Array.from(
								this.kire.$directives.values(),
							).sort((a, b) => b.name.length - a.name.length);
							for (const d of allDirectives) {
								if (name!.startsWith(d.name)) {
									validName = d.name;
									foundDirective = d;
									break;
								}
							}
						}
					}

					// Update fullMatch if we matched a shorter name (prefix)
					if (validName !== name) {
						name = validName;
						fullMatch = `@${name}`;
					} else if (!foundDirective && !isSubDirective && name === "end") {
						// Keep "end"
					} else if (!isSubDirective && !foundDirective) {
						// Try exact fetch again just in case
						foundDirective = this.kire.getDirective(name!);
					}

					// Check if it has arguments
					let argsStr: string | undefined;
					let argsEndIndex = fullMatch.length;

					// Verifica se tem parênteses APENAS se o próximo caractere for '('
					if (this.template[this.cursor + fullMatch.length] === "(") {
						// Parse arguments with balanced parentheses
						let depth = 1;
						let i = this.cursor + fullMatch.length + 1;
						let inQuote = false;
						let quoteChar = "";

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
							argsStr = this.template.slice(this.cursor + fullMatch.length + 1, i - 1);
							argsEndIndex = i - this.cursor;
						}
					}

					if (name === "end") {
						this.handleEndDirective();
						this.advance(this.template.slice(this.cursor, this.cursor + argsEndIndex));
						continue;
					}

					// directiveDef is already found as foundDirective
					const directiveDef = foundDirective;

					if (isSubDirective && subDef && parentNode) {
						const fullContent = this.template.slice(this.cursor, this.cursor + argsEndIndex);
						this.handleSubDirective(
							name!,
							argsStr,
							fullContent,
							parentNode,
							subDef,
							this.getLoc(fullContent),
						);
						this.advance(fullContent);
						continue;
					}

					// If not a registered directive and not a sub-directive, treat as text
					if (!directiveDef && !isSubDirective) {
						this.addNode({
							type: "text",
							content: fullMatch,
							start: this.cursor,
							end: this.cursor + fullMatch.length,
							loc: this.getLoc(fullMatch),
						});
						this.advance(fullMatch);
						continue;
					}

					const args = argsStr ? this.parseArgs(argsStr) : [];
					const fullContent = this.template.slice(this.cursor, this.cursor + argsEndIndex);

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
						let shouldHaveChildren = true;
						if (directiveDef.children === "auto") {
							let balance = 1;
							const lookaheadCursor = this.cursor + argsEndIndex;
							let foundEnd = false;

							// Optimized lookahead without slicing massive chunks
							const tagRegex = /@([a-zA-Z0-9_]+)/g;
							// Set lastIndex to start searching from lookaheadCursor
							// Note: We need to search on the WHOLE template but ignore stuff before lookahead
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
								this.stack.push(node);

								const contentStart = this.cursor + argsEndIndex;
								// Find closing @end
								const endRegex = /@end(?![a-zA-Z0-9_])/g;
								endRegex.lastIndex = contentStart;
								const endMatch = endRegex.exec(this.template);

								if (endMatch) {
									const content = this.template.slice(contentStart, endMatch.index);
									const directiveLoc = this.getLoc(fullContent);
									const startLoc = directiveLoc.end;
									
									// Recalculate end loc manually to avoid slow lookups
									// Or just use getLoc on the content string (easiest for now)
									// Ideally we would increment from startLoc
									
									// We can reuse getLoc logic but we need to supply the text
									// Using a temporary simpler loc calculation
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

									this.stack.pop(); // Close immediately
									this.advance(
										this.template.slice(this.cursor, contentStart) + content + endMatch[0],
									);
									continue;
								} else {
									// No end tag found, consume rest
									const content = this.template.slice(contentStart);

									this.addNode({
										type: "text",
										content: content,
										start: contentStart,
										end: this.template.length,
									});
									this.stack.pop();
									this.advance(this.template.slice(this.cursor));
									continue;
								}
							}
							this.stack.push(node);
						}
					}

					this.advance(fullContent);
					continue;
				}
			}

			// Text
			const nextInterpolation = this.template.indexOf("{{", this.cursor);
			const nextDirective = this.template.indexOf("@", this.cursor);

			let nextIndex = -1;
			if (nextInterpolation !== -1 && nextDirective !== -1) {
				nextIndex = Math.min(nextInterpolation, nextDirective);
			} else if (nextInterpolation !== -1) {
				nextIndex = nextInterpolation;
			} else if (nextDirective !== -1) {
				nextIndex = nextDirective;
			}

			if (nextIndex === -1) {
				const text = this.template.slice(this.cursor);
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
					// Should have been handled above, but if we are here it means
					// it looked like a directive/interp but wasn't (e.g. "@ " or "{ ")
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
					this.addNode({
						type: "text",
						content: text,
						start: this.cursor,
						end: this.cursor + text.length,
						loc: this.getLoc(text),
					});
					this.advance(text);
				}
			}
		}

		return this.rootChildren;
	}

	private handleEndDirective() {
		//console.log('HANDLE END - Stack before:', this.stack.map(s => s.name));
		if (this.stack.length > 0) {
			const popped = this.stack.pop();

			// Check if the popped node was a sub-directive (related) of the current parent
			// If so, it means we closed the sub-directive (like @else), and thus we should close the parent (@if) too.
			// This is the default behavior for related directives (chains).
			if (this.stack.length > 0) {
				const parent = this.stack[this.stack.length - 1];
				if (parent?.related?.includes(popped!)) {
					this.stack.pop(); // Close parent
				}
			}
		}
		//console.log('HANDLE END - Popped:', popped?.name);
		//console.log('HANDLE END - Stack after:', this.stack.map(s => s.name));
	}

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

		// If the current top of stack is already a related node of the parent (e.g. we are in @elseif and found @else),
		// we need to close the current sibling (@elseif) before opening the new one (@else).
		// Use the parentNode passed in, which was found by searching the stack.
		if (this.stack.length > 0) {
			const currentTop = this.stack[this.stack.length - 1];
			// Check if currentTop is a sibling (i.e. it is in parentNode.related)
			if (parentNode.related?.includes(currentTop!)) {
				this.stack.pop();
			}
		}

		//console.log('HANDLING SUB DIRECTIVE:', {
		//  name,
		//  parent: parentNode.name,
		//  node,
		//  parentRelated: parentNode.related
		//});

		if (!parentNode.related) parentNode.related = [];
		parentNode.related.push(node);

		if (subDef.children) {
			//console.log('PUSHING SUB DIRECTIVE TO STACK:', name);
			this.stack.push(node);
		}
	}

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

	private addNode(node: Node) {
		if (this.stack.length > 0) {
			const current = this.stack[this.stack.length - 1];
			if (current && !current.children) current.children = [];
			if (current?.children) {
				//console.log('ADDING TO CHILDREN of', current.name, ':', node.type, node.name || node.content);
				current.children.push(node);
			}
		} else {
			//console.log('ADDING TO ROOT:', node.type, node.name || node.content);
			this.rootChildren.push(node);
		}
	}

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
