import type { Kire } from "../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `include`,
        params: [`path:string`, `locals:object`],
        children: false, // CORREÇÃO: SEM FILHOS
        onCall: (api) => {
            const path = api.getAttribute("path") || api.getArgument(0);
            const locals = api.getAttribute("locals") || api.getArgument(1) || "{}";

            if (!path) return;

            const depId = api.depend(path);
            
            api.write(`{
                const _oldProps = $ctx.$props;
                $ctx.$props = Object.assign(Object.create($ctx.$globals), _oldProps, ${locals});
                const res = $deps['${depId}']($ctx, {}); 
                if (res instanceof Promise) await res;
                $ctx.$props = _oldProps;
            }`);
        },
    });
};
