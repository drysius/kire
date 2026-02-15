import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `isset`,
        params: [`expr:any`],
        children: true,
        onCall: (api) => {
            const expr = api.getAttribute("expr");
            api.write(`if (typeof ${api.transform(expr)} !== 'undefined' && ${api.transform(expr)} !== null) {`);
            api.renderChildren();
            api.write(`}`);
        },
    });

    kire.directive({
        name: `empty`,
        params: [`expr:any`],
        children: true,
        onCall: (api) => {
            const expr = api.getAttribute("expr");
            api.write(`if (!${api.transform(expr)} || (Array.isArray(${api.transform(expr)}) && ${api.transform(expr)}.length === 0)) {`);
            api.renderChildren();
            api.write(`}`);
        },
    });
};
