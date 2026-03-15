import type { Kire } from "../kire";
import { QUOTED_STR_CHECK_REGEX } from "../utils/regex";

const normalizeSlotNameExpression = (value: any, fallback = '"default"') => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return JSON.stringify(String(value));
    const trimmed = value.trim();
    if (QUOTED_STR_CHECK_REGEX.test(trimmed) && /^(['"]).*\1$/.test(trimmed)) {
        return JSON.stringify(trimmed.slice(1, -1));
    }
    return `String(${trimmed})`;
};

export default (kire: Kire<any>) => {
	kire.directive({
		name: `slot`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			const nameExpr = normalizeSlotNameExpression(api.getArgument(0) || api.getAttribute("name"));
            const id = api.uid("slot");
			api.write(`{ const _oldRes${id} = $kire_response; $kire_response = "";`);
            api.renderChildren();
            api.write(`
                const _slotName${id} = ${nameExpr};
                if (typeof $slots !== 'undefined') $slots[_slotName${id}] = $kire_response;
                $kire_response = _oldRes${id};
            }`);
		},
	});

	kire.directive({
		name: `yield`,
		params: [`name:string`, `default:string`],
        children: false,
		onCall: (api) => {
			const nameExpr = normalizeSlotNameExpression(api.getArgument(0) || api.getAttribute("name"));
			const def = api.getArgument(1) || api.getAttribute("default");
			api.write(`{
                const _slotName = ${nameExpr};
                const content = ($props.slots && $props.slots[_slotName]);
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
        isDependency: (args) => {
            const rawPath = args[0];
            if (typeof rawPath === 'string') {
                return [rawPath.replace(/['"]/g, '')];
            }
            return [];
        },
        onCall: (api) => {
            const rawPath = api.getArgument(0) || api.getAttribute("path");
            const locals = api.getArgument(1) || api.getAttribute("locals") || "new this.NullProtoObj()";
            const id = api.uid("comp");
            const depId = api.depend(rawPath);
            const dep = api.getDependency(rawPath);

            api.write(`{
                const $slots = new this.NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
            api.renderChildren();
            api.write(`
                if (!$slots.default) $slots.default = $kire_response;
                $kire_response = _oldRes${id};
                const _oldProps${id} = $props;
                $props = Object.assign(Object.create($globals), _oldProps${id}, ${locals}, { slots: $slots });
                
                const _dep${id} = ${depId};
                const res${id} = _dep${id}.call(this, $props, $globals, _dep${id});
                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}

                $props = _oldProps${id};
            }`);
        }
    });

    kire.directive({ 
        name: 'layout', 
        children: true,
        isDependency: (args) => {
            const rawPath = args[0];
            if (typeof rawPath === 'string') {
                return [rawPath.replace(/['"]/g, '')];
            }
            return [];
        },
        onCall: (api) => kire.getDirective('component')?.onCall(api) 
    });
    kire.directive({ 
        name: 'extends', 
        children: true,
        isDependency: (args) => {
            const rawPath = args[0];
            if (typeof rawPath === 'string') {
                return [rawPath.replace(/['"]/g, '')];
            }
            return [];
        },
        onCall: (api) => kire.getDirective('component')?.onCall(api) 
    });
    kire.directive({ 
        name: 'section', 
        children: true,
        onCall: (api) => kire.getDirective('slot')?.onCall(api) 
    });
};
