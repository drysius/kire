import * as vscode from "vscode";
import {
	kireStore,
	type AttributeDefinition,
	type ElementDefinition,
} from "../../core/store";

type ModifierLike = {
	name?: string;
	variable?: string;
	description?: string;
	dsescription?: string;
	comment?: string;
	type?: string | string[];
	params?: any;
	example?: string;
	extends?: any;
	[key: string]: any;
};

interface ModifierEntry {
	key: string;
	path: string[];
	depth: number;
	def: ModifierLike;
}

interface TokenSegment {
	text: string;
	start: number;
	end: number;
}

interface ResolvedAttribute {
	def: AttributeDefinition;
	matchedName: string;
	baseSegmentCount: number;
}

interface HoverToken {
	range: vscode.Range;
	word: string;
}

function toTypeLabel(value: string | string[] | undefined): string {
	if (Array.isArray(value)) return value.join(" | ");
	return value || "any";
}

function getDescription(def: Record<string, any> | undefined): string {
	if (!def) return "";
	const raw =
		(typeof def.description === "string" && def.description) ||
		(typeof def.comment === "string" && def.comment) ||
		(typeof def.dsescription === "string" && def.dsescription) ||
		"";
	return raw.trim();
}

function stripLegacyModifiersSection(text: string): string {
	const idx = text.search(/^###\s*Modifiers\b/im);
	if (idx < 0) return text.trim();
	return text.slice(0, idx).trim();
}

function toModifierChildren(raw: any): any[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw !== "object") return [];

	const children: any[] = [];
	for (const [name, value] of Object.entries(raw as Record<string, any>)) {
		if (typeof value === "string") {
			children.push({ name, description: value });
			continue;
		}

		if (value && typeof value === "object") {
			children.push({ name, ...(value as Record<string, any>) });
			continue;
		}

		children.push({ name });
	}
	return children;
}

function normalizeModifier(raw: any): ModifierLike | undefined {
	if (typeof raw === "string") return { name: raw };
	if (!raw || typeof raw !== "object") return undefined;

	const name =
		typeof raw.name === "string"
			? raw.name
			: typeof raw.variable === "string"
				? raw.variable
				: "";
	if (!name) return undefined;

	return { ...raw, name };
}

function flattenModifiers(raw: any, parent: string[] = []): ModifierEntry[] {
	const out: ModifierEntry[] = [];
	const list = toModifierChildren(raw);
	for (const item of list) {
		const normalized = normalizeModifier(item);
		if (!normalized?.name) continue;

		const path = [...parent, normalized.name];
		out.push({
			key: path.join("."),
			path,
			depth: path.length - 1,
			def: normalized,
		});

		const children = flattenModifiers(normalized.extends, path);
		for (const child of children) out.push(child);
	}
	return out;
}

