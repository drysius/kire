import type { Kire } from "../kire";
import { QUOTED_STR_CHECK_REGEX } from "../utils/regex";

const normalizeSlotNameExpression = (value: any, fallback = '"default"') => {
	if (value === undefined || value === null || value === "") return fallback;
	if (typeof value !== "string") return JSON.stringify(String(value));
	const trimmed = value.trim();
	if (QUOTED_STR_CHECK_REGEX.test(trimmed) && /^(['"]).*\1$/.test(trimmed)) {
		return JSON.stringify(trimmed.slice(1, -1));
	}
	return `String(${trimmed})`;
};

export default (kire: Kire<any>) => {
	kire.directive({
		name: `slot`,
		signature: [`name:string`],
		children: true,
		description:
			"Captures a named slot block that will be exposed to the parent component render.",
		example: `@slot("header")\n  <h1>Dashboard</h1>\n@end`,
		onCall: (api) => {
			const nameExpr = normalizeSlotNameExpression(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const id = api.uid("slot");
			api.write(`{ const _oldRes${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
                const _slotName${id} = ${nameExpr};
                if (typeof $slots !== 'undefined') $slots[_slotName${id}] = $kire_response;
                $kire_response = _oldRes${id};
            }`);
		},
	});

	kire.directive({
		name: `yield`,
		signature: [`name:string`, `default:string`],
		children: false,
		description:
			"Outputs a named slot from the current component, falling back to the default value when missing.",
		example: `@yield("header", "<h1>Fallback</h1>")`,
		onCall: (api) => {
			const nameExpr = normalizeSlotNameExpression(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const def = api.getArgument(1) || api.getAttribute("default");
			api.write(`{
                const _slotName = ${nameExpr};
                const content = ($props.slots && $props.slots[_slotName]);
                if (content) {
                    $kire_response += content;
                } else {
                    $kire_response += ${def || "''"};
                }
            }`);
		},
	});

	kire.directive({
		name: "component",
		signature: ["path:string", "locals:object"],
		children: true,
		description:
			"Renders another Kire view as a component and exposes nested @slot blocks to it.",
		example: `@component("layouts.app", { title: "Dashboard" })\n  @slot("header")\n    <h1>Dashboard</h1>\n  @end\n@end`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => {
			const rawPath = api.getArgument(0) || api.getAttribute("path");
			const locals =
				api.getArgument(1) ||
				api.getAttribute("locals") ||
				"new this.NullProtoObj()";
			const id = api.uid("comp");
			const depId = api.depend(rawPath);
			const dep = api.getDependency(rawPath);

			api.write(`{
                const $slots = new this.NullProtoObj();
                const _oldRes${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
	                if (!$slots.default) $slots.default = $kire_response;
	                $kire_response = _oldRes${id};
	                const _oldProps${id} = $props;
	                $props = Object.assign(Object.create($globals), _oldProps${id}, ${locals}, { slots: $slots });
	                
	                const res${id} = ${depId}.call(this, $props, $globals, ${depId});
	                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}

	                $props = _oldProps${id};
	            }`);
		},
	});

	kire.directive({
		name: "layout",
		signature: ["path:string", "locals:object"],
		children: true,
		description:
			"Alias for @component(path, locals?). Commonly used for page layouts.",
		example: `@layout("layouts.app")\n  @section("content")\n    <p>Hello</p>\n  @end\n@end`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => kire.getDirective("component")?.onCall(api),
	});
	kire.directive({
		name: "extends",
		signature: ["path:string", "locals:object"],
		children: true,
		description:
			"Alias for @component(path, locals?). Mirrors Blade-style template inheritance naming.",
		example: `@extends("layouts.app")\n  @section("content")\n    <p>Hello</p>\n  @end\n@end`,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => kire.getDirective("component")?.onCall(api),
	});
	kire.directive({
		name: "section",
		signature: ["name:string"],
		children: true,
		description:
			"Alias for @slot(name). Useful with @layout and @extends blocks.",
		example: `@section("content")\n  <p>Hello</p>\n@end`,
		onCall: (api) => kire.getDirective("slot")?.onCall(api),
	});
};
