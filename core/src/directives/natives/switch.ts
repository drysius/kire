import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `switch`,
        signature: [`expr:any`],
        children: true,
        onCall: (api) => {
            const expr = api.getArgument(0) ?? api.getAttribute("expr");
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
        signature: [`val:any`],
        children: true,
        relatedTo: [`switch`, `case`, `default`],
        onCall: (api) => {
            const val = api.getArgument(0) ?? api.getAttribute("val");
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