function parseLegacyModifiers(comment?: string): ModifierEntry[] {
	if (!comment) return [];
	const section = comment.match(/###\s*Modifiers([\s\S]*?)(?:###|$)/i);
	if (!section) return [];

	const out: ModifierEntry[] = [];
	const lines = section[1].split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;

		const match = line.match(/-\s*`\.([^`]+)`\s*:?\s*(.*)/);
		if (!match) continue;

		const path = match[1]
			.split(".")
			.map((part) => part.trim())
			.filter(Boolean);
		if (path.length === 0) continue;

		const description = (match[2] || "").trim();
		out.push({
			key: path.join("."),
			path,
			depth: path.length - 1,
			def: {
				name: path[path.length - 1],
				description,
			},
		});
	}
	return out;
}

function collectModifiers(attrDef: AttributeDefinition): Map<string, ModifierEntry> {
	const map = new Map<string, ModifierEntry>();

	const structured = flattenModifiers((attrDef as any).extends);
	for (const entry of structured) {
		map.set(entry.key, entry);
	}

	const legacy = parseLegacyModifiers(attrDef.comment);
	for (const entry of legacy) {
		if (!map.has(entry.key)) map.set(entry.key, entry);
	}

	return map;
}

function formatSignature(signature: any): string {
	if (!signature) return "";
	if (typeof signature === "string") return signature;

	if (Array.isArray(signature)) {
		const labels = signature
			.map((entry) => {
				if (typeof entry === "string") return entry;
				if (!entry || typeof entry !== "object") return "value:any";

				const name =
					typeof entry.name === "string"
						? entry.name
						: typeof entry.variable === "string"
							? entry.variable
							: "value";
				const type = toTypeLabel((entry as any).type);
				return `${name}:${type}`;
			})
			.filter(Boolean);
		return labels.join(", ");
	}

	if (typeof signature === "object") {
		const labels = Object.entries(signature).map(([name, value]) => {
			if (typeof value === "string") return `${name}:${value}`;
			if (Array.isArray(value)) return `${name}:${value.join("|")}`;
			return `${name}:any`;
		});
		return labels.join(", ");
	}

	return String(signature);
}

function getSignature(def: { signature?: any }): any {
	return def.signature;
}

function formatDeclares(declares: any): string {
	if (!Array.isArray(declares) || declares.length === 0) return "";

	const labels = declares
		.map((entry) => {
			if (!entry || typeof entry !== "object") return "";
			if (typeof entry.name === "string" && entry.name.trim()) {
				return entry.type ? `${entry.name}:${entry.type}` : entry.name;
			}

			const source =
				typeof entry.fromArg === "number"
					? `arg[${entry.fromArg}]`
					: typeof entry.fromAttribute === "string"
						? `attr.${entry.fromAttribute}`
						: "";
			if (!source) return "";

			const capture = Array.isArray(entry.capture)
				? entry.capture.join("|")
				: typeof entry.capture === "string"
					? entry.capture
					: "";

			let label = source;
			if (entry.pattern) label += ` via ${entry.pattern}`;
			if (capture) label += ` => ${capture}`;
			if (entry.type) label += `:${entry.type}`;
			return label;
		})
		.filter(Boolean);

	return labels.join(", ");
}

function getTokenSegments(word: string): TokenSegment[] {
	const segments: TokenSegment[] = [];
	const parts = word.split(".");
	let start = 0;

	for (let i = 0; i < parts.length; i++) {
		const text = parts[i] as string;
		const end = start + text.length;
		segments.push({ text, start, end });
		start = end + 1;
	}

	if (segments.length === 0) {
		segments.push({ text: word, start: 0, end: word.length });
	}

	return segments;
}

function getActiveSegmentIndex(word: string, offset: number): number {
	const segments = getTokenSegments(word);
	const safeOffset = Math.max(0, Math.min(offset, word.length));

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i] as TokenSegment;
		if (safeOffset >= segment.start && safeOffset <= segment.end) {
			return i;
		}
	}

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i] as TokenSegment;
		if (safeOffset === segment.end + 1) {
			return i + 1;
		}
	}

	return Math.max(segments.length - 1, 0);
}

function normalizeInlineAttribute(name: string, raw: any): AttributeDefinition {
	if (!raw) return { name, type: "any" };
	if (typeof raw === "string") return { name, type: raw, comment: "" };
	return {
		name,
		...raw,
		type: raw.type ?? "any",
		comment: raw.comment ?? raw.description ?? "",
	};
}

function findAttributeInElements(name: string): AttributeDefinition | undefined {
	const { elements } = kireStore.getState();
	for (const element of elements.values()) {
		if (!element.attributes) continue;

		if (Array.isArray(element.attributes)) {
			for (const attr of element.attributes) {
				if (!attr || typeof attr !== "object") continue;
				if ((attr as any).name !== name) continue;
				return normalizeInlineAttribute(name, attr);
			}
			continue;
		}

		const raw = (element.attributes as Record<string, any>)[name];
		if (raw) return normalizeInlineAttribute(name, raw);
	}

	return undefined;
}

function resolveAttribute(word: string): ResolvedAttribute | undefined {
	const store = kireStore.getState();
	const parts = word.split(".").filter(Boolean);
	if (parts.length === 0) return undefined;

	for (let i = parts.length; i > 0; i--) {
		const candidate = parts.slice(0, i).join(".");
		const fromStore = store.attributes.get(candidate);
		if (fromStore) {
			return {
				def: fromStore,
				matchedName: candidate,
				baseSegmentCount: candidate.split(".").filter(Boolean).length,
			};
		}

		const fromElement = findAttributeInElements(candidate);
		if (fromElement) {
			return {
				def: fromElement,
				matchedName: candidate,
				baseSegmentCount: candidate.split(".").filter(Boolean).length,
			};
		}
	}

	return undefined;
}

function getElementAttributes(elementDef: ElementDefinition): Array<{
	name: string;
	def: AttributeDefinition;
}> {
	const out: Array<{ name: string; def: AttributeDefinition }> = [];
	if (!elementDef.attributes) return out;

	if (Array.isArray(elementDef.attributes)) {
		for (const raw of elementDef.attributes) {
			if (!raw || typeof raw !== "object") continue;
			const name = typeof (raw as any).name === "string" ? (raw as any).name : "";
			if (!name) continue;
			out.push({ name, def: normalizeInlineAttribute(name, raw) });
		}
		return out;
	}

	for (const [name, raw] of Object.entries(
		elementDef.attributes as Record<string, any>,
	)) {
		out.push({ name, def: normalizeInlineAttribute(name, raw) });
	}
	return out;
}

function appendModuleInfo(md: vscode.MarkdownString) {
	const meta = kireStore.getState().metadata;
	if (!meta || !meta.name) return;

	md.appendMarkdown(`\n\n---\n`);
	md.appendMarkdown(`**Module**\n`);
	if (meta.author) md.appendMarkdown(`@author "${meta.author}"\n`);

	let pkgLabel = meta.name;
	if (meta.repository) {
		pkgLabel = `[${meta.name}](${meta.repository})`;
	}
	md.appendMarkdown(`${pkgLabel} - ${meta.version || "0.0.0"}`);
}

function getHoverToken(
	document: vscode.TextDocument,
	position: vscode.Position,
): HoverToken | undefined {
	const range = document.getWordRangeAtPosition(
		position,
		/(@?[a-zA-Z0-9_\-:\.]+)/,
	);
	if (!range) return undefined;
	const word = document.getText(range);
	return { range, word };
}

function buildDirectiveHover(word: string): vscode.Hover | undefined {
	if (!word.startsWith("@")) return undefined;

	const directiveName = word.slice(1);
	const def = kireStore.getState().directives.get(directiveName);
	if (!def) return undefined;

	const md = new vscode.MarkdownString();
	const signature = getSignature(def as any);
	md.appendCodeblock(
		`@${def.name}${signature ? `(${signature.join(", ")})` : ""}`,
		"kire",
	);
	const description = getDescription(def as any);
	if (description) md.appendMarkdown(`\n\n${description}`);
	const declares = formatDeclares((def as any).declares);
	if (declares) md.appendMarkdown(`\n\nDeclares: \`${declares}\``);
	if (def.example) md.appendCodeblock(String(def.example), "kire");
	return new vscode.Hover(md);
}

