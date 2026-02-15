import type { Kire } from "./kire";
import type { Node } from "./types";
import { 
    DIRECTIVE_NAME_REGEX, 
    NullProtoObj,
    TAG_OPEN_REGEX,
    TAG_CLOSE_REGEX,
    ATTR_NAME_BREAK_REGEX,
    WHITESPACE_REGEX
} from "./utils/regex";

export class Parser {
    private cursor = 0;
    private stack: Node[] = [];
    private root: Node[] = [];
    public usedElements: Set<string> = new Set();

    constructor(
        private template: string,
        private kire: Kire
    ) {}

    public parse(): Node[] {
        this.cursor = 0; this.stack = []; this.root = [];
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
        if (this.template.startsWith("@{{{", this.cursor)) { this.addNode({ type: "text", content: "{{{" }); this.cursor += 4; return true; }
        if (this.template.startsWith("@{{", this.cursor)) { this.addNode({ type: "text", content: "{{" }); this.cursor += 3; return true; }
        return false;
    }

    private checkComment(): boolean {
        if (this.template.startsWith("{{--", this.cursor)) {
            const end = this.template.indexOf("--}}", this.cursor + 4);
            if (end !== -1) { this.cursor = end + 4; return true; }
        }
        return false;
    }

    private checkInterpolation(): boolean {
        const isRaw = this.template.startsWith("{{{", this.cursor);
        const open = isRaw ? "{{{" : "{{";
        const close = isRaw ? "}}}" : "}}";
        const end = this.template.indexOf(close, this.cursor + open.length);
        if (end !== -1) {
            const content = this.template.slice(this.cursor + open.length, end).trim();
            this.addNode({ type: "interpolation", content, raw: isRaw });
            this.cursor = end + close.length; return true;
        }
        return false;
    }

    private checkDirective(): boolean {
        const slice = this.template.slice(this.cursor);
        const match = slice.match(DIRECTIVE_NAME_REGEX);
        if (!match) return false;

        let name = match[1]!;
        const registered = Array.from(this.kire.$directives.keys());
        if (!registered.includes(name) && !name.startsWith("end")) {
            for (let i = name.length - 1; i > 0; i--) {
                const sub = name.slice(0, i);
                if (registered.includes(sub)) { name = sub; break; }
            }
        }

        if (name.startsWith("end")) {
            this.popStack(name === "end" ? null : name.slice(3));
            this.cursor += name.length + 1; return true;
        }

        this.cursor += name.length + 1;
        let args: any[] = [];
        if (this.template[this.cursor] === "(") {
            const res = this.extractBracketedContent("(", ")");
            if (res) { args = this.parseArgs(res.content); this.cursor += res.fullLength; }
        }

        const node: Node = { type: "directive", name, args, children: [] };
        
        const current = this.stack[this.stack.length - 1];
        if (current && (name === "else" || name === "elseif" || name === "empty")) {
            if (!current.related) current.related = [];
            current.related.push(node);
            this.stack.pop(); this.stack.push(node); return true;
        }

        this.addNode(node);
        const def = this.kire.getDirective(name);
        if (!def || def.children !== false) this.stack.push(node);
        return true;
    }

    private checkElement(): boolean {
        const slice = this.template.slice(this.cursor);
        const match = slice.match(TAG_OPEN_REGEX);
        if (!match) return false;
        const tagName = match[1]!;
        this.cursor += match[0]!.length;
        const attributes = this.parseAttributesState();
        let selfClosing = false;
        while (this.cursor < this.template.length && WHITESPACE_REGEX.test(this.template[this.cursor]!)) this.cursor++;
        if (this.template[this.cursor] === "/") { selfClosing = true; this.cursor++; }
        if (this.template[this.cursor] === ">") this.cursor++;

        const node: Node = { type: "element", name: tagName, tagName, attributes, void: selfClosing, children: [] };
        
        const current = this.stack[this.stack.length - 1];
        if (current && (tagName.endsWith(":else") || tagName.endsWith(":elseif") || tagName.endsWith(":empty") || tagName === "else" || tagName === "elseif" || tagName === "empty")) {
             if (!current.related) current.related = [];
             current.related.push(node);
             this.stack.pop(); if (!node.void) this.stack.push(node); return true;
        }

        this.addNode(node);
        if (!node.void) this.stack.push(node);
        return true;
    }

    private parseAttributesState(): Record<string, string> {
        const attrs: Record<string, string> = new NullProtoObj();
        while (this.cursor < this.template.length) {
            while (this.cursor < this.template.length && WHITESPACE_REGEX.test(this.template[this.cursor]!)) this.cursor++;
            const char = this.template[this.cursor];
            if (char === ">" || char === "/" || !char) break;
            let name = "";
            while (this.cursor < this.template.length && !ATTR_NAME_BREAK_REGEX.test(this.template[this.cursor]!)) {
                name += this.template[this.cursor]; this.cursor++;
            }
            if (!name) break;
            let value = "true";
            if (this.template[this.cursor] === "(") {
                const res = this.extractBracketedContent("(", ")");
                if (res) { value = res.content; this.cursor += res.fullLength; }
            } else if (this.template[this.cursor] === "=") {
                this.cursor++; const first = this.template[this.cursor];
                if (first === '"' || first === "'") {
                    this.cursor++; value = "";
                    while (this.cursor < this.template.length && this.template[this.cursor] !== first) {
                        value += this.template[this.cursor]; this.cursor++;
                    }
                    this.cursor++;
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
            val += c; this.cursor++;
        }
        return val;
    }

    private checkClosingTag(): boolean {
        const match = this.template.slice(this.cursor).match(TAG_CLOSE_REGEX);
        if (!match) return false;
        this.popStack(match[1]!);
        this.cursor += match[0]!.length; return true;
    }

    private checkJavascript(): boolean {
        if (this.template.startsWith("<?js", this.cursor)) {
            const end = this.template.indexOf("?>", this.cursor + 4);
            if (end !== -1) {
                this.addNode({ type: "js", content: this.template.slice(this.cursor + 4, end) });
                this.cursor = end + 2; return true;
            }
        }
        return false;
    }

    private checkEscaped(char: string): boolean {
        if (this.template.startsWith("@" + char, this.cursor)) {
            this.addNode({ type: "text", content: char }); this.cursor += 2; return true;
        }
        return false;
    }

    private parseText() {
        let next = this.template.indexOf("{", this.cursor);
        const nextAt = this.template.indexOf("@", this.cursor);
        const nextTag = this.template.indexOf("<", this.cursor);
        const stops = [next, nextAt, nextTag].filter(idx => idx !== -1);
        const end = stops.length > 0 ? Math.min(...stops) : this.template.length;
        if (end > this.cursor) {
            this.addNode({ type: "text", content: this.template.slice(this.cursor, end) });
            this.cursor = end;
        } else {
            this.addNode({ type: "text", content: this.template[this.cursor] });
            this.cursor++;
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
        return argsStr.split(",").map(a => a.trim());
    }
}
