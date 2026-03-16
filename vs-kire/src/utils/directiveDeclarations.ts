import { scanDirectives } from "../core/directiveScan";
import { kireStore } from "../core/store";
import { parseParamDefinition } from "./params";

export interface DeclaredDirectiveVariable {
	name: string;
	start?: number;
	end?: number;
	directive: string;
	type?: string;
	description?: string;
	declarationKind?: "const" | "let" | "var";
	initializer?: string;
}

interface DeclareRuleLike {
	name?: string;
	type?: string;
	description?: string;
	fromArg?: number;
	fromAttribute?: string;
	pattern?: string;
	capture?: string | string[];
}

function isValidVariableName(name: string): boolean {
	return /^[$A-Z_a-z][$\w]*$/.test(name);
}

function normalizeScopeName(raw: string): string | undefined {
	const clean = raw.trim();
	if (!clean) return undefined;
	if (!isValidVariableName(clean)) return undefined;
	return clean;
}

function findDeclarationOffset(
	argValue: string,
	argStart: number,
	name: string,
): { start: number; end: number } | undefined {
	const pattern = new RegExp(
		`(^|[^$\\w])(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![$\\w])`,
	);
	const match = pattern.exec(argValue);
	if (!match || typeof match.index !== "number") return undefined;

	const relativeIndex = match.index + match[1]!.length;
	return {
		start: argStart + relativeIndex,
		end: argStart + relativeIndex + name.length,
	};
}

function mergeDeclaredVariable(
	target: Map<string, DeclaredDirectiveVariable>,
	entry: DeclaredDirectiveVariable,
) {
	const existing = target.get(entry.name);
	if (!existing) {
		target.set(entry.name, entry);
		return;
	}

	if (typeof existing.start !== "number") existing.start = entry.start;
	if (typeof existing.end !== "number") existing.end = entry.end;
	if (!existing.type && entry.type) existing.type = entry.type;
	if (!existing.description && entry.description)
		existing.description = entry.description;
	if (!existing.declarationKind && entry.declarationKind) {
		existing.declarationKind = entry.declarationKind;
	}
	if (!existing.initializer && entry.initializer)
		existing.initializer = entry.initializer;
}

function normalizeDeclaredType(type?: string): string | undefined {
	const clean = type?.trim();
	if (!clean) return undefined;
	return clean;
}

function parseSimpleAssignment(
	value: string | undefined,
): { name: string; initializer: string } | undefined {
	if (typeof value !== "string") return undefined;
	const match = /^\s*([$A-Z_a-z][$\w]*)\s*=\s*([\s\S]+?)\s*$/.exec(value);
	if (!match) return undefined;

	const name = normalizeScopeName(match[1]!);
	const initializer = match[2]!.trim();
	if (!name || !initializer) return undefined;
	return { name, initializer };
}

function collectDeclarationsFromDeclareRule(
	declared: Map<string, DeclaredDirectiveVariable>,
	rule: DeclareRuleLike,
	args: string[],
	directive: string,
): void {
	if (typeof rule.name === "string" && rule.name.trim()) {
		const name = normalizeScopeName(rule.name);
		if (name) {
			mergeDeclaredVariable(declared, {
				name,
				directive,
				type: normalizeDeclaredType(rule.type),
				description: rule.description,
			});
		}
		return;
	}

	const index = typeof rule.fromArg === "number" ? rule.fromArg : undefined;
	if (index === undefined) return;
	const source = args[index];
	if (typeof source !== "string") return;

	if (typeof rule.pattern === "string" && rule.pattern.trim()) {
		try {
			const parsed = parseParamDefinition(rule.pattern);
			const result = parsed.validate(source);
			if (!result.valid || !result.extracted) return;

			const captures = Array.isArray(rule.capture)
				? rule.capture
				: typeof rule.capture === "string"
					? [rule.capture]
					: Object.keys(result.extracted);

			for (const key of captures) {
				const extracted = result.extracted[key];
				if (typeof extracted !== "string") continue;
				const name = normalizeScopeName(extracted);
				if (!name) continue;
				mergeDeclaredVariable(declared, {
					name,
					directive,
					type: normalizeDeclaredType(rule.type),
					description: rule.description,
				});
			}
			return;
		} catch {
			return;
		}
	}

	const name = normalizeScopeName(source);
	if (!name) return;
	mergeDeclaredVariable(declared, {
		name,
		directive,
		type: normalizeDeclaredType(rule.type),
		description: rule.description,
	});
}

