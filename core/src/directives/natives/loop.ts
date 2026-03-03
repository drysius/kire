import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `for`,
        params: [`expr:any`],
        children: true,
        // closeBy removed
        scope: (args) => {
            const rawExpr = args[0] || "[]";
            const loopMatch = rawExpr.match(/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/);
            if (loopMatch) {
                if (loopMatch[1]) return [loopMatch[2].trim(), loopMatch[3].trim(), '$loop'];
                return [loopMatch[4].trim(), 'index', '$loop'];
            }
            return ['item', 'index', '$loop'];
        },
        onCall: (api) => {
            const rawExpr = api.getAttribute("expr") || api.getArgument(0) || "[]";
            const id = api.uid("i");
            const relatedNodes = api.node.related || [];
            const hasEmptyBranch = relatedNodes.some((n: any) => n?.name === "empty");

            let items = rawExpr;
            let finalAs = "item";
            let finalIndex = "index";

            const loopMatch = rawExpr.match(/^\s*(?:(\(([^,]+)\s*,\s*([^)]+)\))|(.+?))\s+(?:of|in)\s+(.+)$/);
            
            if (loopMatch) {
                if (loopMatch[1]) {
                    finalAs = loopMatch[2].trim();
                    finalIndex = loopMatch[3].trim();
                } else {
                    finalAs = loopMatch[4].trim();
                }
                items = loopMatch[5].trim();
            }

            const shouldExposeIndex = api.fullBody.includes(finalIndex) || api.allIdentifiers.has(finalIndex);
            const shouldExposeLoop = api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop");

            api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id}) ? _r${id} : Object.entries(_r${id} || this.NullProtoObj);
                const _len${id} = _it${id}.length;
                if (_len${id} > 0) {
                    let ${id} = 0;
                    while (${id} < _len${id}) {
                        const _e${id} = _it${id}[${id}];
                        let ${finalAs} = Array.isArray(_r${id}) ? _e${id} : _e${id}[0];
                        ${shouldExposeIndex ? `let ${finalIndex} = ${id};` : ''}
                        ${shouldExposeLoop ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ''}`);
            api.renderChildren();
            api.write(`    ${id}++;
                    }
                }`);
            if (hasEmptyBranch) {
                api.write(` else {`);
                api.renderChildren(relatedNodes);
                api.write(`}`);
            }
            api.write(`
            }`);
        },
    });

    kire.directive({
        name: `each`,
        params: [`items:any`, `as:string`],
        children: true,
        // closeBy removed
        scope: (args) => {
            const items = args[0] || "[]";
            const as = args[1] || "item";
            return [as, 'index', '$loop'];
        },
        onCall: (api) => {
            const forDir = kire.getDirective("for");
            if (forDir) forDir.onCall(api);
        }
    });

};
