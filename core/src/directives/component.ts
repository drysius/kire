import type { Kire } from "../kire";
import type { CompilerContext } from "../types";

export default (kire: Kire) => {
	const slotDirective = {
		name: `slot`,
		params: [`name:string`],
		children: true,
		type: `html`,
		description: `Defines a named content slot within a component.`,
		example: `@slot('header')
  <h1>This is the header</h1>
@endslot`,
		onCall(compiler: any) {
			const name = compiler.param("name");
			compiler.merge((c: CompilerContext) => {
				if (c.children) c.set(c.children);
				c.raw(`  $slots[${JSON.stringify(name)}] = $ctx.$response;`);
				c.raw(`  $ctx.$response = '';`);
			});
		},
	};

	kire.directive(slotDirective as never);

	kire.directive({
		...slotDirective,
		name: `section`,
		description: `Alias for @slot, commonly used in Laravel Blade.`,
        example: `@section('header')
  <h1>Header Content</h1>
@endsection`,
	} as never);

	kire.directive({
		name: `yield`,
		params: [`name:string`, `default?:string`],
		type: `html`,
		description: `Renders the content of a named slot.`,
		example: `@yield('header')`,
		onCall(compiler) {
			const name = compiler.param("name");
			const def = compiler.param("default");
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
		name: `component`,
		params: [`path:filepath`, `variables:any`],
		children: true,
		type: `html`,
		description: `Loads a template as a reusable component, allowing content to be passed into named slots.`,
		example: `@component('card', { title: 'My Card' })
  @slot('header')
    <h1>Card Header</h1>
  @endslot
  <p>Default content.</p>
@endcomponent`,
		onCall(compiler: any) {
			const pathExpr = compiler.param("path");
			const varsExpr = compiler.param("variables") || "{}";

			compiler.raw(`await (async () => {`);
			compiler.raw(`  const $slots = {};`);

			if (kire.$stream) {
				compiler.raw(`  $slots.default = async () => {`);
				compiler.raw(`    $ctx.slots = $slots;`);
				if (compiler.children) compiler.set(compiler.children);
				compiler.raw(`  };`);
			} else {
				compiler.merge((c: CompilerContext) => {
					c.raw(`    $ctx.slots = $slots;`);
					if (c.children) c.set(c.children);
					c.raw(`    if (!$slots.default) $slots.default = $ctx.$response;`);
					c.raw(`    $ctx.$response = '';`);
				});
			}

			compiler.raw(`  const path = ${JSON.stringify(pathExpr)};`);
			compiler.raw(`  const componentLocals = ${varsExpr};`);
			compiler.raw(`  const finalLocals = { ...componentLocals };`);
			compiler.raw(
				`  if (typeof finalLocals === 'object' && finalLocals !== null) finalLocals.slots = $slots;`,
			);

			const isAsync = kire.isAsync(pathExpr);
			compiler.raw(
				`  $ctx.$response += ${
					isAsync ? "await " : ""
				}$ctx.$require(path, finalLocals) || "";`,
			);

			compiler.raw(`})();`);
		},
	};

	kire.directive(componentDirective as never);

	kire.directive({
		...componentDirective,
		name: `layout`,
		description: `Alias for @component, typically used for wrapping content.`,
        example: `@layout('layouts.app')
  Content...
@endlayout`,
	} as never);

	kire.directive({
		...componentDirective,
		name: `extends`,
		description: `Alias for @component/layout, used for inheritance.`,
        example: `@extends('layouts.main')
  Content...
@endextends`,
	} as never);
};
