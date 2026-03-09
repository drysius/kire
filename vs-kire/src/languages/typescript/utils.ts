import * as vscode from "vscode";
import { SourceMapper } from "../../utils/sourceMap";
import { scanDirectives, type DirectiveCall } from "../../core/directiveScan";
import { kireStore } from "../../core/store";
import { parseParamDefinition, paramTypeToTs, splitTopLevelArgs } from "../../utils/params";
import { extractJsAttributeExpressions } from "../../utils/embedded";

export const KIRE_TS_SCHEME = "kire-ts";

interface InterfaceContext {
	thisType?: string;
	vars: Map<string, string>;
}

interface InterfaceDirectiveContexts {
	local: InterfaceContext;
	global: InterfaceContext;
}

function createInterfaceContext(): InterfaceContext {
	return { vars: new Map() };
}

function mergeType(existing: string | undefined, incoming: string | undefined): string | undefined {
	const next = incoming?.trim();
	if (!next) return existing;
	if (!existing || !existing.trim()) return next;
	if (existing.trim() === next) return existing.trim();
	return `(${existing.trim()}) & (${next})`;
}

function mergeInterfaceContext(target: InterfaceContext, source: InterfaceContext) {
	target.thisType = mergeType(target.thisType, source.thisType);
	for (const [name, type] of source.vars.entries()) {
		target.vars.set(name, type);
	}
}

function hasInterfaceContext(context: InterfaceContext): boolean {
	return !!(context.thisType && context.thisType.trim()) || context.vars.size > 0;
}

function serializeInterfaceContext(context: InterfaceContext): string {
	const vars = Array.from(context.vars.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, type]) => `${name}:${type}`)
		.join("|");
	return `${context.thisType?.trim() || ""}::${vars}`;
}

function isValidVariableName(name: string): boolean {
	return /^[$A-Z_a-z][$\w]*$/.test(name);
}

function normalizeObjectKey(raw: string): string | undefined {
	let key = raw.trim();
	if (!key) return undefined;
	if (key.startsWith("[")) return undefined;

	if (key.endsWith("?")) {
		key = key.slice(0, -1).trim();
	}

	if (
		(key.startsWith('"') && key.endsWith('"')) ||
		(key.startsWith("'") && key.endsWith("'")) ||
		(key.startsWith("`") && key.endsWith("`"))
	) {
		key = key.slice(1, -1).trim();
	}

	return isValidVariableName(key) ? key : undefined;
}

function findTopLevelChar(input: string, target: string): number {
	let inQuote: string | null = null;
	let depthParen = 0;
	let depthBracket = 0;
	let depthBrace = 0;
	let depthAngle = 0;

	for (let i = 0; i < input.length; i++) {
		const ch = input[i]!;
		const prev = i > 0 ? input[i - 1] : "";

		if (inQuote) {
			if (ch === inQuote && prev !== "\\") inQuote = null;
			continue;
		}

		if (ch === '"' || ch === "'" || ch === "`") {
			inQuote = ch;
			continue;
		}

		if (ch === "(") depthParen++;
		else if (ch === ")") depthParen--;
		else if (ch === "[") depthBracket++;
		else if (ch === "]") depthBracket--;
		else if (ch === "{") depthBrace++;
		else if (ch === "}") depthBrace--;
		else if (ch === "<") depthAngle++;
		else if (ch === ">") depthAngle--;

		if (
			ch === target &&
			depthParen === 0 &&
			depthBracket === 0 &&
			depthBrace === 0 &&
			depthAngle === 0
		) {
			return i;
		}
	}

	return -1;
}

function parseInterfaceObjectLiteral(raw: string): Map<string, string> {
	const vars = new Map<string, string>();
	const trimmed = raw.trim();
	if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return vars;

	const body = trimmed.slice(1, -1).trim();
	if (!body) return vars;

	const fields = splitTopLevelArgs(body);
	for (const fieldRaw of fields) {
		const field = fieldRaw.trim();
		if (!field || field.startsWith("...")) continue;

		const colon = findTopLevelChar(field, ":");
		if (colon === -1) continue;

		const key = normalizeObjectKey(field.slice(0, colon));
		if (!key) continue;

		const typeExpr = field.slice(colon + 1).trim();
		if (!typeExpr) continue;
		vars.set(key, typeExpr);
	}

	return vars;
}

