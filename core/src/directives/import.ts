import type { Kire } from "../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `include`,
        params: [`path:string`, `locals:object`],
        children: false, 
        onCall: (api) => {
            const rawPath = api.getAttribute("path") || api.getArgument(0);
            const locals = api.getAttribute("locals") || api.getArgument(1) || "new NullProtoObj()";

            if (!rawPath) return;

            const depId = api.depend(rawPath);
            const dep = api.getDependency(rawPath);
            
            api.write(`{
                const _oldProps = $props;
                $props = Object.assign(Object.create($globals), _oldProps, ${locals});
                const _dep = ${depId};
                const res = _dep.call(this, $props, $globals); 
                ${dep.meta.async ? `$kire_response += await res;` : `$kire_response += res;`}
                $props = _oldProps;
            }`);
        },
    });
};
