import type { Kire } from "../kire";

interface PropDecl {
	name: string;
	/** Default expression, or null when the prop was declared without one. */
	default: string | null;
}

// Split `s` on top-level occurrences of `sep`, respecting nesting and strings.
function splitTopLevel(s: string, sep: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let quote: string | null = null;
	let start = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (quote) {
			if (c === quote && s[i - 1] !== "\\") quote = null;
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			quote = c;
		} else if (c === "(" || c === "[" || c === "{") {
			depth++;
		} else if (c === ")" || c === "]" || c === "}") {
			depth--;
		} else if (c === sep && depth === 0) {
			out.push(s.slice(start, i));
			start = i + 1;
		}
	}
	out.push(s.slice(start));
	return out;
}

const unquote = (s: string) => {
	const t = s.trim();
	if (/^(['"`]).*\1$/.test(t)) return t.slice(1, -1);
	return t;
};

// Parse an @props/@aware argument: an array of names `["a","b"]` or an object of
// name → default `{ a: 1, b: "x" }`.
function parsePropDecls(raw: string): PropDecl[] {
	const trimmed = (raw || "").trim();
	if (!trimmed) return [];
	const inner = trimmed.slice(1, -1).trim();
	if (!inner) return [];

	if (trimmed.startsWith("[")) {
		return splitTopLevel(inner, ",")
			.map((e) => unquote(e))
			.filter(Boolean)
			.map((name) => ({ name, default: null }));
	}

	if (trimmed.startsWith("{")) {
		const decls: PropDecl[] = [];
		for (const entry of splitTopLevel(inner, ",")) {
			if (!entry.trim()) continue;
			// Split on the first top-level colon → key : defaultExpr
			const parts = splitTopLevel(entry, ":");
			const name = unquote(parts[0]!);
			const def = parts.length > 1 ? parts.slice(1).join(":").trim() : null;
			if (name) decls.push({ name, default: def || null });
		}
		return decls;
	}

	// Bare single name.
	return [{ name: unquote(trimmed), default: null }];
}

export default (kire: Kire<any>) => {
	// Make `$attributes` always available (and mutable) in any template that uses
	// it, defaulting to an empty bag when the view is rendered without a caller.
	// Not `unique`: each component (compiled as a dependency) must declare its own
	// `$attributes` locally rather than inherit the parent's via closure scope.
	kire.existVar(
		"$attributes",
		(api) => {
			api.prologue(
				`let $attributes = $props['$attributes'] ?? this.createAttributes(new this.NullProtoObj());`,
			);
		},
		false,
	);

	const makePropsDirective = (name: string, strip: boolean) =>
		kire.directive({
			name,
			signature: [`props:object|array`],
			children: false,
			declares: [],
			description:
				name === "props"
					? "Declares a component's accepted props with optional defaults; remaining attributes stay in `$attributes`."
					: "Declares props whose values are inherited from the parent component scope when not provided.",
			example:
				name === "props"
					? `@props({ type: "info", dismissible: false })`
					: `@aware({ color: "red" })`,
			scope: (args) => parsePropDecls(args[0] || "").map((d) => d.name),
			onCall: (api) => {
				const raw = api.getArgument(0) ?? api.getAttribute("props") ?? "";
				const decls = parsePropDecls(raw);
				if (decls.length === 0) return;

				for (const { name: propName, default: def } of decls) {
					const key = JSON.stringify(propName);
					if (def !== null) {
						api.write(
							`let ${propName} = ($props[${key}] !== undefined ? $props[${key}] : (${def}));`,
						);
					} else {
						api.write(`let ${propName} = $props[${key}];`);
					}
				}

				if (strip) {
					const names = decls.map((d) => JSON.stringify(d.name)).join(", ");
					api.write(
						`if (typeof $props['$attributes'] !== 'undefined' && $props['$attributes'] && $props['$attributes'].forget) { $props['$attributes'].forget([${names}]); }`,
					);
				}
			},
		});

	makePropsDirective("props", true);
	makePropsDirective("aware", false);
};