function collectDeclaredNames(
	declared: Map<string, DeclaredDirectiveVariable>,
	rules: DeclareRuleLike[] | undefined,
	args: string[],
	directive: string,
) {
	if (!Array.isArray(rules)) return;
	for (const rule of rules) {
		if (!rule || typeof rule !== "object") continue;
		collectDeclarationsFromDeclareRule(declared, rule, args, directive);
	}
}

export function extractTopLevelDirectiveDeclarations(
	text: string,
): DeclaredDirectiveVariable[] {
	const state = kireStore.getState();
	const engine = state.engine as {
		getDirective?: (name: string) => any;
	} | null;
	const directives = scanDirectives(text);
	const declared = new Map<string, DeclaredDirectiveVariable>();

	for (const call of directives) {
		const runtimeDef = engine?.getDirective?.(call.name);
		const schemaDef = state.directives.get(call.name);
		const children = runtimeDef?.children ?? schemaDef?.children;
		if (children) continue;

		const args = call.args.map((arg) => arg.value);
		const beforeCount = declared.size;

		collectDeclaredNames(declared, runtimeDef?.declares, args, call.name);
		collectDeclaredNames(declared, schemaDef?.declares, args, call.name);

		if (Array.isArray(runtimeDef?.exposes)) {
			for (const value of runtimeDef.exposes) {
				const name = normalizeScopeName(String(value));
				if (!name) continue;
				mergeDeclaredVariable(declared, { name, directive: call.name });
			}
		}

		if (Array.isArray(schemaDef?.exposes)) {
			for (const value of schemaDef.exposes) {
				const name = normalizeScopeName(String(value));
				if (!name) continue;
				mergeDeclaredVariable(declared, { name, directive: call.name });
			}
		}

		if (typeof runtimeDef?.scope === "function") {
			try {
				const result = runtimeDef.scope(args, undefined);
				if (Array.isArray(result)) {
					for (const value of result) {
						const name = normalizeScopeName(String(value));
						if (!name) continue;
						mergeDeclaredVariable(declared, { name, directive: call.name });
					}
				}
			} catch {}
		}

		const signature = Array.isArray(schemaDef?.signature)
			? schemaDef.signature
			: undefined;
		if (declared.size === beforeCount && Array.isArray(signature)) {
			for (let index = 0; index < signature.length; index++) {
				const rawParam = signature[index];
				const rawArg = call.args[index]?.value;
				if (typeof rawParam !== "string" || typeof rawArg !== "string")
					continue;

				try {
					const parsed = parseParamDefinition(rawParam);
					const result = parsed.validate(rawArg);
					if (!result.valid || !result.extracted) continue;

					for (const extracted of Object.values(result.extracted)) {
						const name = normalizeScopeName(String(extracted));
						if (!name) continue;
						mergeDeclaredVariable(declared, { name, directive: call.name });
					}
				} catch {}
			}
		}

		if (call.name === "const" || call.name === "let") {
			const assignment = parseSimpleAssignment(call.args[0]?.value);
			if (assignment) {
				mergeDeclaredVariable(declared, {
					name: assignment.name,
					directive: call.name,
					declarationKind: call.name,
					initializer: assignment.initializer,
					description:
						call.name === "const"
							? "Constant declared by @const."
							: "Variable declared by @let.",
				});
			}
		}

		for (const entry of Array.from(declared.values()).slice(beforeCount)) {
			const { name } = entry;
			let range: { start: number; end: number } | undefined;
			for (const arg of call.args) {
				range = findDeclarationOffset(arg.value, arg.start, name);
				if (range) break;
			}

			if (range) {
				entry.start = range.start;
				entry.end = range.end;
			}
		}
	}

	return Array.from(declared.values());
}
