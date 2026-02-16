import type { Kire } from "../kire";
import { QUOTED_STR_CHECK_REGEX } from "../utils/regex";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `slot`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
            const id = api.uid("slot");
			api.write(`{ const _oldRes${id} = $ctx.$response; $ctx.$response = "";`);
            api.renderChildren();
            api.write(`
                if (typeof $slots !== 'undefined') $slots['${name}'] = $ctx.$response;
                $ctx.$response = _oldRes${id};
            }`);
		},
	});

	kire.directive({
		name: `yield`,
		params: [`name:string`, `default:string`],
        children: false,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
			const def = api.getAttribute("default");
			api.write(`{
                const content = ($ctx.slots && $ctx.slots['${name}']) || ($ctx.$props.slots && $ctx.$props.slots['${name}']);
                if (typeof content === 'function') {
                    const r = content(); if (r instanceof Promise) await r;
                } else if (content) {
                    $ctx.$response += content;
                } else {
                    $ctx.$response += ${def || "''"};
                }
            }`);
		},
	});

    kire.directive({
        name: 'component',
        params: ['path:string', 'locals:object'],
        children: true,
        onCall: (api) => {
            const path = api.getAttribute("path") || api.getArgument(0);
            const locals = api.getAttribute("locals") || api.getArgument(1) || "new NullProtoObj()";
            const id = api.uid("comp");
            const depId = api.depend(path);

            api.write(`{
                const $slots = new NullProtoObj();
                const _oldRes${id} = $ctx.$response; $ctx.$response = "";`);
            api.renderChildren();
            api.write(`
                if (!$slots.default) $slots.default = $ctx.$response;
                $ctx.$response = _oldRes${id};
                const _oldProps${id} = $ctx.$props;
                $ctx.$props = Object.assign(Object.create($ctx.$globals), _oldProps${id}, ${locals}, { slots: $slots });
                const _oldCtxSlots${id} = $ctx.slots;
                $ctx.slots = $slots;
                const _dep${id} = $deps['${depId}'];
                const res${id} = _dep${id}.execute($ctx, new NullProtoObj());
                if (_dep${id} && _dep${id}.isAsync) await res${id};
                $ctx.$props = _oldProps${id};
                $ctx.slots = _oldCtxSlots${id};
            }`);
        }
    });

    kire.directive({ name: 'layout', onCall: (api) => kire.getDirective('component')?.onCall(api) });
    kire.directive({ name: 'extends', onCall: (api) => kire.getDirective('component')?.onCall(api) });
    kire.directive({ name: 'section', onCall: (api) => kire.getDirective('slot')?.onCall(api) });
};
