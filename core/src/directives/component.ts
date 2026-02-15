import type { Kire } from "../kire";
import type { CompilerContext } from "../types";

export default (kire: Kire<any>) => {
	const slotDirective = {
		name: `slot`,
		params: [`name:string`],
		children: true,
		type: `html`,
		description: `Defines a named content slot within a component.`,
		example: `@slot('header')
  <h1>This is the header</h1>
@endslot`,
		onCall: (compiler: any) => {
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
		onCall: (compiler) => {
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
		onCall: (compiler: any) => {
			const pathExpr = compiler.param("path");
			const varsExpr = compiler.param("variables") || "{}";

            const renderComponent = (path: string, isStatic: boolean) => {
                const id = isStatic ? compiler.depend(path) : null;
                const ctxId = compiler.count('ctx');
                
                if (isStatic) compiler.raw(`const ${ctxId} = $ctx;`);
                
                compiler.raw(`{`);
                if (isStatic) {
                    compiler.raw(`  const $ctx = ${ctxId}.$fork().$emptyResponse();`);
                    compiler.raw(`  $ctx.slots = new $ctx.$kire.NullProtoObj();`);
                }
                compiler.raw(`  const $slots = ${isStatic ? '$ctx.slots' : 'new $ctx.$kire.NullProtoObj()'};`);

                if (kire.$stream) {
                    compiler.raw(`  $slots.default = async () => {`);
                    compiler.raw(`    const $parentSlots = $ctx.slots;`);
                    compiler.raw(`    $ctx.slots = $slots;`);
                    if (compiler.children) compiler.set(compiler.children);
                    compiler.raw(`    $ctx.slots = $parentSlots;`);
                    compiler.raw(`  };`);
                } else {
                    compiler.merge((c: CompilerContext) => {
                        c.raw(`    const $parentSlots = $ctx.slots;`);
                        c.raw(`    $ctx.slots = $slots;`);
                        if (c.children) c.set(c.children);
                        c.raw(`    if (!$slots.default) $slots.default = $ctx.$response;`);
                        c.raw(`    $ctx.$response = '';`);
                        c.raw(`    $ctx.slots = $parentSlots;`);
                    });
                }

                compiler.raw(`  const componentLocals = ${varsExpr};`);
                compiler.raw(`  const finalLocals = { ...componentLocals, slots: $slots };`);
                
                if (isStatic) {
                    compiler.raw(`  Object.assign($ctx.$props, finalLocals);`);
                    compiler.raw(`  await ${id}.execute.call($ctx.$props, $ctx, ${id}.dependencies);`);
                    compiler.raw(`  ${ctxId}.$response += $ctx.$response;`);
                } else {
                    const isAsync = kire.isAsync(path);
                    compiler.raw(
                        `  $ctx.$response += ${
                            isAsync ? "await " : ""
                        }$ctx.$require(${JSON.stringify(path)}, finalLocals) || "";`,
                    );
                }
                compiler.raw(`}`);
            };

            if (typeof pathExpr === 'string') {
                renderComponent(pathExpr, true);
            } else {
                renderComponent(pathExpr, false);
            }
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
