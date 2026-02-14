import type { Kire } from "../kire";

export default (kire: Kire) => {
	kire.directive({
		name: `define`,
		params: [`name:string`],
		children: true,
		type: `html`,
		description: `Defines a named, reusable section of content.`,
		example: `@define('header')
  <h1>My Website</h1>
@enddefine`,
		onCall(ctx) {
			const name = ctx.param("name");

			if (ctx.children) {
				ctx.merge((c) => {
					c.set(c.children!);
					c.raw(
						`  $ctx['~defines'][${JSON.stringify(name)}] = $ctx.$response;`,
					);
					c.raw(`  $ctx.$response = '';`);
				});
			}
		},
	});

	kire.directive({
		name: `defined`,
		params: [`name:string`],
		children: `auto`,
		type: `html`,
		description: `Renders defined content or fallback.`,
		example: `@defined('header')
  Conteúdo não encontrado
@enddefined`,
		onInit(ctx) {
			ctx["~defines"] = ctx["~defines"] || {};
		},
		onCall(ctx) {
			const name = ctx.param("name");

			if (ctx.children?.length) {
				ctx.res(`<kire:defined id=${JSON.stringify(name)}>`);
				ctx.set(ctx.children);
				ctx.res(`</kire:defined>`);
			} else {
				ctx.res(`<kire:defined id=${JSON.stringify(name)}></kire:defined>`);
			}
		},
	});

	kire.directive({
		name: `stack`,
		params: [`name:string`],
		type: `html`,
		description: `Creates a placeholder where content pushed to a named stack will be rendered.`,
		example: `<html>
<head>
  @stack('scripts')
</head>
</html>`,
		children: false,
		onCall(compiler) {
			const name = compiler.param("name");
			compiler.raw(
				`$ctx.$add("<!-- KIRE:stack(" + ${JSON.stringify(name)} + ") -->");`,
			);
		},
		onInit(ctx) {
			ctx["~stacks"] = ctx["~stacks"] || {};

			ctx.$on("after", async (c: any) => {
				const ctx = c as any;
				if (ctx["~stacks"]) {
					for (const key in ctx["~stacks"]) {
						const placeholder = `<!-- KIRE:stack(${key}) -->`;
						if (ctx.$response.includes(placeholder)) {
							const content = ctx["~stacks"][key].join("\n");
							ctx.$response = ctx.$response.split(placeholder).join(content);
						}
					}
					ctx.$response = ctx.$response.replace(
						/<!-- KIRE:stack\(.*?\) -->/g,
						"",
					);
				}
			});
		},
	});

	kire.directive({
		name: `push`,
		params: [`name:string`],
		children: true,
		type: `html`,
		description: `Pushes a block of content onto a named stack.`,
		example: `@push('scripts')
  <script src="app.js"></script>
@endpush`,
		onCall(compiler) {
			const name = compiler.param("name");
			compiler.raw(`if(!$ctx['~stacks']) $ctx['~stacks'] = {};`);
			compiler.raw(
				`if (!$ctx['~stacks'][${JSON.stringify(name)}]) $ctx['~stacks'][${JSON.stringify(name)}] = [];`,
			);
			compiler.merge((c) => {
				if (c.children) c.set(c.children);
				c.raw(
					`  $ctx['~stacks'][${JSON.stringify(name)}].push($ctx.$response);`,
				);
				c.raw(`  $ctx.$response = '';`);
			});
		},
	});
};