function parseBooleanLiteral(raw?: string): boolean {
	if (!raw) return false;
	const value = raw.trim();
	if (!value) return false;
	if (value === "true" || value === "1") return true;
	if (value === '"true"' || value === "'true'") return true;
	return false;
}

function parseInterfaceTarget(raw?: string): InterfaceContext {
	const context = createInterfaceContext();
	if (!raw) return context;

	const trimmed = raw.trim();
	if (!trimmed) return context;

	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		const vars = parseInterfaceObjectLiteral(trimmed);
		for (const [name, type] of vars.entries()) {
			context.vars.set(name, type);
		}
		return context;
	}

	context.thisType = trimmed;
	return context;
}

function extractInterfaceContextsFromDirectives(directives: DirectiveCall[]): InterfaceDirectiveContexts {
	const local = createInterfaceContext();
	const global = createInterfaceContext();

	for (const directive of directives) {
		if (directive.name !== "interface") continue;
		if (directive.args.length === 0) continue;

		const target = parseInterfaceTarget(directive.args[0]?.value);
		const useGlobal = parseBooleanLiteral(directive.args[1]?.value);
		if (useGlobal) {
			mergeInterfaceContext(global, target);
			continue;
		}
		mergeInterfaceContext(local, target);
	}

	return { local, global };
}

function normalizeType(typeName: string): string {
	const clean = typeName.trim();
	if (!clean) return "any";

	if (clean.includes("|")) {
		return clean
			.split("|")
			.map((entry) => normalizeType(entry))
			.join(" | ");
	}

	if (clean.startsWith("tools.")) {
		return resolveToolType(clean.slice("tools.".length));
	}

	switch (clean) {
		case "string":
		case "number":
		case "boolean":
		case "any":
		case "unknown":
		case "never":
			return clean;
		case "filepath":
		case "path":
			return "string";
		case "object":
			return "Record<string, any>";
		case "array":
			return "any[]";
		case "function":
			return "(...args: any[]) => any";
		default:
			return clean;
	}
}

function resolveToolType(ref: string): string {
	const tools = kireStore.getState().tools;
	const direct = tools.get(ref);
	if (direct) {
		if (typeof direct.tstype === "string" && direct.tstype.trim()) {
			return direct.tstype;
		}
		if (typeof direct.type === "string") {
			return normalizeType(direct.type);
		}
		if (Array.isArray(direct.type)) {
			return direct.type.map((entry: string) => normalizeType(entry)).join(" | ");
		}
	}

	const children = Array.from(tools.entries()).filter(([name]) =>
		name.startsWith(`${ref}.`),
	);
	if (children.length === 0) return "any";

	const fields = children
		.map(([name, def]) => {
			const key = name.slice(ref.length + 1);
			if (key.includes(".")) return "";
			const fieldType =
				typeof def.tstype === "string"
					? def.tstype
					: Array.isArray(def.type)
						? def.type
								.map((entry: string) => normalizeType(entry))
								.join(" | ")
						: normalizeType((def.type as string) || "any");
			return `${key}: ${fieldType};`;
		})
		.filter(Boolean);

	if (fields.length === 0) return "Record<string, any>";
	return `{ ${fields.join(" ")} }`;
}

function resolveDirectiveParamType(definition?: string): string {
	if (!definition) return "any";
	const raw = definition.trim();
	if (!raw) return "any";
	const parsed = parseParamDefinition(raw);
	if (parsed.type === "pattern") return "any";
	return paramTypeToTs(parsed.type || parsed.tstype || "any", resolveToolType);
}

