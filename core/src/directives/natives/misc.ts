import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: "interface",
		signature: ["shape_or_type:object|string", "global:boolean"],
		children: false,
		description:
			"Type-only directive for tooling. Does not render output. Use @interface(Type) for local typing or @interface({ user: Type }, true) for workspace-global typing in editors.",
		example: `@interface({ user: AppUser, posts: Post[] }, true)`,
		onCall: () => {
			// Intentionally noop at runtime. This directive exists for tooling/type hints only.
		},
	});

	kire.directive({
		name: `once`,
		children: true,
		description:
			"Ensures the wrapped block is rendered only once per render cycle.",
		example: `@once\n  <script src="/app.js"></script>\n@end`,
		onCall: (api) => {
			const id = api.uid("once");
			api.write(`if (!$globals['~once']) $globals['~once'] = new Set();`);
			api.write(`if (!$globals['~once'].has('${id}')) { 
                $globals['~once'].add('${id}');`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	kire.directive({
		name: `error`,
		signature: [`field:string`],
		declares: [
			{
				name: "$message",
				type: "string",
				description:
					"Validation message exposed inside the current @error block.",
			},
		],
		children: true,
		closeBy: [`enderror`, `end`],
		description:
			"Renders the block when the selected field has a validation error and exposes `$message` inside it.",
		example:
			`@error("email")\n  <span class="error">{{ $message }}</span>\n@end`,
		scope: () => [`$message`],
		onCall: (api) => {
			const field = api.getArgument(0) ?? api.getAttribute("field");
			api.write(`if ($props.errors && $props.errors[${field}]) {
                $message = $props.errors[${field}];`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	kire.directive({
		name: `csrf`,
		children: false,
		description:
			"Outputs a hidden CSRF token input using the global `csrf` value.",
		example: `@csrf()`,
		onCall: (api) => {
			api.write(`
                if (typeof $globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $kire_response += \`<input type="hidden" name="_token" value="\${$globals.csrf}">\`;
            `);
		},
	});

	kire.directive({
		name: `method`,
		signature: [`method:string`],
		children: false,
		description:
			"Outputs a hidden `_method` input for HTTP verb spoofing in forms.",
		example: `@method("PUT")`,
		onCall: (api) => {
			const method = api.getArgument(0) ?? api.getAttribute("method");
			api.write(
				`$kire_response += '<input type="hidden" name="_method" value="' + $escape(${method}) + '">';`,
			);
		},
	});

	kire.directive({
		name: `const`,
		signature: [`expr:string`],
		declares: [
			{
				fromArg: 0,
				pattern: "$name = $value",
				capture: "name",
				type: "any",
				description: "Constant declared by @const.",
			},
		],
		children: false,
		description:
			"Declares a constant expression that becomes available to later template expressions.",
		example: `@const(title = "Dashboard")`,
		scope: (args) => {
			const expr = args[0] || "";
			const first = expr.split("=")[0];
			return first ? [first.trim()] : [];
		},
		onCall: (api) => {
			api.write(`${api.getArgument(0) ?? api.getAttribute("expr")};`);
		},
	});

	kire.directive({
		name: `let`,
		signature: [`expr:string`],
		declares: [
			{
				fromArg: 0,
				pattern: "$name = $value",
				capture: "name",
				type: "any",
				description: "Variable declared by @let.",
			},
		],
		children: false,
		description:
			"Declares a mutable variable expression that becomes available to later template expressions.",
		example: `@let(count = items.length)`,
		scope: (args) => {
			const expr = args[0] || "";
			const first = expr.split("=")[0];
			return first ? [first.trim()] : [];
		},
		onCall: (api) => {
			api.write(`${api.getArgument(0) ?? api.getAttribute("expr")};`);
		},
	});
};
