import type { Kire } from "../kire";
import {
	INTERPOLATION_GLOBAL_REGEX,
	INTERPOLATION_PURE_REGEX,
	INTERPOLATION_START_REGEX,
	NullProtoObj,
} from "../utils/regex";

const toTemplateLiteral = (value: string) => {
	const escaped = value
		.replace(/\\/g, "\\\\")
		.replace(/`/g, "\\`")
		.replace(/\$/g, "\\$");

	return (
		"`" +
		escaped.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr) => `\${${expr}}`) +
		"`"
	);
};

const toComponentPropExpression = (
	api: any,
	attrName: string,
	value: string,
	quoted: boolean,
) => {
	if (attrName.startsWith(":")) {
		return {
			name: attrName.slice(1),
			expression: api.transform(value),
		};
	}

	if (!quoted) {
		return {
			name: attrName,
			expression: api.getAttribute(attrName),
		};
	}

	const trimmed = value.trim();
	if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.length > 2) {
		return {
			name: attrName,
			expression: trimmed.slice(1, -1),
		};
	}

	const pureInterpolation = value.match(INTERPOLATION_PURE_REGEX);
	if (pureInterpolation) {
		return {
			name: attrName,
			expression: pureInterpolation[1]!,
		};
	}

	return {
		name: attrName,
		expression: INTERPOLATION_START_REGEX.test(value)
			? toTemplateLiteral(value)
			: JSON.stringify(value),
	};
};