function buildGlobalsDeclaration(interfaceContext: InterfaceContext): string {
	const globals = kireStore.getState().globals;
	const roots: Record<string, any> = {};

	globals.forEach((def, key) => {
		const parts = key.split(".");
		const rootName = parts[0]!;
		if (!roots[rootName]) roots[rootName] = { _children: {} };

		if (parts.length === 1) {
			roots[rootName]._def = def;
			return;
		}

		let current = roots[rootName];
		for (let i = 1; i < parts.length; i++) {
			const part = parts[i]!;
			if (!current._children[part]) current._children[part] = { _children: {} };
			current = current._children[part];
			if (i === parts.length - 1) current._def = def;
		}
	});

	for (const [name, type] of interfaceContext.vars.entries()) {
		if (!roots[name]) roots[name] = { _children: {} };
		roots[name]._def = {
			type,
			tstype: type,
			comment: "Declared by @interface",
		};
	}

	if (!roots.kire) roots.kire = { _def: { type: "any" }, _children: {} };
	if (!roots.$ctx) roots.$ctx = { _def: { type: "any" }, _children: {} };
	if (!roots.it) roots.it = { _def: { type: "Record<string, any>" }, _children: {} };
	if (!roots.$props) {
		roots.$props = { _def: { type: "Record<string, any>" }, _children: {} };
	}

	const thisType = interfaceContext.thisType?.trim();
	if (thisType) {
		roots.it._def = {
			type: thisType,
			tstype: thisType,
			comment: "Declared by @interface",
		};
		roots.$props._def = {
			type: thisType,
			tstype: thisType,
			comment: "Declared by @interface",
		};
	}

	const renderType = (node: any): string => {
		const childrenKeys = Object.keys(node._children || {});
		if (childrenKeys.length > 0) {
			const entries = childrenKeys.map(
				(key) => `${key}: ${renderType(node._children[key])};`,
			);
			return `{ ${entries.join(" ")} }`;
		}

		const def = node._def;
		if (!def) return "any";
		const typeValue = def.tstype || def.type || "any";
		return Array.isArray(typeValue)
			? typeValue.map((entry: string) => normalizeType(entry)).join(" | ")
			: normalizeType(String(typeValue));
	};

	const evalThisType = thisType || "Record<string, any>";
	let declarations = "";
	declarations += `type __kire_this = ${evalThisType};\n`;
	declarations += "type __kire_alpine_magic = { $refs: Record<string, any>; $nextTick: (callback: () => void) => void; $watch: (name: string, callback: (value: any) => void) => void; $dispatch: (name: string, detail?: any) => void; $el: any; $root: any; };\n";
	declarations += "declare function __kire_expect<T>(value: T): void;\n";
	declarations += "declare function __kire_eval<T>(fn: (this: __kire_this) => T): T;\n";
	declarations += "declare function __kire_alpine_data<T extends object>(value: T & ThisType<T & __kire_alpine_magic>): T;\n";
	for (const [rootName, node] of Object.entries(roots)) {
		const def = node._def;
		const comment = def?.description || def?.comment;
		if (comment) declarations += `/** ${comment} */\n`;
		declarations += `declare const ${rootName}: ${renderType(node)};\n`;
	}
	return declarations;
}

function mapExpression(
	document: vscode.TextDocument,
	mapper: SourceMapper,
	expression: string,
	sourceStartOffset: number,
	generatedStartLine: number,
	generatedExpressionCharacter = 0,
) {
	const sourceStart = document.positionAt(sourceStartOffset);
	const lines = expression.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		mapper.addMapping(
			sourceStart.line + i,
			i === 0 ? sourceStart.character : 0,
			generatedStartLine + i,
			i === 0 ? generatedExpressionCharacter : 0,
			line.length,
		);
	}
}

function appendStatement(
	state: { content: string; generatedLine: number },
	statement: string,
): number {
	const startLine = state.generatedLine;
	state.content += statement + "\n";
	state.generatedLine += statement.split("\n").length;
	return startLine;
}

export class KireTsDocumentProvider implements vscode.TextDocumentContentProvider {
	private virtualContent = new Map<string, string>();
	private sourceMaps = new Map<string, SourceMapper>();
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private globalInterfaceByUri = new Map<string, InterfaceContext>();
	private globalInterfaceSignatures = new Map<string, string>();
	private globalInterfaceContext: InterfaceContext = createInterfaceContext();
	private workspaceScanPromise: Promise<void> | null = null;
	private workspaceInterfacesLoaded = false;
	private workspaceScanTimer: NodeJS.Timeout | undefined;
	public readonly onDidChange = this._onDidChange.event;

	public provideTextDocumentContent(uri: vscode.Uri): string {
		const path = uri.path.slice(0, -3);
		const originalUri = uri.with({ scheme: "file", path });
		return this.virtualContent.get(originalUri.toString()) || "";
	}

	public bootstrapWorkspaceInterfaces() {
		if (this.workspaceInterfacesLoaded) return;
		if (this.workspaceScanPromise) return;
		this.workspaceScanPromise = this.scanWorkspaceForGlobalInterfaces().finally(
			() => {
				this.workspaceScanPromise = null;
				this.workspaceInterfacesLoaded = true;
			},
		);
	}

