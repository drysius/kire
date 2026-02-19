import type { Kire } from "../kire";
import { QUOTED_STR_CHECK_REGEX } from "../utils/regex";

export default (kire: Kire<any>) => {
    kire.existVar('__kire_stack', (api) => {
        api.prologue(`${api.editable ? 'let' : 'const'} __kire_stack = new this.NullProtoObj;`);
        api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:stack\\(.*?\\) -->/g, "");
            }
        `);
    }, true);

    kire.existVar('__kire_defines', (api) => {
        api.prologue(`${api.editable ? 'let' : 'const'} __kire_defines = new this.NullProtoObj;`);
        api.epilogue(`
            if (typeof $kire_response === 'string') {
                $kire_response = $kire_response.replace(/<!-- KIRE:defined\\((.*?)\\) -->([\\s\\S]*?)<!-- KIRE:enddefined -->/g, (match, name, fallback) => {
                    return (__kire_defines && __kire_defines[name] !== undefined) ? __kire_defines[name] : fallback;
                });
            }
        `);
    }, true);

	kire.directive({
		name: `define`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
            const id = api.uid("def");
            api.write(`{ const _origRes${id} = $kire_response; $kire_response = "";`);
            api.renderChildren();
            api.write(`
                __kire_defines['${name}'] = $kire_response;
                $kire_response = _origRes${id};
            }`);
		},
	});

	kire.directive({
		name: `defined`,
		params: [`name:string`],
		children: `auto`,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
            api.write(`$kire_response += "<!-- KIRE:defined(${name}) -->";`);
            if (api.children) {
                api.renderChildren();
            }
            api.write(`$kire_response += "<!-- KIRE:enddefined -->";`);
		},
	});

	kire.directive({
		name: `stack`,
		params: [`name:string`],
		children: false,
		onCall: (api) => {
			let name = api.getAttribute("name") || api.getArgument(0);
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
			api.write(`$kire_response += "<!-- KIRE:stack(${name}) -->";`);
            
            const phId = api.uid('ph');
            api.epilogue(`
                if (typeof __kire_stack !== 'undefined' && __kire_stack['${name}']) {
                    const _placeholder${phId} = "<!-- KIRE:stack(${name}) -->";
                    $kire_response = $kire_response.split(_placeholder${phId}).join(__kire_stack['${name}'].join("\\n"));
                }
            `);
		},
	});

	kire.directive({
		name: `push`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && QUOTED_STR_CHECK_REGEX.test(name)) name = name.slice(1, -1);
            const id = api.uid("push");
			api.write(`{
                if (!__kire_stack['${name}']) __kire_stack['${name}'] = [];
                const __kire_${id} = $kire_response; $kire_response = "";`);
            api.renderChildren();
            api.write(`
                __kire_stack['${name}'].push($kire_response);
                $kire_response = __kire_${id};
            }`);
		},
	});
};
