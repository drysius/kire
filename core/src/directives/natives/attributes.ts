import type { Kire } from "../../kire";

export default (kire: Kire) => {
	kire.directive({
		name: `attr`,
		signature: [`name:string`, `value:any`],
		description:
			"Appends a single HTML attribute when the value is not null, undefined or false.",
		example: `@attr("data-id", item.id)`,
		onCall(api) {
			const name = api.getArgument(0) ?? api.getAttribute("name");
			const value = api.getArgument(1) ?? api.getAttribute("value");
			api.write(`{
                const $name = ${name};
                const $value = ${value};
                if ($name && $value !== false && $value !== null && $value !== undefined) {
                    if ($value === true) $kire_response += " " + $name;
                    else $kire_response += " " + $name + "=\\"" + $escape($value) + "\\"";
                }
            }`);
		},
	});

	kire.directive({
		name: `attrs`,
		signature: [`attributes:any`],
		description:
			"Appends many HTML attributes from an object, array or string shorthand.",
		example: `@attrs({ class: "btn", disabled: isSaving })`,
		onCall(api) {
			const attributes =
				api.getArgument(0) ??
				api.getAttribute("attributes") ??
				api.getAttribute("attrs");
			api.write(`{
                const $attrs = ${attributes};
                const $append = ($name, $value) => {
                    const $clean = String($name || "").trim();
                    if (!$clean || $value === false || $value === null || $value === undefined) return;
                    if ($value === true) $kire_response += " " + $clean;
                    else $kire_response += " " + $clean + "=\\"" + $escape($value) + "\\"";
                };
                const $walk = ($value) => {
                    if (!$value) return;
                    if (typeof $value === "string") {
                        $append($value, true);
                        return;
                    }
                    if (Array.isArray($value)) {
                        for (let $i = 0; $i < $value.length; $i++) $walk($value[$i]);
                        return;
                    }
                    if (typeof $value === "object") {
                        for (const [$name, $entry] of Object.entries($value)) {
                            $append($name, $entry);
                        }
                    }
                };
                $walk($attrs);
            }`);
		},
	});

	kire.directive({
		name: `class`,
		signature: [`classes:any`],
		description:
			"Builds a `class` attribute from strings, arrays or keyed objects.",
		example: `@class(["btn", { "btn-primary": isPrimary }])`,
		onCall(api) {
			const classes = api.getArgument(0) ?? api.getAttribute("classes");
			api.write(`{
                const $input = ${classes};
                const $tokens = [];
                const $push = ($value) => {
                    if (!$value) return;
                    if (typeof $value === "string") {
                        const $trimmed = $value.trim();
                        if ($trimmed) $tokens.push($trimmed);
                        return;
                    }
                    if (Array.isArray($value)) {
                        for (let $i = 0; $i < $value.length; $i++) $push($value[$i]);
                        return;
                    }
                    if (typeof $value === "object") {
                        for (const [$name, $enabled] of Object.entries($value)) {
                            if ($enabled) $tokens.push($name);
                        }
                        return;
                    }
                    const $string = String($value || "").trim();
                    if ($string) $tokens.push($string);
                };
                $push($input);
                const $classValue = $tokens.join(" ").trim();
                if ($classValue) $kire_response += " class=\\"" + $escape($classValue) + "\\"";
            }`);
		},
	});

	kire.directive({
		name: `style`,
		signature: [`styles:any`],
		description:
			"Builds a `style` attribute from strings, arrays or keyed objects.",
		example: `@style({ color: accent, display: isOpen && "block" })`,
		onCall(api) {
			const styles = api.getArgument(0) ?? api.getAttribute("styles");
			api.write(`{
                const $s = ${styles};
                let $r = "";
                if (Array.isArray($s)) $r = $s.filter(Boolean).join("; ");
                else if (typeof $s === 'object' && $s !== null) $r = Object.entries($s).filter(([_, v]) => v).map(([k, v]) => v === true ? k : k + ": " + v).join("; ");
                else $r = String($s || "");
                if ($r) $kire_response += " style=\\"" + $escape($r) + "\\"";
            }`);
		},
	});

	const booleanAttrs = [
		"checked",
		"selected",
		"disabled",
		"readonly",
		"required",
	];
	for (const attr of booleanAttrs) {
		kire.directive({
			name: attr,
			signature: [`cond:any`],
			description: `Outputs the boolean attribute \`${attr}\` when the condition is truthy.`,
			example: `@${attr}(condition)`,
			onCall(api) {
				const cond = api.getArgument(0) ?? api.getAttribute("cond");
				api.write(`if (${cond}) $kire_response += ' ${attr} ';`);
			},
		});
	}
};
