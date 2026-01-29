import type { Kire } from "../kire";
import type { DirectiveDefinition } from "../types";

export default (kire: Kire) => {
	const elseDirective: DirectiveDefinition = {
		name: "else",
		children: true,
		type: "html",
		description:
			"Renders a block of content if the preceding condition is false.",
		example: `@else\n  Alternative content.\n@end`,
		async onCall(compiler) {
			compiler.raw(`} else {`);
			if (compiler.children) await compiler.set(compiler.children);
		},
	};

	kire.directive({
		name: "if",
		params: ["cond:any"],
		children: true,
		type: "html",
		description:
			"Conditionally renders a block of content if the expression is true.",
		example: `@if(user.isLoggedIn)\n  Welcome, {{ user.name }}!\n@end`,
		parents: [
			{
				name: "elseif",
				params: ["cond:any"],
				children: true,
				type: "html",
				description:
					"Renders a block of content if the preceding @if/@elseif is false and the current expression is true.",
				example: `@elseif(user.isAdmin)\n  Admin access granted.\n@end`,
				async onCall(compiler) {
					compiler.raw(`} else if (${compiler.param("cond")}) {`);
					if (compiler.children) await compiler.set(compiler.children);
				},
			},
			{
				name: "elif", // alias for elseif
				params: ["cond:any"],
				children: true,
				type: "html",
				description: "Alias for @elseif.",
				example: `@elif(user.isAdmin)\n  Admin access granted.\n@end`,
				async onCall(compiler) {
					compiler.raw(`} else if (${compiler.param("cond")}) {`);
					if (compiler.children) await compiler.set(compiler.children);
				},
			},
			elseDirective,
		],
		async onCall(compiler) {
			compiler.raw(`if (${compiler.param("cond")}) {`);
			if (compiler.children) await compiler.set(compiler.children);
			if (compiler.parents) await compiler.set(compiler.parents);
			compiler.raw("}");
		},
	});

	kire.directive({
		name: "for",
		params: ["loop:$lhs {op:in/of} $rhs|statement:string"],
		children: true,
		type: "html",
		description:
			"Iterates over an array or object. Supports @empty block if no iterations occur.",
		example: `@for(user of users)\n  {{ user.name }}\n@empty\n  No users found\n@end`,
		parents: [
			{
				name: "empty",
				children: true,
				type: "html",
				description: "Renders if the loop had no iterations.",
				async onCall(compiler) {
					// Close the for loop and check the empty flag
					compiler.raw(`} if ($__empty) {`);
					if (compiler.children) await compiler.set(compiler.children);
				},
			},
			// We include 'else' here so the parser accepts it as a child of @for.
			// It points to the standard 'else' directive, but @for's onCall will hijack it.
			elseDirective,
		],
		async onCall(compiler) {
			const lhs = compiler.param("lhs");
			const rhs = compiler.param("rhs");
			const op = compiler.param("op");
			const statement = compiler.param("statement");

			// Flag to track if loop ran at least once
			// We use 'let' so it is block-scoped and handles nesting correctly via shadowing
			compiler.raw(`let $__empty = true;`);

			if (lhs && rhs && op) {
				// Pattern matched: user of users / key in object
				compiler.raw(`for (const ${lhs.trim()} ${op} ${rhs.trim()}) {`);
			} else if (statement) {
				// Fallback to standard C-style loop string
				compiler.raw(`for (${statement}) {`);
			} else {
				compiler.error("Invalid for loop syntax");
			}

			// Mark loop as not empty once inside
			compiler.raw(`$__empty = false;`);

			if (compiler.children) await compiler.set(compiler.children);

			if (compiler.parents) {
				// Hijack 'else' nodes and treat them as 'empty'
				// This avoids conflict with global @else directive used by @if
				compiler.parents.forEach((p) => {
					if (p.name === "else") p.name = "empty";
				});
				await compiler.set(compiler.parents);
			}

			// Close the block (matches either the for loop or the if($__empty))
			compiler.raw(`}`);
		},
	});

	kire.directive({
		name: "each",
		params: ["loop:$lhs {op:in/of} $rhs"],
		children: true,
		type: "html",
		description:
			"Iterates over an array or object. Alias for @for but focused on iteration. Supports @else block if no iterations occur.",
		example: `@each(user in users)\n  {{ user.name }}\n@else\n  No users found\n@end`,
		parents: [
            // We also support explicit @empty if desired, or just map else to empty logic
            {
				name: "empty",
				children: true,
				type: "html",
				description: "Renders if the loop had no iterations.",
				async onCall(compiler) {
					compiler.raw(`} if ($__empty) {`);
					if (compiler.children) await compiler.set(compiler.children);
				},
			},
            elseDirective,
		],
		async onCall(compiler) {
			const lhs = compiler.param("lhs");
			const rhs = compiler.param("rhs");
			const op = compiler.param("op");

			compiler.raw(`let $__empty = true;`);

			if (lhs && rhs && op) {
				compiler.raw(`for (const ${lhs.trim()} ${op} ${rhs.trim()}) {`);
			} else {
				compiler.error("Invalid each loop syntax. Expected @each(item in/of items)");
			}

			compiler.raw(`$__empty = false;`);

			if (compiler.children) await compiler.set(compiler.children);

			if (compiler.parents) {
                // Hijack 'else' nodes and treat them as 'empty'
				compiler.parents.forEach((p) => {
					if (p.name === "else") p.name = "empty";
				});
				await compiler.set(compiler.parents);
			}

			compiler.raw(`}`);
		},
	});

	kire.directive({
		name: "const",
		params: ["expr:string"],
		type: "html",
		description:
			"Declares a block-scoped constant, similar to JavaScript `const`.",
		example: `@const(myVar = 'hello world')`,
		onCall(compiler) {
			compiler.raw(`const ${compiler.param("expr")};`);
		},
	});

	kire.directive({
		name: "let",
		params: ["expr:string"],
		type: "html",
		description:
			"Declares a block-scoped local variable, similar to JavaScript `let`.",
		example: `@let(counter = 0)`,
		onCall(compiler) {
			compiler.raw(`let ${compiler.param("expr")};`);
		},
	});

	// Register case and default globally/independently so they are not treated as chained parents of switch
	kire.directive({
		name: "case",
		params: ["val:any"],
		children: true,
		type: "html",
		description: "A case clause for a @switch statement.",
		example: `@case('A')\n  <p>Value is A</p>\n@end`,
		async onCall(c) {
			// val:any allows strings, numbers, booleans, etc.
			// When compiled, we want literal values to be preserved.
			// However, parseArgs returns primitives for numbers/booleans and strings for strings.
			// If we JSON.stringify(number), we get string representation of number.
			// If we JSON.stringify(string), we get quoted string.
			// This matches JS 'case' syntax requirements.
			c.raw(`case ${JSON.stringify(c.param("val"))}: {`);
			if (c.children) await c.set(c.children);
			c.raw(`break; }`);
		},
	});

	kire.directive({
		name: "default",
		children: true,
		type: "html",
		description: "The default clause for a @switch statement.",
		example: `@default\n  <p>Value is something else</p>\n@end`,
		async onCall(c) {
			c.raw(`default: {`);
			if (c.children) await c.set(c.children);
			c.raw(`}`);
		},
	});

	kire.directive({
		name: "switch",
		params: ["expr:string"],
		children: true,
		type: "html",
		description:
			"Provides a control flow statement similar to a JavaScript switch block.",
		example: `@switch(value)\n  @case(1) ... @end\n  @default ... @end\n@end`,
		async onCall(compiler) {
			compiler.raw(`switch (${compiler.param("expr")}) {`);
			if (compiler.children) {
				// Filter only case/default nodes to avoid invalid JS (text nodes in switch block)
				const cases = compiler.children.filter(
					(n) => n.name === "case" || n.name === "default",
				);
				await compiler.set(cases);
			}
			compiler.raw(`}`);
		},
	});

	kire.directive({
		name: "csrf",
		type: "html",
		description: "Renders a CSRF token input field.",
		onCall(compiler) {
			compiler.raw(`
                if (typeof $ctx.$globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $ctx.$add(\`<input type="hidden" name="_token" value="\${$ctx.$globals.csrf}">\`);
            `);
		},
	});

	kire.directive({
		name: "method",
		params: ["method:string"],
		type: "html",
		description: "Spoofs an HTTP method using a hidden input.",
		onCall(compiler) {
			const method = compiler.param("method");
			compiler.res(`<input type="hidden" name="_method" value="${method}">`);
		},
	});

	kire.directive({
		name: "defer",
		children: true,
		type: "html",
		description:
			"Defers rendering of a block until the main content is loaded (Out-of-Order Streaming). Falls back to immediate rendering if streaming is disabled.",
		async onCall(compiler) {
			compiler.raw(`{`);

			compiler.raw(`const deferredRender = async ($ctx) => {`);
			if (compiler.children) await compiler.set(compiler.children);
			compiler.raw(`};`);

			compiler.raw(`if ($ctx.$kire.$stream) {`);
			compiler.raw(
				`  const deferId = 'defer-' + Math.random().toString(36).substr(2, 9);`,
			);
			compiler.raw(`  $ctx.$add(\`<div id="\${deferId}"></div>\`);`);

			compiler.raw(`  if (!$ctx.$deferred) $ctx.$deferred = [];`);
			compiler.raw(`  $ctx.$deferred.push(async () => {`);
			compiler.raw(`    const $parentCtx = $ctx;`);
			compiler.raw(`    {`);
			compiler.raw(`      const $ctx = $parentCtx.$fork();`);
			compiler.raw(`      let swapScript = '';`);
			compiler.raw(`      await $ctx.$merge(deferredRender);`);
			compiler.raw(`      const content = $ctx.$response;`);
			compiler.raw(`      $ctx.$response = '';`);
			compiler.raw(`      const templateId = 'tpl-' + deferId;`);
			compiler.raw(`      swapScript = \`
                <template id="\${templateId}">\${content}</template>
                <script>
                    (function() {
                        var src = document.getElementById('\${templateId}');
                        var dest = document.getElementById('\${deferId}');
                        if (src && dest) {
                            dest.replaceWith(src.content);
                            src.remove();
                        }
                    })();
                </script>
            \`;`);
			compiler.raw(`      $ctx.$add(swapScript);`);
			compiler.raw(`    }`);
			compiler.raw(`  });`);
			compiler.raw(`} else {`);
			compiler.raw(`  await deferredRender($ctx);`);
			compiler.raw(`}`);

			compiler.raw(`}`);
		},
	});
};
