import { Kirewire } from "../kirewire";

type Token =
    | { type: "number"; value: number }
    | { type: "string"; value: string }
    | { type: "boolean"; value: boolean }
    | { type: "null"; value: null }
    | { type: "undefined"; value: undefined }
    | { type: "identifier"; value: string }
    | { type: "op"; value: string }
    | { type: "paren"; value: "(" | ")" };

type AstNode =
    | { type: "literal"; value: any }
    | { type: "path"; base: string; segments: string[] }
    | { type: "unary"; op: string; value: AstNode }
    | { type: "binary"; op: string; left: AstNode; right: AstNode };

const IDENTIFIER_START_REGEX = /[A-Za-z_$]/;
const IDENTIFIER_CHAR_REGEX = /[A-Za-z0-9_$]/;
const NUMBER_REGEX = /^[0-9]+(?:\.[0-9]+)?/;

function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    const readIdentifier = () => {
        let value = "";
        while (i < source.length && IDENTIFIER_CHAR_REGEX.test(source[i]!)) {
            value += source[i]!;
            i++;
        }
        return value;
    };

    const readString = (quote: string) => {
        i++; // skip opening quote
        let value = "";
        while (i < source.length) {
            const char = source[i]!;
            if (char === "\\") {
                const next = source[i + 1];
                if (next !== undefined) {
                    value += next;
                    i += 2;
                    continue;
                }
            }
            if (char === quote) {
                i++;
                return value;
            }
            value += char;
            i++;
        }
        throw new Error("Unterminated string literal in wire:show expression.");
    };

    while (i < source.length) {
        const char = source[i]!;

        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (char === "(" || char === ")") {
            tokens.push({ type: "paren", value: char });
            i++;
            continue;
        }

        if (char === "'" || char === "\"") {
            tokens.push({ type: "string", value: readString(char) });
            continue;
        }

        const op3 = source.slice(i, i + 3);
        if (op3 === "===" || op3 === "!==") {
            tokens.push({ type: "op", value: op3 });
            i += 3;
            continue;
        }

        const op2 = source.slice(i, i + 2);
        if (
            op2 === "&&" ||
            op2 === "||" ||
            op2 === "??" ||
            op2 === "==" ||
            op2 === "!=" ||
            op2 === ">=" ||
            op2 === "<=" ||
            op2 === "?."
        ) {
            tokens.push({ type: "op", value: op2 });
            i += 2;
            continue;
        }

        if (
            char === "!" ||
            char === ">" ||
            char === "<" ||
            char === "+" ||
            char === "-" ||
            char === "*" ||
            char === "/" ||
            char === "%" ||
            char === "."
        ) {
            tokens.push({ type: "op", value: char });
            i++;
            continue;
        }

        const numberMatch = source.slice(i).match(NUMBER_REGEX);
        if (numberMatch?.[0]) {
            tokens.push({ type: "number", value: Number(numberMatch[0]) });
            i += numberMatch[0].length;
            continue;
        }

        if (IDENTIFIER_START_REGEX.test(char)) {
            const id = readIdentifier();
            if (id === "true") {
                tokens.push({ type: "boolean", value: true });
                continue;
            }
            if (id === "false") {
                tokens.push({ type: "boolean", value: false });
                continue;
            }
            if (id === "null") {
                tokens.push({ type: "null", value: null });
                continue;
            }
            if (id === "undefined") {
                tokens.push({ type: "undefined", value: undefined });
                continue;
            }
            tokens.push({ type: "identifier", value: id });
            continue;
        }

        throw new Error(`Unsupported token "${char}" in wire:show expression.`);
    }

    return tokens;
}

class Parser {
    private index = 0;

    constructor(private tokens: Token[]) {}

    public parse(): AstNode {
        const result = this.parseNullish();
        if (!this.isAtEnd()) {
            throw new Error("Unexpected token in wire:show expression.");
        }
        return result;
    }

    private parseNullish(): AstNode {
        let node = this.parseLogicalOr();
        while (this.matchOp("??")) {
            node = { type: "binary", op: "??", left: node, right: this.parseLogicalOr() };
        }
        return node;
    }

    private parseLogicalOr(): AstNode {
        let node = this.parseLogicalAnd();
        while (this.matchOp("||")) {
            node = { type: "binary", op: "||", left: node, right: this.parseLogicalAnd() };
        }
        return node;
    }

    private parseLogicalAnd(): AstNode {
        let node = this.parseEquality();
        while (this.matchOp("&&")) {
            node = { type: "binary", op: "&&", left: node, right: this.parseEquality() };
        }
        return node;
    }

    private parseEquality(): AstNode {
        let node = this.parseRelational();
        while (this.matchOp("==", "!=", "===", "!==")) {
            const op = this.previousOp()!;
            node = { type: "binary", op, left: node, right: this.parseRelational() };
        }
        return node;
    }

    private parseRelational(): AstNode {
        let node = this.parseAdditive();
        while (this.matchOp(">", "<", ">=", "<=")) {
            const op = this.previousOp()!;
            node = { type: "binary", op, left: node, right: this.parseAdditive() };
        }
        return node;
    }

    private parseAdditive(): AstNode {
        let node = this.parseMultiplicative();
        while (this.matchOp("+", "-")) {
            const op = this.previousOp()!;
            node = { type: "binary", op, left: node, right: this.parseMultiplicative() };
        }
        return node;
    }