function buildElementHover(
	document: vscode.TextDocument,
	position: vscode.Position,
	range: vscode.Range,
	word: string,
): vscode.Hover | undefined {
	const elementDef = kireStore.getState().elements.get(word);
	if (!elementDef) return undefined;

	const line = document.lineAt(position.line).text;
	const before = line.slice(0, range.start.character);
	if (!/<(\/)?\s*$/.test(before)) return undefined;

	const md = new vscode.MarkdownString();
	md.appendCodeblock(elementDef.void ? `<${elementDef.name} />` : `<${elementDef.name}>`, "html");

	const description = getDescription(elementDef as any);
	if (description) md.appendMarkdown(`\n\n${description}`);

	if (elementDef.example) {
		md.appendCodeblock(String(elementDef.example), "html");
	}

	const attrs = getElementAttributes(elementDef);
	if (attrs.length > 0) {
		md.appendMarkdown(`\n\n**Attributes**`);
		const maxItems = 10;
		for (let i = 0; i < Math.min(attrs.length, maxItems); i++) {
			const item = attrs[i]!;
			const attrDescription = getDescription(item.def as any);
			const type = toTypeLabel(item.def.type);
			let lineText = `\n- \`${item.name}\` : \`${type}\``;
			if (attrDescription) lineText += ` - ${attrDescription}`;
			md.appendMarkdown(lineText);
		}
		if (attrs.length > maxItems) {
			md.appendMarkdown(`\n- ...and ${attrs.length - maxItems} more`);
		}
	}

	const declares = formatDeclares((elementDef as any).declares);
	if (declares) md.appendMarkdown(`\n\n**Declares**\n\n\`${declares}\``);

	appendModuleInfo(md);
	return new vscode.Hover(md);
}

