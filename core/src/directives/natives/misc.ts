import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: `once`,
        children: true,
        onCall: (api) => {
            const id = api.uid("once");
            api.write(`if (!$ctx['~once']) $ctx['~once'] = new Set();`);
            api.write(`if (!$ctx['~once'].has('${id}')) { 
                $ctx['~once'].add('${id}');`);
            api.renderChildren();
            api.write(`}`);
        },
    });

    kire.directive({
        name: `error`,
        params: [`field:string`],
        children: true,
        onCall: (api) => {
            const field = api.getAttribute("field");
            api.write(`if ($ctx.$props.errors && $ctx.$props.errors[${field}]) {
                $message = $ctx.$props.errors[${field}];`);
            api.renderChildren();
            api.write(`}`);
        },
    });

    kire.directive({
        name: `csrf`,
        children: false,
        onCall: (api) => {
            api.write(`
                if (typeof $ctx.$globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $ctx.$response += \`<input type="hidden" name="_token" value="\${$ctx.$globals.csrf}">\`;
            `);
        },
    });

    kire.directive({
        name: `method`,
        params: [`method:string`],
        children: false,
        onCall: (api) => {
            const method = api.getAttribute("method");
            api.append(`<input type="hidden" name="_method" value="\${$ctx.$escape(${method})}">`);
        },
    });

    kire.directive({
        name: `const`,
        params: [`expr:string`],
        children: false,
        onCall: (api) => {
            api.write(`${api.getAttribute("expr")};`);
        },
    });

    kire.directive({
        name: `let`,
        params: [`expr:string`],
        children: false,
        onCall: (api) => {
            api.write(`${api.getAttribute("expr")};`);
        },
    });
};
