import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `for`,
        params: [`items:any`, `as:string`, `index:string`],
        children: true,
        onCall: (api) => {
            const rawItems = api.getAttribute("items") || api.getArgument(0) || "[]";
            const as = api.getAttribute("as") || "item";
            const indexAs = api.getAttribute("index") || "index";
            const id = api.uid("i");

            let items = rawItems;
            let finalAs = as;
            if (typeof rawItems === 'string' && rawItems.includes(' of ')) {
                const parts = rawItems.split(' of ');
                finalAs = parts[0]!.trim();
                items = parts[1]!.trim();
            } else if (typeof rawItems === 'string' && rawItems.includes(' in ')) {
                 const parts = rawItems.split(' in ');
                 finalAs = parts[0]!.trim();
                 items = parts[1]!.trim();
            }

            api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || {});
                const _len${id} = _it${id}.length;
                for (let ${id} = 0; ${id} < _len${id}; ${id}++) {
                    const _e${id} = _it${id}[${id}];
                    ${finalAs} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                    ${indexAs} = ${id};
                    $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };`);
            api.renderChildren();
            api.write(`  }
            }`);
        },
    });

    kire.directive({
        name: `each`,
        params: [`items:any`, `as:string`],
        children: true,
        onCall: (api) => {
            const forDir = kire.getDirective("for");
            if (forDir) forDir.onCall(api);
        }
    });

    kire.directive({
        name: `empty`,
        children: true,
        onCall: (api) => {
            api.renderChildren();
        }
    });
};
