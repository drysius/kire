import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `switch`,
        params: [`expr:any`],
        children: true,
        onCall: (api) => {
            const expr = api.getAttribute("expr");
            api.write(`switch (${api.transform(expr)}) {`);
            
            // In Kernel mode, related nodes (case/default) are stored in node.related
            if (api.node.related) {
                api.renderChildren(api.node.related);
            }
            
            api.write(`}`);
        },
    });

    kire.directive({
        name: `case`,
        params: [`val:any`],
        children: true,
        relatedTo: [`switch`, `case`, `default`],
        onCall: (api) => {
            const val = api.getAttribute("val");
            api.write(`case ${api.transform(val)}: {`);
            api.renderChildren();
            api.write(`  break; }`);
        },
    });

    kire.directive({
        name: `default`,
        children: true,
        relatedTo: [`switch`, `case`, `default`],
        onCall: (api) => {
            api.write(`default: {`);
            api.renderChildren();
            api.write(`}`);
        },
    });
};