    private parseMultiplicative(): AstNode {
        let node = this.parseUnary();
        while (this.matchOp("*", "/", "%")) {
            const op = this.previousOp()!;
            node = { type: "binary", op, left: node, right: this.parseUnary() };
        }
        return node;
    }

    private parseUnary(): AstNode {
        if (this.matchOp("!", "+", "-")) {
            return {
                type: "unary",
                op: this.previousOp()!,
                value: this.parseUnary(),
            };
        }
        return this.parsePrimary();
    }

    private parsePrimary(): AstNode {
        const token = this.peek();
        if (!token) {
            throw new Error("Unexpected end of wire:show expression.");
        }

        if (token.type === "number" || token.type === "string" || token.type === "boolean" || token.type === "null" || token.type === "undefined") {
            this.index++;
            return { type: "literal", value: token.value };
        }

        if (token.type === "identifier") {
            this.index++;
            const base = token.value;
            const segments: string[] = [];

            while (this.matchOp(".", "?.")) {
                const next = this.peek();
                if (!next || next.type !== "identifier") {
                    throw new Error("Invalid property access in wire:show expression.");
                }
                this.index++;
                segments.push(next.value);
            }

            return { type: "path", base, segments };
        }

        if (token.type === "paren" && token.value === "(") {
            this.index++;
            const expr = this.parseNullish();
            const close = this.peek();
            if (!close || close.type !== "paren" || close.value !== ")") {
                throw new Error("Missing closing parenthesis in wire:show expression.");
            }
            this.index++;
            return expr;
        }

        throw new Error("Unsupported primary expression in wire:show.");
    }

    private matchOp(...operators: string[]): boolean {
        const token = this.peek();
        if (!token || token.type !== "op") return false;
        if (!operators.includes(token.value)) return false;
        this.index++;
        return true;
    }

    private previousOp(): string | undefined {
        const prev = this.tokens[this.index - 1];
        return prev?.type === "op" ? prev.value : undefined;
    }

    private peek(): Token | undefined {
        return this.tokens[this.index];
    }

    private isAtEnd() {
        return this.index >= this.tokens.length;
    }
}

function resolvePath(base: string, segments: string[], state: Record<string, any>) {
    let current = (state as any)[base];
    for (let i = 0; i < segments.length; i++) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[segments[i]!];
    }
    return current;
}

function evaluateAst(node: AstNode, state: Record<string, any>): any {
    if (node.type === "literal") return node.value;
    if (node.type === "path") return resolvePath(node.base, node.segments, state);

    if (node.type === "unary") {
        const value = evaluateAst(node.value, state);
        switch (node.op) {
            case "!": return !value;
            case "+": return +value;
            case "-": return -value;
            default: return undefined;
        }
    }

    if (node.op === "&&") {
        const left = evaluateAst(node.left, state);
        return left ? evaluateAst(node.right, state) : left;
    }
    if (node.op === "||") {
        const left = evaluateAst(node.left, state);
        return left ? left : evaluateAst(node.right, state);
    }
    if (node.op === "??") {
        const left = evaluateAst(node.left, state);
        return left === null || left === undefined ? evaluateAst(node.right, state) : left;
    }

    const left = evaluateAst(node.left, state);
    const right = evaluateAst(node.right, state);

    switch (node.op) {
        case "==": return left === right;
        case "!=": return left !== right;
        case "===": return left === right;
        case "!==": return left !== right;
        case ">": return left > right;
        case "<": return left < right;
        case ">=": return left >= right;
        case "<=": return left <= right;
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
        case "%": return left % right;
        default: return undefined;
    }
}

function createEvaluator(expression: string) {
    const source = String(expression || "").trim();
    if (!source) return () => true;

    try {
        const tokens = tokenize(source);
        const ast = new Parser(tokens).parse();
        return (state: Record<string, any>) => !!evaluateAst(ast, state || {});
    } catch {
        return () => false;
    }
}

Kirewire.directive("show", ({ el, expression, componentId, wire, cleanup }) => {
    const evaluate = createEvaluator(expression);
    const initialDisplay = el.style.display;

    const setVisible = (visible: boolean) => {
        if (visible) {
            if (initialDisplay) el.style.display = initialDisplay;
            else el.style.removeProperty("display");
            return;
        }
        el.style.display = "none";
    };

    const apply = (incomingState?: any) => {
        const proxy = wire.components.get(componentId) as any;
        const proxyTarget =
            proxy && proxy.__target && typeof proxy.__target === "object"
                ? (proxy.__target as Record<string, any>)
                : {};

        const state = incomingState && typeof incomingState === "object"
            ? incomingState
            : wire.getComponentState(el);
        const merged = Object.assign({}, state || {}, proxyTarget || {});

        let visible = false;
        try {
            visible = !!evaluate(merged);
        } catch {
            visible = false;
        }

        setVisible(visible);
    };

    const offUpdate = wire.$on("component:update", (data: any) => {
        if (data?.id !== componentId) return;
        apply(data?.state);
    });

    const offCollection = wire.$on("collection:update", (data: any) => {
        if (data?.componentId !== componentId) return;
        apply();
    });

    cleanup(offUpdate);
    cleanup(offCollection);

    apply();
});
