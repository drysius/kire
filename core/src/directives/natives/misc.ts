import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
    kire.directive({
        name: "interface",
        params: ["shape_or_type:object|string", "global:boolean"],
        children: false,
        description:
            "Type-only directive for tooling. Does not render output. Use @interface(Type) for local typing or @interface({ user: Type }, true) for workspace-global typing in editors.",
        onCall: () => {
            // Intentionally noop at runtime. This directive exists for tooling/type hints only.
        },
    });

    kire.directive({
        name: `once`,
        children: true,
        onCall: (api) => {
            const id = api.uid("once");
            api.write(`if (!$globals['~once']) $globals['~once'] = new Set();`);
            api.write(`if (!$globals['~once'].has('${id}')) { 
                $globals['~once'].add('${id}');`);
            api.renderChildren();
            api.write(`}`);
        },
    });

    kire.directive({
        name: `error`,
        params: [`field:string`],
        children: true,
        closeBy: [`enderror`, `end`],
        scope: () => [`$message`],
        onCall: (api) => {
            const field = api.getArgument(0) ?? api.getAttribute("field");
            api.write(`if ($props.errors && $props.errors[${field}]) {
                $message = $props.errors[${field}];`);
            api.renderChildren();
            api.write(`}`);
        },
    });

    kire.directive({
        name: `csrf`,
        children: false,
        onCall: (api) => {
            api.write(`
                if (typeof $globals.csrf === 'undefined') {
                    throw new Error("CSRF token not defined. Please define it using kire.$global('csrf', 'token')");
                }
                $kire_response += \`<input type="hidden" name="_token" value="\${$globals.csrf}">\`;
            `);
        },
    });

    kire.directive({
        name: `method`,
        params: [`method:string`],
        children: false,
        onCall: (api) => {
            const method = api.getArgument(0) ?? api.getAttribute("method");
            api.write(`$kire_response += '<input type="hidden" name="_method" value="' + $escape(${method}) + '">';`);
        },
    });

    kire.directive({
        name: `const`,
        params: [`expr:string`],
        children: false,
        scope: (args) => {
            const expr = args[0] || "";
            const first = expr.split("=")[0];
            return first ? [first.trim()] : [];
        },
        onCall: (api) => {
            api.write(`${api.getArgument(0) ?? api.getAttribute("expr")};`);
        },
    });

    kire.directive({
        name: `let`,
        params: [`expr:string`],
        children: false,
        scope: (args) => {
            const expr = args[0] || "";
            const first = expr.split("=")[0];
            return first ? [first.trim()] : [];
        },
        onCall: (api) => {
            api.write(`${api.getArgument(0) ?? api.getAttribute("expr")};`);
        },
    });
};
