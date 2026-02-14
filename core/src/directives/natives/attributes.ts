import type { Kire } from "../../kire";

export default (kire: Kire) => {
    kire.directive({
        name: `class`,
        params: [`classes:any`],
        type: `html`,
        description: `Conditionally adds CSS classes. Accepts a string, array, or object.`,
        example: `<div @class(['p-4', 'active' => $isActive])></div>`,
        onCall(compiler) {
            const classes = compiler.param("classes");
            compiler.raw(`{
                const $c = ${classes};
                let $res = "";
                if (Array.isArray($c)) {
                    $res = $c.filter(Boolean).join(" ");
                } else if (typeof $c === 'object' && $c !== null) {
                    $res = Object.entries($c).filter(([_, v]) => v).map(([k]) => k).join(" ");
                } else {
                    $res = String($c || "");
                }
                if ($res) $ctx.$add(\` class="\${$ctx.$escape($res)}" \`);
            }`);
        },
    });

    kire.directive({
        name: `style`,
        params: [`styles:any`],
        type: `html`,
        description: `Conditionally adds inline styles. Accepts a string, array, or object.`,
        example: `<div @style(['color: red', 'font-weight: bold' => $isBold])></div>`,
        onCall(compiler) {
            const styles = compiler.param("styles");
            compiler.raw(`{
                const $s = ${styles};
                let $res = "";
                if (Array.isArray($s)) {
                    $res = $s.filter(Boolean).join("; ");
                } else if (typeof $s === 'object' && $s !== null) {
                    $res = Object.entries($s).filter(([_, v]) => v).map(([k, v]) => v === true ? k : \`\${k}: \${v}\`).join("; ");
                } else {
                    $res = String($s || "");
                }
                if ($res) $ctx.$add(\` style="\${$ctx.$escape($res)}" \`);
            }`);
        },
    });

    const booleanAttrs = ["checked", "selected", "disabled", "readonly"];
    for (const attr of booleanAttrs) {
        kire.directive({
            name: attr,
            params: [`cond:any`],
            type: `html`,
            description: `Conditionally adds the ${attr} attribute.`,
            example: `<input type="checkbox" @${attr}($isActive)>`,
            onCall(compiler) {
                const cond = compiler.param("cond");
                compiler.raw(`if (${cond}) $ctx.$add(' ${attr} ');`);
            },
        });
    }
};