export default (kire: Kire<any>) => {
	kire.element({
		name: "style",
		raw: true,
		onCall: (api) => {
			api.append("<style");
			api.renderAttributes();
			api.append(">");
			api.renderChildren();
			api.append("</style>");
		},
	});

	kire.element({
		name: "script",
		raw: true,
		onCall: (api) => {
			api.append("<script");
			api.renderAttributes();
			api.append(">");
			api.renderChildren();
			api.append("</script>");
		},
	});

	kire.element({
		name: "kire:else",
		relatedTo: ["kire:if", "kire:elseif"],
		onCall: (api) => {
			api.write(`} else {`);
			api.renderChildren();
		},
	});

	kire.element({
		name: "kire:elseif",
		relatedTo: ["kire:if", "kire:elseif"],
		onCall: (api) => {
			const cond = api.getAttribute("cond");
			api.write(`} else if (${cond}) {`);
			api.renderChildren();
			if (api.node.related) api.renderChildren(api.node.related);
		},
	});

	kire.element({
		name: "kire:if",
		onCall: (api) => {
			const cond = api.getAttribute("cond");
			api.write(`if (${cond}) {`);
			api.renderChildren();
			if (api.node.related) api.renderChildren(api.node.related);
			api.write(`}`);
		},
	});

	kire.element({
		name: "kire:for",
		declares: [
			{ fromAttribute: "as", type: "any" },
			{ fromAttribute: "index", type: "number" },
			{ name: "$loop", type: "any" },
		],
		scope: (_args, attrs) => {
			const as = attrs?.as || "item";
			const indexAs = attrs?.index || "index";
			return [as, indexAs, "$loop"];
		},
		onCall: (api) => {
			const items =
				api.getAttribute("items") || api.getAttribute("each") || "[]";
			const as = api.getAttribute("as") || "item";
			const indexAs = api.getAttribute("index") || "index";
			const id = api.uid("i");
			const shouldExposeIndex =
				api.fullBody.includes(indexAs) || api.allIdentifiers.has(indexAs);
			const shouldExposeLoop =
				api.fullBody.includes("$loop") || api.allIdentifiers.has("$loop");
			api.write(`{
                const _r${id} = ${items};
                const _it${id} = Array.isArray(_r${id})
                    ? _r${id}
                    : (_r${id} && typeof _r${id} === "object" ? Object.keys(_r${id}) : []);
                const _len${id} = _it${id}.length;
                let ${id} = 0;
                while (${id} < _len${id}) {
                    let ${as} = _it${id}[${id}];
                    ${shouldExposeIndex ? `let ${indexAs} = ${id};` : ""}
                    ${shouldExposeLoop ? `let $loop = { index: ${id}, first: ${id} === 0, last: ${id} === _len${id} - 1, length: _len${id} };` : ""}`);
			api.renderChildren();
			api.write(`    ${id}++;
                }
            }`);
		},
	});

	kire.element({
		name: "kire:empty",
		onCall: (api) => {
			api.renderChildren();
		},
	});

	kire.element({
		name: "kire:switch",
		onCall: (api) => {
			api.write(`switch (${api.getAttribute("value")}) {`);
			if (api.node.children) {
				const valid = api.node.children.filter(
					(n: any) =>
						n.type === "element" &&
						(n.tagName === "kire:case" || n.tagName === "kire:default"),
				);
				api.renderChildren(valid);
			}
			api.write(`}`);
		},
	});

	kire.element({
		name: "kire:case",
		onCall: (api) => {
			api.write(`case ${api.getAttribute("value")}: {`);
			api.renderChildren();
			api.write(`  break; }`);
		},
	});

	kire.element({
		name: "kire:default",
		onCall: (api) => {
			api.write(`default: {`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	kire.element({
		name: /^x-/,
		onCall: (api) => {
			const tagName = api.node.tagName!;
			if (
				tagName === "x-slot" ||
				tagName.startsWith("x-slot:") ||
				tagName.startsWith("x-slot.")
			) {
				const inferred = tagName.slice("x-slot".length).replace(/^[:.]/, "");
				const attrs = api.node.attributes || new NullProtoObj();
				let nameExpr = inferred
					? JSON.stringify(inferred)
					: JSON.stringify("default");

				// Laravel-like behavior: x-slot name="header" is always literal.
				// Dynamic expression can be forced with braces: name="{expr}".
				if (typeof attrs.name === "string") {
					const raw = attrs.name.trim();
					if (raw.startsWith("{") && raw.endsWith("}") && raw.length > 2) {
						nameExpr = raw.slice(1, -1);
					} else {
						nameExpr = JSON.stringify(raw);
					}
				}
				const id = api.uid("slot");
				api.write(`{
                    const _oldRes${id} = $kire_response; $kire_response = "";`);
				api.renderChildren();
				api.write(`
                    if (typeof $slots !== 'undefined') $slots[${nameExpr}] = $kire_response;
                    $kire_response = _oldRes${id};
                }`);
				return;
			}

			const componentName = tagName.slice(2);
			const hasComponentsNamespace = !!api.kire.$namespaces.components;
			const componentPath =
				hasComponentsNamespace && !componentName.startsWith("components.")
					? `components.${componentName}`
					: componentName;
			const id = api.uid("comp");
			const depId = api.depend(componentPath);
			const dep = api.getDependency(componentPath);

				const attrs = api.node.attributes || new NullProtoObj();
				const attrMeta = api.node.attributeMeta || new NullProtoObj();
				const hasChildren = Boolean(
					api.node.children && api.node.children.length > 0,
				);
				const propsStr = Object.keys(attrs)
					.map((k) => {
						const prop = toComponentPropExpression(
						api,
						k,
						attrs[k]!,
						!!attrMeta[k]?.quoted,
					);
					return `${JSON.stringify(prop.name)}: ${prop.expression}`;
					})
					.join(",");

				if (hasChildren) {
					api.write(`{
	                const $slots = new this.NullProtoObj();
	                const _oldRes${id} = $kire_response; $kire_response = "";`);
				} else {
					api.write(`{`);
				}

				if (api.node.children) {
					const slots = api.node.children.filter((c) => c.tagName === "x-slot");
					const defContent = api.node.children.filter(
						(c) => c.tagName !== "x-slot",
					);
					if (hasChildren) {
						api.renderChildren(slots);
					}

					// Trim default content to avoid whitespace issues in tests and layouts
					const hasRealContent = defContent.some(
						(c) => c.type !== "text" || c.content?.trim(),
					);
					if (hasChildren && hasRealContent) {
						const defId = api.uid("def");
						api.write(
							`{ const _defRes${defId} = $kire_response; $kire_response = "";`,
					);
					api.renderChildren(defContent);
					api.write(
						`$slots.default = $kire_response.trim(); $kire_response = _defRes${defId}; }`,
						);
					}
				}

					api.write(`
	                ${hasChildren ? `$kire_response = _oldRes${id};` : ""}
	                const _oldProps${id} = $props;
	                $props = Object.assign(Object.create($globals), _oldProps${id}, { ${propsStr} }${hasChildren ? ", { slots: $slots }" : ""});
	                
	                const res${id} = ${depId}.call(this, $props, $globals, ${depId});
                ${dep.meta.async ? `$kire_response += await res${id};` : `$kire_response += res${id};`}
                
                $props = _oldProps${id};
            }`);
		},
	});
};
