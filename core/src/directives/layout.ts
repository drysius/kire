import type { Kire } from "../kire";
import { QUOTED_STR_CHECK_REGEX } from "../utils/regex";

const normalizeStackNameLiteral = (value: any, fallback = "") => {
	if (value === undefined || value === null || value === "") return fallback;
	if (typeof value !== "string") return String(value);
	const trimmed = value.trim();
	if (QUOTED_STR_CHECK_REGEX.test(trimmed) && /^(['"]).*\1$/.test(trimmed)) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
};

export default (kire: Kire<any>) => {
	kire.existVar(
		"__kire_stack",
		(api) => {
			api.prologue(
				`${api.editable ? "let" : "const"} __kire_stack = new this.NullProtoObj;`,
			);
			api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:stack\\(.*?\\) -->/g, "");
            }
        `);
		},
		true,
	);

	kire.existVar(
		"__kire_defines",
		(api) => {
			api.prologue(
				`${api.editable ? "let" : "const"} __kire_defines = new this.NullProtoObj;`,
			);
			api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:defined\\((.*?)\\) -->([\\s\\S]*?)<!-- KIRE:enddefined -->/g, (match, name, fallback) => {
                    return (__kire_defines && __kire_defines[name] !== undefined) ? __kire_defines[name] : fallback;
                });
            }
        `);
		},
		true,
	);

	kire.directive({
		name: `define`,
		signature: [`name:string`],
		children: true,
		onCall: (api) => {
			const id = api.uid("def");
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			api.write(`{ const _origRes${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
                __kire_defines[${nameCode}] = $kire_response;
                $kire_response = _origRes${id};
            }`);
		},
	});

	kire.directive({
		name: `defined`,
		signature: [`name:string`],
		children: `auto`,
		onCall: (api) => {
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			api.write(
				`$kire_response += "<!-- KIRE:defined(" + ${nameCode} + ") -->";`,
			);
			if (api.node.children && api.node.children.length > 0) {
				api.renderChildren();
			}
			api.write(`$kire_response += "<!-- KIRE:enddefined -->";`);
		},
	});

	kire.directive({
		name: `stack`,
		signature: [`name:string`],
		children: false,
		onCall: (api) => {
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			const placeholderCode = JSON.stringify(`<!-- KIRE:stack(${name}) -->`);
			api.write(`$kire_response += ${placeholderCode};`);

			const phId = api.uid("ph");
			api.epilogue(`
                if (typeof __kire_stack !== 'undefined' && __kire_stack[${nameCode}]) {
                    const _placeholder${phId} = ${placeholderCode};
                    $kire_response = $kire_response.split(_placeholder${phId}).join(__kire_stack[${nameCode}].join("\\n"));
                }
            `);
		},
	});

	kire.directive({
		name: `push`,
		signature: [`name:string`],
		children: true,
		onCall: (api) => {
			const id = api.uid("push");
			const name = normalizeStackNameLiteral(
				api.getArgument(0) || api.getAttribute("name"),
			);
			const nameCode = JSON.stringify(name);
			api.write(`{
                if (!__kire_stack[${nameCode}]) __kire_stack[${nameCode}] = [];
                const __kire_${id} = $kire_response; $kire_response = "";`);
			api.renderChildren();
			api.write(`
                __kire_stack[${nameCode}].push($kire_response);
                $kire_response = __kire_${id};
            }`);
		},
	});
};
