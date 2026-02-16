import type { Kire } from "../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `define`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && (name.startsWith("'") || name.startsWith('"'))) name = name.slice(1, -1);
            const id = api.uid("def");
            api.write(`{ const _origRes${id} = $ctx.$response; $ctx.$response = "";`);
            api.renderChildren();
            api.write(`
                if (!$ctx.$globals["~defines"]) $ctx.$globals["~defines"] = new NullProtoObj();
                $ctx.$globals["~defines"]['${name}'] = $ctx.$response;
                $ctx.$response = _origRes${id};
            }`);
		},
	});

	kire.directive({
		name: `defined`,
		params: [`name:string`],
		children: `auto`,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && (name.startsWith("'") || name.startsWith('"'))) name = name.slice(1, -1);
			api.write(`if ($ctx.$globals["~defines"] && $ctx.$globals["~defines"]['${name}'] !== undefined) {`);
            api.write(`  $ctx.$response += $ctx.$globals["~defines"]['${name}'];`);
            if (api.node.children?.length) {
                api.write(`} else {`);
                api.renderChildren();
            }
            api.write(`}`);
		},
	});

	kire.directive({
		name: `stack`,
		params: [`name:string`],
		children: false,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && (name.startsWith("'") || name.startsWith('"'))) name = name.slice(1, -1);
			api.write(`$ctx.$response += "<!-- KIRE:stack(${name}) -->";`);
            api.epilogue(`
                if ($ctx['~stacks'] && $ctx['~stacks']['${name}']) {
                    const _placeholder = "<!-- KIRE:stack(${name}) -->";
                    $ctx.$response = $ctx.$response.split(_placeholder).join($ctx['~stacks']['${name}'].join("\\n"));
                }
                $ctx.$response = $ctx.$response.replace(/<!-- KIRE:stack\\(.*?\\) -->/g, "");
            `);
		},
	});

	kire.directive({
		name: `push`,
		params: [`name:string`],
		children: true,
		onCall: (api) => {
			let name = api.getAttribute("name");
            if (typeof name === "string" && (name.startsWith("'") || name.startsWith('"'))) name = name.slice(1, -1);
            const id = api.uid("push");
			api.write(`{
                if(!$ctx['~stacks']) $ctx['~stacks'] = new NullProtoObj();
                if (!$ctx['~stacks']['${name}']) $ctx['~stacks']['${name}'] = [];
                const _origRes${id} = $ctx.$response; $ctx.$response = "";`);
            api.renderChildren();
            api.write(`
                $ctx['~stacks']['${name}'].push($ctx.$response);
                $ctx.$response = _origRes${id};
            }`);
		},
	});
};
