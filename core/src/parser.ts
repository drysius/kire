import type { Kire } from "./kire";
import type { Node } from "./types";
import { 
    DIRECTIVE_NAME_REGEX, 
    NullProtoObj,
    TAG_OPEN_REGEX,
    TAG_CLOSE_REGEX,
    ATTR_NAME_BREAK_REGEX,
    WHITESPACE_REGEX,
    TEXT_SCAN_REGEX
} from "./utils/regex";

export class Parser {
    private cursor = 0;
    private line = 1;
    private column = 1;
    private stack: Node[] = [];
    private root: Node[] = [];

    constructor(
        private template: string,
        private kire: Kire
    ) {}

    public parse(): Node[] {
        this.cursor = 0; this.line = 1; this.column = 1; this.stack = []; this.root = [];
        const len = this.template.length;
        while (this.cursor < len) {
            const char = this.template[this.cursor];
            if (char === "{" && this.template[this.cursor + 1] === "{") {
                if (this.checkComment()) continue;
                if (this.checkInterpolation()) continue;
            } 
            if (char === "@") {
                if (this.checkEscapedInterpolation()) continue;
                if (this.checkEscaped("@")) continue;
                if (this.checkDirective()) continue;
            }
            if (char === "<") {
                if (this.checkJavascript()) continue;
                if (this.checkElement()) continue;
                if (this.checkClosingTag()) continue;
            }
            this.parseText();
        }
        return this.root;
    }

    private advance(n: number) {
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

    private getLoc() {
        return { line: this.line, column: this.column };
    }

    private addNode(node: Node) {
        const parent = this.stack[this.stack.length - 1];
        if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(node);
        } else {
            this.root.push(node);
        }
    }

    private checkEscapedInterpolation(): boolean {
        if (this.template.startsWith("@{{{", this.cursor)) { this.addNode({ type: "text", content: "{{{", loc: this.getLoc() }); this.advance(4); return true; }
        if (this.template.startsWith("@{{", this.cursor)) { this.addNode({ type: "text", content: "{{", loc: this.getLoc() }); this.advance(3); return true; }
        return false;
    }

    private checkComment(): boolean {
        if (this.template.startsWith("{{--", this.cursor)) {
            const end = this.template.indexOf("--}}", this.cursor + 4);
            if (end !== -1) { this.advance(end + 4 - this.cursor); return true; }
        }
        return false;
    }

    private checkInterpolation(): boolean {
        const loc = this.getLoc();
        const isRaw = this.template.startsWith("{{{", this.cursor);
        const open = isRaw ? "{{{" : "{{";
        const close = isRaw ? "}}}" : "}}";
        const end = this.template.indexOf(close, this.cursor + open.length);
        if (end !== -1) {
            const content = this.template.slice(this.cursor + open.length, end).trim();
            this.addNode({ type: "interpolation", content, raw: isRaw, loc });
            this.advance(end + close.length - this.cursor); return true;
        }
        return false;
    }

    private checkDirective(): boolean {
        const loc = this.getLoc();
        const slice = this.template.slice(this.cursor);
        const match = slice.match(DIRECTIVE_NAME_REGEX);
        if (!match) return false;

        let name = match[1]!;
        const isEnd = name.startsWith("end");
        const baseName = isEnd ? (name === "end" ? null : name.slice(3)) : name;
        
        // console.log("CHECK DIRECTIVE", name, "IS_END:", isEnd, "MATCHES:", new RegExp(`^(?:${this.kire.$directivesPattern.source})$`).test(isEnd && baseName ? baseName : name));

        if (!isEnd) {
            if (!new RegExp(`^(?:${this.kire.$directivesPattern.source})$`).test(name)) {
                const registered = Array.from(this.kire.$directives.keys());
                let found = false;
                for (let i = name.length - 1; i > 0; i--) {
                    const sub = name.slice(0, i);
                    if (registered.includes(sub)) { name = sub; found = true; break; }
                }
                if (!found) return false;
            }
        } else {
            // For end directives, we check if the baseName is registered OR it's a generic @end
            if (baseName && !new RegExp(`^(?:${this.kire.$directivesPattern.source})$`).test(baseName)) {
                 // Might be a custom end directive not in pattern, but usually end + name
            }
        }

        if (isEnd) {
            this.popStack(baseName);
            this.advance(name.length + 1); return true;
        }

        this.advance(name.length + 1);
        let args: any[] = [];
        if (this.template[this.cursor] === "(") {
            const res = this.extractBracketedContent("(", ")");
            if (res) { args = this.parseArgs(res.content); this.advance(res.fullLength); }
        }

        const node: Node = { type: "directive", name, args, children: [], loc };
        
        const current = this.stack[this.stack.length - 1];
        if (current && (name === "else" || name === "elseif" || name === "empty")) {
            if (!current.related) current.related = [];
            current.related.push(node);
            this.stack.pop(); 
            this.stack.push(node); 
            return true;
        }

        this.addNode(node);
        const def = this.kire.getDirective(name);
        if (!def || def.children !== false) this.stack.push(node);
        return true;
    }

