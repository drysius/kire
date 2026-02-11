import type { Kire } from "../kire";

export default (kire: Kire) => {
	// @component('path', {vars}) ... @end
	// Uses slots.

	const slotDirective = {
		name: "slot",
		params: ["name:string"],
		children: true,
		type: "html",
		description: "Defines a named content slot within a component.",
		example: `@slot('header')\n  <h1>This is the header</h1>\n@end`,
		onCall(compiler: any) {
			const name = compiler.param("name");
			compiler.raw(`await $ctx.$merge(async ($ctx) => {`);
			if (compiler.children) compiler.set(compiler.children);
			compiler.raw(`  $slots[${JSON.stringify(name)}] = $ctx.$response;`);
			compiler.raw(`  $ctx.$response = '';`);
			compiler.raw(`});`);
		},
	};

	kire.directive(slotDirective as never);

	// Alias @section -> @slot
	kire.directive({
		...slotDirective,
		name: "section",
		description: "Alias for @slot, commonly used in Laravel Blade.",
	} as never);

	// @yield('name', 'default')
	kire.directive({
		name: "yield",
		params: ["name:string", "default?:string"],
		type: "html",
		description: "Renders the content of a named slot.",
		example: `@yield('header')`,
		onCall(compiler) {
			const name = compiler.param("name");
			const def = compiler.param("default");
			// Access $ctx.slots or $ctx.$props.slots
			compiler.raw(`{`);
			compiler.raw(
				`  const content = ($ctx.slots && $ctx.slots[${JSON.stringify(name)}]) || ($ctx.$props.slots && $ctx.$props.slots[${JSON.stringify(name)}]);`,
			);
			compiler.raw(`  if (typeof content === 'function') {`);
			compiler.raw(`    await content();`);
			compiler.raw(`  } else if (content) {`);
			compiler.raw(`    $ctx.$add(content);`);
			if (def) {
				compiler.raw(`  } else {`);
				compiler.raw(`    $ctx.$add(${JSON.stringify(def)});`);
			}
			compiler.raw(`  }`);
			compiler.raw(`}`);
		},
	});

	const componentDirective = {
		name: "component",
		params: ["path:filepath", "variables:any"],
		children: true,
		type: "html",
		description:
			"Loads a template as a reusable component, allowing content to be passed into named slots.",
		example: `@component('card', { title: 'My Card' })\n  @slot('header')\n    <h1>Card Header</h1>\n  @end\n  <p>Default content.</p>\n@end`,
		async onCall(compiler: any) {
			const pathExpr = compiler.param("path");
			const varsExpr = compiler.param("variables") || "{}";

			compiler.raw(`await (async () => {`);
			compiler.raw(`  const $slots = {};`);

			if (kire.$stream) {
				// Streaming Mode: Deferred Execution
				compiler.raw(`  $slots.default = async () => {`);
				compiler.raw(`    $ctx.slots = $slots;`); // Expose slots
				if (compiler.children) await compiler.set(compiler.children);
				compiler.raw(`  };`);
			} else {
				// Buffering Mode: Immediate Capture
				compiler.raw(`  await $ctx.$merge(async ($ctx) => {`);
				compiler.raw(`    $ctx.slots = $slots;`); // Still expose slots to children if they need it

				if (compiler.children) await compiler.set(compiler.children);

				compiler.raw(`    if (!$slots.default) $slots.default = $ctx.$response;`);
				compiler.raw(`    $ctx.$response = '';`); // Clear default content from parent stream
				compiler.raw(`  });`);
			}

			// Now load the component template and render it
			compiler.raw(`  const path = ${JSON.stringify(pathExpr)};`);
			compiler.raw(`  const componentLocals = ${varsExpr};`);

			compiler.raw(`  const finalLocals = { ...componentLocals };`);
			compiler.raw(
				`  if (typeof finalLocals === 'object' && finalLocals !== null) finalLocals.slots = $slots;`,
			); // Add slots to locals

			compiler.raw(`  const html = await $ctx.$require(path, finalLocals);`);
			compiler.raw(`  if (html !== null) {`);
			compiler.raw(`    $ctx.$add(html);`);
			compiler.raw(`  }`);

			compiler.raw(`})();`);
		},
	};

	kire.directive(componentDirective as never);

	// Alias @section -> @slot
	kire.directive({
		name: "section",
		params: ["name:string"],
		children: true,
		type: "html",
		description: "Alias for @slot, commonly used in Laravel Blade.",
		example: `@section('header')\n  <h1>Header</h1>\n@end`,
		onCall: (kire.getDirective("slot") as any).onCall,
	});

	// Alias @layout -> @component
	kire.directive({
		...componentDirective,
		name: "layout",
		description: "Alias for @component, typically used for wrapping content.",
	} as never);

	// Alias @extends -> @component
	kire.directive({
		...componentDirective,
		name: "extends",
		description: "Alias for @component/layout, used for inheritance.",
	} as never);
};
