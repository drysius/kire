/**
 * Cursor — tracks position in a template string with line/column info.
 * All lexer subclasses extend this to share advance() and location tracking.
 */
export class Cursor {
	cursor = 0;
	line = 1;
	column = 1;

	/**
	 * Position of this template inside its parent source (for nested lexers):
	 * absolute character offset and the line/column where it starts.
	 */
	constructor(
		protected template: string,
		protected baseOffset = 0,
		protected baseLine = 1,
		protected baseColumn = 1,
	) {
		this.line = baseLine;
		this.column = baseColumn;
	}

	get pos(): number {
		return this.cursor;
	}

	get done(): boolean {
		return this.cursor >= this.template.length;
	}

	get len(): number {
		return this.template.length;
	}

	char(offset = 0): string {
		return this.template[this.cursor + offset] ?? "";
	}

	rawAt(index: number): string {
		return this.template[index] ?? "";
	}

	startsWith(str: string, from = this.cursor): boolean {
		return this.template.startsWith(str, from);
	}

	slice(from: number, to?: number): string {
		return this.template.slice(from, to);
	}

	advance(n: number): void {
		for (let i = 0; i < n; i++) {
			if (this.template[this.cursor + i] === "\n") {
				this.line++;
				this.column = 1;
			} else {
				this.column++;
			}
		}
		this.cursor += n;
	}

	getLoc(): { line: number; column: number; offset: number } {
		return {
			line: this.line,
			column: this.column,
			offset: this.baseOffset + this.cursor,
		};
	}

	reset(): void {
		this.cursor = 0;
		this.line = this.baseLine;
		this.column = this.baseColumn;
	}
}
