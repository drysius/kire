import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `for`,
        params: [`expr:any`],
        children: true,
        onCall: (api) => {
            const rawExpr = api.getAttribute("expr") || api.getArgument(0) || "[]";
            const id = api.uid("i");

            let items = rawExpr;
            let finalAs = "item";
            let finalIndex = "index";

            // Regex para separar "item of items" ou "(item, index) of items"
            const loopMatch = rawExpr.match(/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/);
            
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
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || this.NullProtoObj);
                const _len${id} = _it${id}.length;
                let ${id} = 0;
                while (${id} < _len${id}) {
                    const _e${id} = _it${id}[${id}];
                    let ${finalAs} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                    ${api.fullBody.includes('index') || api.allIdentifiers.has('index') ? `let ${finalIndex} = ${id};` : ''}
                    ${api.fullBody.includes('$loop') || api.allIdentifiers.has('$loop') ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ''}`);
            api.renderChildren();
            api.write(`    ${id}++;
                }
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