    private checkElement(): boolean {
        const loc = this.getLoc();
        const slice = this.template.slice(this.cursor);
        const match = slice.match(TAG_OPEN_REGEX);
        if (!match) return false;
        
        const tagName = match[1]!;
        if (!this.kire.$elementsPattern.test(tagName)) return false;

        this.advance(match[0]!.length);
        const attributes = this.parseAttributesState();
        let selfClosing = false;
        while (this.cursor < this.template.length && WHITESPACE_REGEX.test(this.template[this.cursor]!)) this.advance(1);
        if (this.template[this.cursor] === "/") { selfClosing = true; this.advance(1); }
        if (this.template[this.cursor] === ">") this.advance(1);

        const node: Node = { type: "element", name: tagName, tagName, attributes, void: selfClosing, children: [], loc };
        
        if (!selfClosing && (tagName === "style" || tagName === "script")) {
            const closeTag = `</${tagName}>`;
            const endIdx = this.template.indexOf(closeTag, this.cursor);
            if (endIdx !== -1) {
                const content = this.template.slice(this.cursor, endIdx);
                
                // Recursively parse content to support interpolation
                const innerParser = new Parser(content, this.kire);
                // Adjust inner parser's line/column to match current position
                (innerParser as any).line = this.line;
                (innerParser as any).column = this.column;
                node.children = innerParser.parse();
                
                this.addNode(node);
                this.advance(content.length + closeTag.length);
                return true;
            }
        }

        const current = this.stack[this.stack.length - 1];
        const siblings = current ? (current.children || []) : this.root;
        let lastIdx = siblings.length - 1;
        while (lastIdx >= 0 && siblings[lastIdx].type === "text" && !siblings[lastIdx].content?.trim()) {
            lastIdx--;
        }
        const lastSibling = siblings[lastIdx];
        const isRelated = tagName.endsWith(":else") || tagName.endsWith(":elseif") || tagName.endsWith(":empty");

        if (lastSibling && isRelated && (lastSibling.tagName === tagName.split(":")[0] || (lastSibling.tagName && (tagName.startsWith(lastSibling.tagName) || lastSibling.tagName.startsWith(tagName.split(":")[0]))))) {
             if (!lastSibling.related) lastSibling.related = [];
             lastSibling.related.push(node);
             if (!node.void) this.stack.push(node); 
             return true;
        }

        this.addNode(node);
        if (!node.void) this.stack.push(node);
        return true;
    }

    private parseAttributesState(): Record<string, string> {
        const attrs: Record<string, string> = new NullProtoObj();
        while (this.cursor < this.template.length) {
            while (this.cursor < this.template.length && WHITESPACE_REGEX.test(this.template[this.cursor]!)) this.advance(1);
            const char = this.template[this.cursor];
            if (char === ">" || char === "/" || !char) break;
            let name = "";
            while (this.cursor < this.template.length && !ATTR_NAME_BREAK_REGEX.test(this.template[this.cursor]!)) {
                name += this.template[this.cursor]; this.advance(1);
            }
            if (!name) break;
            let value = "true";
            if (this.template[this.cursor] === "(") {
                const res = this.extractBracketedContent("(", ")");
                if (res) { value = res.content; this.advance(res.fullLength); }
            } else if (this.template[this.cursor] === "=") {
                this.advance(1); const first = this.template[this.cursor];
                if (first === '"' || first === "'") {
                    this.advance(1); value = "";
                    while (this.cursor < this.template.length && this.template[this.cursor] !== first) {
                        value += this.template[this.cursor]; this.advance(1);
                    }
                    this.advance(1);
                } else { value = this.captureBalancedValue(); }
            }
            attrs[name] = value;
        }
        return attrs;
    }

