import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `for`,
		signature: [`expr:any`],
		declares: [
			{
				fromArg: 0,
				pattern: "($item, $index) of $source",
				capture: ["item", "index"],
				type: "any",
			},
			{
				fromArg: 0,
				pattern: "($item, $index) in $source",
				capture: ["item", "index"],
				type: "any",
			},
			{ fromArg: 0, pattern: "$item of $source", capture: "item", type: "any" },
			{ fromArg: 0, pattern: "$item in $source", capture: "item", type: "any" },
			{ name: "$loop", type: "any" },
		],
		children: true,
		description:
			"Iterates arrays or objects using `item of source` or `(item, index) in source` syntax.",
		example: `@for(todo of todos)\n  <li>{{ todo.title }}</li>\n@end`,
		// closeBy removed
		scope: (args) => {
			const rawExpr = args[0] || "[]";
			const loopMatch = rawExpr.match(
				/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/,
			);
			if (loopMatch) {
				if (loopMatch[1])
					return [loopMatch[2].trim(), loopMatch[3].trim(), "$loop"];
				return [loopMatch[4].trim(), "index", "$loop"];
			}
			return ["item", "index", "$loop"];
		},
		onCall: (api) => {
			const rawExpr = api.getArgument(0) || api.getAttribute("expr") || "[]";
			const id = api.uid("i");
			const relatedNodes = api.node.related || [];
			const hasEmptyBranch = relatedNodes.some((n: any) => n?.name === "empty");

			let items = rawExpr;
			let finalAs = "item";
			let finalIndex = "index";

			const loopMatch = rawExpr.match(
				/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/,
			);

			if (loopMatch) {
				if (loopMatch[1]) {
					finalAs = loopMatch[2].trim();
					finalIndex = loopMatch[3].trim();
				} else {
					finalAs = loopMatch[4].trim();
				}
				items = loopMatch[5].trim();
			}

			const shouldExposeIndex =
				api.fullBody.includes(finalIndex) || api.allIdentifiers.has(finalIndex);
			const shouldExposeLoop =
				api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop");

			// The `if (_len > 0)` guard is only needed to pick the @empty/else branch.
			// Without one it is dead weight — the `while` already skips empty
			// collections — so omit it to match the leaner <kire:for> element codegen.
			api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id})
                    ? _r${id}
                    : (_r${id} && typeof _r${id} === "object" ? Object.keys(_r${id}) : []);
                const _len${id} = _it${id}.length;
                ${hasEmptyBranch ? `if (_len${id} > 0) {` : ""}
                    for (let ${id} = 0; ${id} < _len${id}; ${id}++) {
                        let ${finalAs} = _it${id}[${id}];
                        ${shouldExposeIndex ? `let ${finalIndex} = ${id};` : ""}
                        ${shouldExposeLoop ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
			api.renderChildren();
			api.write(`
                    }
                ${hasEmptyBranch ? `}` : ""}`);
			if (hasEmptyBranch) {
				api.write(` else {`);
				api.renderChildren(relatedNodes);
				api.write(`}`);
			}
			api.write(`
            }`);
		},
	});

	kire.directive({
		name: `each`,
		signature: [`items:any`, `as:string`],
		declares: [
			{ fromArg: 1, type: "any" },
			{ name: "index", type: "number" },
			{ name: "$loop", type: "any" },
		],
		children: true,
		description:
			"Iterates over a collection and exposes the current item under a chosen variable name.",
		example: `@each(todos, "todo")\n  <li>{{ todo.title }}</li>\n@end`,
		// closeBy removed
		scope: (args) => {
			const _items = args[0] || "[]";
			const as = args[1] || "item";
			return [as, "index", "$loop"];
		},
		onCall: (api) => {
			const forDir = kire.getDirective("for");
			if (forDir) forDir.onCall(api);
		},
	});

	// ── Blade-style loops: @foreach / @forelse ──────────────────────────────
	// `@foreach(collection as item)` or `@foreach(collection as key => value)`.
	// Unlike @for (which uses `item of source`), the source comes first and the
	// target(s) come after `as`, matching Laravel Blade.
	const parseForeach = (raw: string) => {
		const m = raw.match(/^\s*(.+?)\s+as\s+(.+?)\s*$/);
		if (!m) return null;
		const source = m[1]!.trim();
		const target = m[2]!.trim();
		const kv = target.match(/^(.+?)\s*=>\s*(.+)$/);
		if (kv) {
			return { source, key: kv[1]!.trim(), value: kv[2]!.trim() };
		}
		return { source, key: null as string | null, value: target };
	};

	const emitForeach = (api: any) => {
		const raw = api.getArgument(0) ?? api.getAttribute("expr") ?? "";
		const parsed = parseForeach(raw);
		if (!parsed) {
			// Fall back to @for semantics if the author used `of/in`.
			const forDir = kire.getDirective("for");
			if (forDir) forDir.onCall(api);
			return;
		}
		const { source, key, value } = parsed;
		const id = api.uid("fe");
		const relatedNodes = api.node.related || [];
		const hasEmptyBranch = relatedNodes.some((n: any) => n?.name === "empty");

		const exposeLoop =
			api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop");

		api.write(`{
            const _src${id} = ${source};
            const _arr${id} = Array.isArray(_src${id});
            const _keys${id} = _arr${id}
                ? null
                : (_src${id} && typeof _src${id} === "object" ? Object.keys(_src${id}) : []);
            const _len${id} = _arr${id} ? _src${id}.length : (_keys${id} ? _keys${id}.length : 0);
            ${hasEmptyBranch ? `if (_len${id} > 0) {` : ""}
                for (let _i${id} = 0; _i${id} < _len${id}; _i${id}++) {
                    const _k${id} = _arr${id} ? _i${id} : _keys${id}[_i${id}];
                    let ${value} = _src${id}[_k${id}];
                    ${key ? `let ${key} = _k${id};` : ""}
                    ${exposeLoop ? `let $loop = { index: _i${id}, first: _i${id} === 0, last: _i${id} === _len${id} - 1, length: _len${id} };` : ""}`);
		api.renderChildren();
		api.write(`
                }
            ${hasEmptyBranch ? `}` : ""}`);
		if (hasEmptyBranch) {
			api.write(` else {`);
			api.renderChildren(relatedNodes);
			api.write(`}`);
		}
		api.write(`
        }`);
	};

	const foreachDeclares = [
		{
			fromArg: 0,
			pattern: "$source as $value",
			capture: "value",
			type: "any",
		},
		{
			fromArg: 0,
			pattern: "$source as $key => $value",
			capture: ["key", "value"],
			type: "any",
		},
		{ name: "$loop", type: "any" },
	];

	const foreachScope = (args: any[]) => {
		const parsed = parseForeach(args[0] || "");
		if (!parsed) return ["item", "$loop"];
		return parsed.key
			? [parsed.key, parsed.value, "$loop"]
			: [parsed.value, "$loop"];
	};

	kire.directive({
		name: `foreach`,
		signature: [`expr:any`],
		declares: foreachDeclares,
		children: true,
		closeBy: [`endforeach`, `end`],
		description:
			"Blade-style loop over a collection: `@foreach(users as user)` or `@foreach(obj as key => value)`.",
		example: `@foreach(users as user)\n  <li>{{ user.name }}</li>\n@endforeach`,
		scope: foreachScope,
		onCall: emitForeach,
	});

	kire.directive({
		name: `forelse`,
		signature: [`expr:any`],
		declares: foreachDeclares,
		children: true,
		closeBy: [`endforelse`, `end`],
		description:
			"Blade-style loop with an @empty fallback branch for empty collections.",
		example: `@forelse(users as user)\n  <li>{{ user.name }}</li>\n@empty\n  <li>None</li>\n@endforelse`,
		scope: foreachScope,
		onCall: emitForeach,
	});

	// ── @while ───────────────────────────────────────────────────────────────
	kire.directive({
		name: `while`,
		signature: [`cond:any`],
		children: true,
		closeBy: [`endwhile`, `end`],
		description: "Repeats the block while the condition evaluates truthy.",
		example: `@while(hasMore())\n  <p>loop</p>\n@endwhile`,
		onCall: (api) => {
			const cond = api.getArgument(0) ?? api.getAttribute("cond");
			api.write(`while (${cond}) {`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	// ── @break / @continue (optionally conditional) ───────────────────────────
	kire.directive({
		name: `break`,
		signature: [`cond:any`],
		children: false,
		description:
			"Breaks out of the nearest loop, optionally only when a condition is truthy.",
		example: `@break\n@break(loop.index > 3)`,
		onCall: (api) => {
			const cond = api.getArgument(0);
			api.write(cond ? `if (${cond}) break;` : `break;`);
		},
	});

	kire.directive({
		name: `continue`,
		signature: [`cond:any`],
		children: false,
		description:
			"Skips to the next loop iteration, optionally only when a condition is truthy.",
		example: `@continue\n@continue(loop.first)`,
		onCall: (api) => {
			const cond = api.getArgument(0);
			api.write(cond ? `if (${cond}) continue;` : `continue;`);
		},
	});
};