function buildAttributeHover(
	position: vscode.Position,
	range: vscode.Range,
	word: string,
): vscode.Hover | undefined {
	const resolved = resolveAttribute(word);
	if (!resolved) return undefined;

	const { def, matchedName, baseSegmentCount } = resolved;
	const md = new vscode.MarkdownString();
	md.isTrusted = true;

	const type = toTypeLabel(def.type);
	md.appendCodeblock(`${matchedName}="${type}"`, "html");

	const description = stripLegacyModifiersSection(getDescription(def as any));
	if (description) md.appendMarkdown(`\n\n${description}`);
	if (def.example) md.appendCodeblock(String(def.example), "html");

	const modifiers = collectModifiers(def);
	const topLevel = Array.from(modifiers.values()).filter((entry) => entry.depth === 0);
	if (topLevel.length > 0) {
		md.appendMarkdown(`\n\n**Extends / Modifiers**`);
		for (const item of topLevel) {
			const modifierDescription = getDescription(item.def as any);
			const params = formatSignature(getSignature(item.def as any));
			let lineText = `\n- \`.${item.def.name}\``;
			if (modifierDescription) lineText += ` - ${modifierDescription}`;
			if (params) lineText += ` _(signature: ${params})_`;
			md.appendMarkdown(lineText);
		}
	}

	const offset = position.character - range.start.character;
	const activeIndex = getActiveSegmentIndex(word, offset);
	if (activeIndex >= baseSegmentCount) {
		const segments = getTokenSegments(word);
		const active = segments[activeIndex];
		const path = segments
			.slice(baseSegmentCount, activeIndex + 1)
			.map((segment) => segment.text)
			.filter(Boolean);
		const key = path.join(".");
		const current = modifiers.get(key);

		if (current) {
			const currentDescription = getDescription(current.def as any);
			const params = formatSignature(getSignature(current.def as any));
			md.appendMarkdown(`\n\n**Current Segment**`);
			md.appendMarkdown(`\n\n\`.${current.path.join(".")}\``);
			if (currentDescription) md.appendMarkdown(` - ${currentDescription}`);
			if (params) md.appendMarkdown(`\n\nExpected arguments: \`${params}\``);
			const next = Array.from(modifiers.values()).filter((entry) => {
				if (entry.depth !== current.depth + 1) return false;
				return entry.key.startsWith(`${current.key}.`);
			});
			if (next.length > 0) {
				md.appendMarkdown(`\n\n**Next Modifiers**`);
				const maxItems = 8;
				for (let i = 0; i < Math.min(next.length, maxItems); i++) {
					const entry = next[i]!;
					const nextDescription = getDescription(entry.def as any);
					let nextLine = `\n- \`.${entry.path.join(".")}\``;
					if (nextDescription) nextLine += ` - ${nextDescription}`;
					md.appendMarkdown(nextLine);
				}
				if (next.length > maxItems) {
					md.appendMarkdown(`\n- ...and ${next.length - maxItems} more`);
				}
			}
			if (current.def.example) {
				md.appendCodeblock(String(current.def.example), "html");
			}
		} else {
			const parentPath = path.slice(0, -1).join(".");
			const parent = modifiers.get(parentPath);
			const activeValue = active?.text || "";
			if (parent && activeValue) {
				const params = formatSignature(getSignature(parent.def as any));
				if (params) {
					md.appendMarkdown(`\n\n**Current Segment**`);
					md.appendMarkdown(`\n\n\`${activeValue}\` as parameter for \`.${parent.path.join(".")}\``);
					md.appendMarkdown(`\n\nExpected arguments: \`${params}\``);
				}
			}
		}
	}

	appendModuleInfo(md);
	return new vscode.Hover(md);
}

export function hasKireHoverTarget(
	document: vscode.TextDocument,
	position: vscode.Position,
): boolean {
	const token = getHoverToken(document, position);
	if (!token) return false;

	const { range, word } = token;
	if (word.startsWith("@")) {
		const directiveName = word.slice(1);
		if (kireStore.getState().directives.has(directiveName)) return true;
	}

	if (kireStore.getState().elements.has(word)) {
		const line = document.lineAt(position.line).text;
		const before = line.slice(0, range.start.character);
		if (/<(\/)?\s*$/.test(before)) return true;
	}

	return !!resolveAttribute(word);
}

export function provideKireSchemaHover(
	document: vscode.TextDocument,
	position: vscode.Position,
): vscode.Hover | undefined {
	const token = getHoverToken(document, position);
	if (!token) return undefined;
	const { range, word } = token;

	const directiveHover = buildDirectiveHover(word);
	if (directiveHover) return directiveHover;

	const elementHover = buildElementHover(document, position, range, word);
	if (elementHover) return elementHover;

	return buildAttributeHover(position, range, word);
}