	public scheduleWorkspaceInterfaceRescan() {
		this.workspaceInterfacesLoaded = false;
		if (this.workspaceScanTimer) clearTimeout(this.workspaceScanTimer);
		this.workspaceScanTimer = setTimeout(() => {
			this.workspaceScanPromise = this.scanWorkspaceForGlobalInterfaces().finally(
				() => {
					this.workspaceScanPromise = null;
					this.workspaceInterfacesLoaded = true;
				},
			);
		}, 180);
	}

	private async scanWorkspaceForGlobalInterfaces() {
		const exclude =
			"**/{node_modules,publish,.git,dist,coverage,test-results,playwright-report}/**";

		const [kireFiles, kireHtmlFiles] = await Promise.all([
			vscode.workspace.findFiles("**/*.kire", exclude),
			vscode.workspace.findFiles("**/*.kire.html", exclude),
		]);

		const dedupe = new Map<string, vscode.Uri>();
		for (const uri of [...kireFiles, ...kireHtmlFiles]) {
			dedupe.set(uri.toString(), uri);
		}

		const nextByUri = new Map<string, InterfaceContext>();
		const nextSignatures = new Map<string, string>();

		for (const uri of dedupe.values()) {
			try {
				const bytes = await vscode.workspace.fs.readFile(uri);
				const text = Buffer.from(bytes).toString("utf8");
				const directives = scanDirectives(text);
				const contexts = extractInterfaceContextsFromDirectives(directives);
				if (!hasInterfaceContext(contexts.global)) continue;
				const signature = serializeInterfaceContext(contexts.global);
				nextByUri.set(uri.toString(), contexts.global);
				nextSignatures.set(uri.toString(), signature);
			} catch {
				// Ignore unreadable files.
			}
		}

		this.globalInterfaceByUri = nextByUri;
		this.globalInterfaceSignatures = nextSignatures;
		const changed = this.rebuildGlobalInterfaceContext();
		if (changed) this.refreshOpenKireDocuments();
	}

	private rebuildGlobalInterfaceContext(): boolean {
		const next = createInterfaceContext();
		for (const context of this.globalInterfaceByUri.values()) {
			mergeInterfaceContext(next, context);
		}

		const prevSignature = serializeInterfaceContext(this.globalInterfaceContext);
		const nextSignature = serializeInterfaceContext(next);
		if (prevSignature === nextSignature) return false;
		this.globalInterfaceContext = next;
		return true;
	}

	private setGlobalInterfaceForUri(uri: vscode.Uri, context: InterfaceContext): boolean {
		const key = uri.toString();
		if (!hasInterfaceContext(context)) {
			const had = this.globalInterfaceByUri.delete(key);
			this.globalInterfaceSignatures.delete(key);
			return had ? this.rebuildGlobalInterfaceContext() : false;
		}

		const signature = serializeInterfaceContext(context);
		if (this.globalInterfaceSignatures.get(key) === signature) return false;

		this.globalInterfaceByUri.set(key, context);
		this.globalInterfaceSignatures.set(key, signature);
		return this.rebuildGlobalInterfaceContext();
	}

	private refreshOpenKireDocuments(exceptUri?: vscode.Uri) {
		const except = exceptUri?.toString();
		for (const doc of vscode.workspace.textDocuments) {
			const isKire = doc.languageId === "kire" || doc.fileName.endsWith(".kire");
			if (!isKire) continue;
			if (except && doc.uri.toString() === except) continue;
			this.update(doc);
		}
	}