    private captureBalancedValue(): string {
        let val = ""; let dPar = 0; let dBra = 0; let dCur = 0; let inQ: string | null = null;
        while (this.cursor < this.template.length) {
            const c = this.template[this.cursor]!;
            if (inQ) { if (c === inQ) inQ = null; }
            else {
                if (c === '"' || c === "'") inQ = c;
                else if (c === "(") dPar++; else if (c === ")") dPar--;
                else if (c === "[") dBra++; else if (c === "]") dBra--;
                else if (c === "{") dCur++; else if (c === "}") dCur--;
            }
            if (!inQ && dPar === 0 && dBra === 0 && dCur === 0 && (WHITESPACE_REGEX.test(c) || c === ">" || c === "/")) break;
            val += c; this.advance(1);
        }
        return val;
    }

    private checkClosingTag(): boolean {
        const match = this.template.slice(this.cursor).match(TAG_CLOSE_REGEX);
        if (!match) return false;
        
        const tagName = match[1]!;
        if (!this.kire.$elementsPattern.test(tagName)) return false;

        this.popStack(tagName);
        this.advance(match[0]!.length); return true;
    }

    private checkJavascript(): boolean {
        const loc = this.getLoc();
        if (this.template.startsWith("<?js", this.cursor)) {
            const end = this.template.indexOf("?>", this.cursor + 4);
            if (end !== -1) {
                this.addNode({ type: "js", content: this.template.slice(this.cursor + 4, end), loc });
                this.advance(end + 2 - this.cursor); return true;
            }
        }
        return false;
    }

    private checkEscaped(char: string): boolean {
        const loc = this.getLoc();
        if (this.template.startsWith("@" + char, this.cursor)) {
            this.addNode({ type: "text", content: char, loc }); this.advance(2); return true;
        }
        return false;
    }

    private parseText() {
        const loc = this.getLoc();
        TEXT_SCAN_REGEX.lastIndex = this.cursor;
        const match = TEXT_SCAN_REGEX.exec(this.template);
        const end = match ? match.index : this.template.length;
        
        if (end > this.cursor) {
            this.addNode({ type: "text", content: this.template.slice(this.cursor, end), loc });
            this.advance(end - this.cursor);
        } else {
            this.addNode({ type: "text", content: this.template[this.cursor]!, loc });
            this.advance(1);
        }
    }

    private popStack(name: string | null) {
        if (this.stack.length === 0) return;
        if (!name) { this.stack.pop(); return; }
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const n = this.stack[i]!;
            if (n.name === name || n.tagName === name || (name.startsWith("end") && (n.name === name.slice(3) || n.name === name))) {
                this.stack.splice(i); break;
            }
        }
    }

    private extractBracketedContent(open: string, close: string) {
        let depth = 0; let content = "";
        for (let i = 0; i < this.template.length - this.cursor; i++) {
            const char = this.template[this.cursor + i];
            if (char === open) depth++; else if (char === close) depth--;
            content += char;
            if (depth === 0) return { content: content.slice(1, -1), fullLength: i + 1 };
        }
        return null;
    }

    private parseArgs(argsStr: string): any[] {
        const args: string[] = [];
        let current = "";
        let dPar = 0;
        let dBra = 0;
        let dCur = 0;
        let inQ: string | null = null;

        for (let i = 0; i < argsStr.length; i++) {
            const c = argsStr[i]!;
            if (inQ) {
                if (c === inQ && argsStr[i - 1] !== "\\") inQ = null;
            } else {
                if (c === '"' || c === "'") inQ = c;
                else if (c === "(") dPar++;
                else if (c === ")") dPar--;
                else if (c === "[") dBra++;
                else if (c === "]") dBra--;
                else if (c === "{") dCur++;
                else if (c === "}") dCur--;
                else if (c === "," && dPar === 0 && dBra === 0 && dCur === 0) {
                    args.push(current.trim());
                    current = "";
                    continue;
                }
            }
            current += c;
        }
        if (current.trim() || args.length > 0) args.push(current.trim());
        return args;
    }
}
