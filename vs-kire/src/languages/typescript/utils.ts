import * as vscode from "vscode";
import { SourceMapper } from "../../utils/sourceMap";
import { scanDirectives } from "../../core/directiveScan";
import { kireStore } from "../../core/store";
import { parseParamDefinition, paramTypeToTs } from "../../utils/params";
import { extractJsAttributeExpressions } from "../../utils/embedded";
import { extractTopLevelDirectiveDeclarations } from "../../utils/directiveDeclarations";
import {
	createInterfaceContext,
	extractInterfaceContextsFromDirectives,
	hasInterfaceContext,
	type InterfaceContext,
	mergeInterfaceContext,
	serializeInterfaceContext,
} from "../../utils/interface";

export const KIRE_TS_SCHEME = "kire-ts";

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

	for (const [name, info] of interfaceContext.vars.entries()) {
		if (!roots[name]) roots[name] = { _children: {} };
		roots[name]._def = {
			type: info.type,
			tstype: info.type,
			comment: info.description || "Declared by @interface",
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

function escapeJsDocComment(value: string): string {
	return value.replace(/\*\//g, "* /").trim();
}

function buildDirectiveDeclarationStatement(entry: {
	name: string;
	type?: string;
	description?: string;
	declarationKind?: "const" | "let" | "var";
	initializer?: string;
}): string {
	const lines: string[] = [];
	if (entry.description?.trim()) {
		lines.push(`/** ${escapeJsDocComment(entry.description)} */`);
	}

	if (entry.initializer && (entry.declarationKind === "const" || entry.declarationKind === "let")) {
		lines.push(`${entry.declarationKind} ${entry.name} = ${entry.initializer};`);
		return lines.join("\n");
	}

	if (entry.type && entry.type !== "any") {
		lines.push(`let ${entry.name}: ${entry.type};`);
		return lines.join("\n");
	}

	lines.push(`let ${entry.name}: any;`);
	return lines.join("\n");
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

	public getInterfaceContextForDocument(
		document: vscode.TextDocument,
	): InterfaceContext {
		this.bootstrapWorkspaceInterfaces();

		const directives = scanDirectives(document.getText());
		const interfaceContexts = extractInterfaceContextsFromDirectives(directives);
		const merged = createInterfaceContext();
		mergeInterfaceContext(merged, this.globalInterfaceContext);
		mergeInterfaceContext(merged, interfaceContexts.local);
		mergeInterfaceContext(merged, interfaceContexts.global);
		return merged;
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

		const topLevelDeclarations = extractTopLevelDirectiveDeclarations(text);
		for (const entry of topLevelDeclarations) {
			appendStatement(state, buildDirectiveDeclarationStatement(entry));
		}

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
			const signature = Array.isArray(def?.signature)
				? def.signature
				: [];
			for (let i = 0; i < directive.args.length; i++) {
				if ((directive.name === "const" || directive.name === "let") && i === 0) {
					continue;
				}

				const arg = directive.args[i]!;
				const rawParamDef = signature[i];
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