	public update(document: vscode.TextDocument): { virtualUri: vscode.Uri; mapper: SourceMapper } {
		this.bootstrapWorkspaceInterfaces();

		const text = document.getText();
		const originalUri = document.uri;
		const virtualUri = originalUri.with({
			scheme: KIRE_TS_SCHEME,
			path: `${originalUri.path}.ts`,
		});

		const mapper = new SourceMapper(originalUri.toString(), virtualUri.toString());
		const directives = scanDirectives(text);
		const interfaceContexts = extractInterfaceContextsFromDirectives(directives);
		const globalChanged = this.setGlobalInterfaceForUri(
			originalUri,
			interfaceContexts.global,
		);
		if (globalChanged) this.refreshOpenKireDocuments(originalUri);

		const mergedInterfaceContext = createInterfaceContext();
		mergeInterfaceContext(mergedInterfaceContext, this.globalInterfaceContext);
		mergeInterfaceContext(mergedInterfaceContext, interfaceContexts.local);

		const state = {
			content: buildGlobalsDeclaration(mergedInterfaceContext),
			generatedLine: 0,
		};
		state.generatedLine = state.content.split("\n").length - 1;

		const addExpression = (
			expression: string,
			sourceStartOffset: number,
			mode: "default" | "alpineData" = "default",
		) => {
			const clean = expression.trim();
			if (!clean) return;

			let statement = `__kire_eval(function(){ ${clean}; });`;
			if (mode === "alpineData") {
				statement = `__kire_alpine_data(${clean});`;
			}

			const startLine = appendStatement(state, statement);
			const generatedExpressionCharacter = Math.max(statement.indexOf(clean), 0);
			mapExpression(
				document,
				mapper,
				clean,
				sourceStartOffset + (expression.length - expression.trimStart().length),
				startLine,
				generatedExpressionCharacter,
			);
		};

		const addExpectation = (
			expression: string,
			sourceStartOffset: number,
			expectedType: string,
		) => {
			const clean = expression.trim();
			if (!clean || expectedType === "any") return;
			const statement = `__kire_expect<${expectedType}>(${clean});`;
			const exprStart = statement.indexOf(clean);
			const startLine = appendStatement(state, statement);
			mapExpression(
				document,
				mapper,
				clean,
				sourceStartOffset + (expression.length - expression.trimStart().length),
				startLine,
				exprStart >= 0 ? exprStart : 0,
			);
		};

		const jsBlockRegex = /<\?js\b([\s\S]*?)\?>/g;
		for (let match: RegExpExecArray | null; (match = jsBlockRegex.exec(text)); ) {
			const block = match[1] || "";
			const startOffset = match.index + 4;
			const clean = block.trim();
			if (!clean) continue;
			const startLine = appendStatement(state, clean);
			mapExpression(
				document,
				mapper,
				clean,
				startOffset + (block.length - block.trimStart().length),
				startLine,
			);
		}

		const rawInterpolationRegex = /\{\{\{([\s\S]*?)\}\}\}/g;
		for (let match: RegExpExecArray | null; (match = rawInterpolationRegex.exec(text)); ) {
			const expr = match[1] || "";
			addExpression(expr, match.index + 3);
		}

		const interpolationRegex = /\{\{([\s\S]*?)\}\}/g;
		for (let match: RegExpExecArray | null; (match = interpolationRegex.exec(text)); ) {
			if (text.slice(match.index, match.index + 3) === "{{{") continue;
			const expr = match[1] || "";
			addExpression(expr, match.index + 2);
		}

		const jsAttributes = extractJsAttributeExpressions(text);
		for (const attr of jsAttributes) {
			const alpineMode =
				attr.name === "x-data" || attr.name.startsWith("x-data.");
			addExpression(attr.value, attr.valueStart, alpineMode ? "alpineData" : "default");
		}

		const directiveDefs = kireStore.getState().directives;
		for (const directive of directives) {
			if (directive.name === "interface") continue;

			const def = directiveDefs.get(directive.name);
			const params = Array.isArray(def?.params) ? def.params : [];
			for (let i = 0; i < directive.args.length; i++) {
				const arg = directive.args[i]!;
				const rawParamDef = params[i];
				const parsedParam = rawParamDef
					? parseParamDefinition(String(rawParamDef))
					: undefined;

				if (parsedParam?.type !== "pattern") {
					addExpression(arg.value, arg.start);
				}

				const expectedType = resolveDirectiveParamType(
					typeof rawParamDef === "string" ? rawParamDef : undefined,
				);
				addExpectation(arg.value, arg.start, expectedType);
			}
		}

		this.virtualContent.set(originalUri.toString(), state.content);
		this.sourceMaps.set(originalUri.toString(), mapper);
		this._onDidChange.fire(virtualUri);
		return { virtualUri, mapper };
	}

	public getMapper(originalUri: vscode.Uri): SourceMapper | undefined {
		return this.sourceMaps.get(originalUri.toString());
	}
}

export const provider = new KireTsDocumentProvider();
