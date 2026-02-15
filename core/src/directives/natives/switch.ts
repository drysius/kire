import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `switch`,
        params: [`expr:any`],
        children: true,
        onCall: (api) => {
            const expr = api.getAttribute("expr");
            api.write(`switch (${api.transform(expr)}) {`);
            if (api.node.children) {
                const valid = api.node.children.filter((n: any) => n.type === "directive" && (n.name === "case" || n.name === "default"));
                api.renderChildren(valid);
            }
            api.write(`}`);
        },
    });

    kire.directive({
        name: `case`,
        params: [`val:any`],
        children: true,
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
        onCall: (api) => {
            api.write(`default: {`);
            api.renderChildren();
            api.write(`}`);
        },
    });
};
