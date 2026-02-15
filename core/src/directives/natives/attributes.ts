import type { Kire } from "../../kire";

export default (kire: Kire) => {
    kire.directive({
        name: `class`,
        params: [`classes:any`],
        onCall(api) {
            const classes = api.getAttribute("classes");
            api.write(`{
                const $c = ${classes};
                let $r = "";
                if (Array.isArray($c)) $r = $c.filter(Boolean).join(" ");
                else if (typeof $c === 'object' && $c !== null) $r = Object.entries($c).filter(([_, v]) => v).map(([k]) => k).join(" ");
                else $r = String($c || "");
                if ($r) $ctx.$response += " class=\\"" + $ctx.$escape($r) + "\\"";
            }`);
        },
    });

    kire.directive({
        name: `style`,
        params: [`styles:any`],
        onCall(api) {
            const styles = api.getAttribute("styles");
            api.write(`{
                const $s = ${styles};
                let $r = "";
                if (Array.isArray($s)) $r = $s.filter(Boolean).join("; ");
                else if (typeof $s === 'object' && $s !== null) $r = Object.entries($s).filter(([_, v]) => v).map(([k, v]) => v === true ? k : k + ": " + v).join("; ");
                else $r = String($s || "");
                if ($r) $ctx.$response += " style=\\"" + $ctx.$escape($r) + "\\"";
            }`);
        },
    });

    const booleanAttrs = ["checked", "selected", "disabled", "readonly"];
    for (const attr of booleanAttrs) {
        kire.directive({
            name: attr,
            params: [`cond:any`],
            onCall(api) {
                const cond = api.getAttribute("cond");
                api.write(`if (${cond}) $ctx.$response += ' ${attr} ';`);
            },
        });
    }
};
