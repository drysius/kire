import type { Kire } from "../kire";
import { QUOTED_STR_CHECK_REGEX } from "../utils/regex";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `slot`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			let name = api.getAttribute("name") || api.getArgument(0);
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
            const id = api.uid("slot");
			api.write(`{ const _oldRes${id} = $kire_response; $kire_response = "";`);
            api.renderChildren();
            api.write(`
                if (typeof $slots !== 'undefined') $slots['${name}'] = $kire_response;
                $kire_response = _oldRes${id};
            }`);
		},
	});

	kire.directive({
		name: `yield`,
		params: [`name:string`, `default:string`],
        children: false,
		onCall: (api) => {
			let name = api.getAttribute("name") || api.getArgument(0);
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
			const def = api.getAttribute("default") || api.getArgument(1);
			api.write(`{
                const content = ($props.slots && $props.slots['${name}']);
                if (content) {
                    $kire_response += content;
                } else {
                    $kire_response += ${def || "''"};
                }
            }`);
		},
	});

    kire.directive({
        name: 'component',
        params: ['path:string', 'locals:object'],
        children: true,
        onCall: (api) => {
            const rawPath = api.getAttribute("path") || api.getArgument(0);
            const locals = api.getAttribute("locals") || api.getArgument(1) || "new NullProtoObj()";
            const id = api.uid("comp");
            const depId = api.depend(rawPath);
            const dep = api.getDependency(rawPath);

            api.write(`{
                const $slots = new NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
            api.renderChildren();
            api.write(`
                if (!$slots.default) $slots.default = $kire_response;
                $kire_response = _oldRes${id};
                const _oldProps${id} = $props;
                $props = Object.assign(Object.create($globals), _oldProps${id}, ${locals}, { slots: $slots });
                
                const _dep${id} = ${depId};
                const res${id} = _dep${id}.call(this, $props, $globals);
                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}

                $props = _oldProps${id};
            }`);
        }
    });

    kire.directive({ name: 'layout', onCall: (api) => kire.getDirective('component')?.onCall(api) });
    kire.directive({ name: 'extends', onCall: (api) => kire.getDirective('component')?.onCall(api) });
    kire.directive({ name: 'section', onCall: (api) => kire.getDirective('slot')?.onCall(api) });
};
