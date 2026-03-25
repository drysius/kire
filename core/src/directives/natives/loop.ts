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

			api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id})
                    ? _r${id}
                    : (_r${id} && typeof _r${id} === "object" ? Object.keys(_r${id}) : []);
                const _len${id} = _it${id}.length;
                if (_len${id} > 0) {
                    let ${id} = 0;
                    while (${id} < _len${id}) {
                        let ${finalAs} = _it${id}[${id}];
                        ${shouldExposeIndex ? `let ${finalIndex} = ${id};` : ""}
                        ${shouldExposeLoop ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
			api.renderChildren();
			api.write(`
                        ${id}++;
                    }
                }`);
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
};
