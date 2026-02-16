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
            let finalIndex = indexAs;

            // Regex para separar "item of items" ou "(item, index) of items"
            // Captura: 1=(item, index), 2=item, 3=index, 4=simple_item, 5=items
            const loopMatch = rawItems.match(/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/);
            
            if (loopMatch) {
                if (loopMatch[1]) {
                    // Formato (item, index)
                    finalAs = loopMatch[2].trim();
                    finalIndex = loopMatch[3].trim();
                } else {
                    // Formato simples
                    finalAs = loopMatch[4].trim();
                }
                items = loopMatch[5].trim();
            }

            api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || new NullProtoObj());
                const _len${id} = _it${id}.length;
                for (let ${id} = 0; ${id} < _len${id}; ${id}++) {
                    const _e${id} = _it${id}[${id}];
                    let ${finalAs} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                    let ${finalIndex} = ${id};
                    let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };`);
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
