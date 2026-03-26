import type { Kire } from "../kire";
import type { KireAttributeDeclaration } from "../types";
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

const relateKireNames = (values: string[] = []) =>
	values.map((value) => (value.startsWith("kire:") ? value : `kire:${value}`));

export default (kire: Kire<any>) => {
	kire.element({
		name: "style",
		raw: true,
		description:
			"Raw style block forwarded to the output without escaping child content.",
		example: `<style>.card { display: grid; }</style>`,
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
		description:
			"Raw script block forwarded to the output without escaping child content.",
		example: `<script>window.boot = true;</script>`,
		onCall: (api) => {
			api.append("<script");
			api.renderAttributes();
			api.append(">");
			api.renderChildren();
			api.append("</script>");
		},
	});

	const directiveElementAttr = (
		name: string,
		type: string,
		description: string,
	) => ({
		name,
		type,
		description,
	});

	const registerDirectiveElementAlias = (
		directiveName: string,
	options: {
			description: string;
			example: string;
			void?: boolean;
			attributes?: KireAttributeDeclaration[];
			relatedTo?: string[];
		},
	) => {
		const directive = kire.getDirective(directiveName);
		if (!directive) return;

		kire.element({
			name: `kire:${directiveName}`,
			void: options.void,
			description: options.description,
			example: options.example,
			attributes: options.attributes,
			relatedTo: options.relatedTo || relateKireNames(directive.relatedTo || []),
			isDependency: directive.isDependency,
			scope: directive.scope,
			onCall: (api) => {
				const attrDefs = options.attributes || [];
				const proxyApi = Object.create(api);
				proxyApi.getAttribute = (name: string) => {
					const original = api.getAttribute(name);
					const rawValue = api.node?.attributes?.[name];
					const attrDef = attrDefs.find((entry) => entry?.name === name);
					const attrTypes = Array.isArray(attrDef?.type)
						? attrDef.type
						: attrDef?.type
							? [attrDef.type]
							: [];

					if (
						typeof rawValue === "string" &&
						attrTypes.includes("string") &&
						!rawValue.includes("{{") &&
						!(rawValue.trim().startsWith("{") && rawValue.trim().endsWith("}"))
					) {
						return JSON.stringify(rawValue.trim());
					}

					return original;
				};
				directive.onCall(proxyApi);
			},
		});
	};

	registerDirectiveElementAlias("unless", {
		description: "Element alias for @unless that renders children when cond is falsy.",
		example: '<kire:unless cond="user">Guest only</kire:unless>',
		attributes: [
			directiveElementAttr(
				"cond",
				"javascript",
				"Expression that must evaluate falsy for the element body to render.",
			),
		],
		relatedTo: ["kire:else"],
	});

	registerDirectiveElementAlias("isset", {
		description:
			"Element alias for @isset that renders children when expr is defined and not null.",
		example: '<kire:isset expr="user.avatar"><img src="{{ user.avatar }}"></kire:isset>',
		attributes: [
			directiveElementAttr(
				"expr",
				"javascript",
				"Expression checked for defined and non-null values.",
			),
		],
	});

	registerDirectiveElementAlias("include", {
		description:
			"Element alias for @include that renders another Kire view inline.",
		example: '<kire:include path="partials.card" locals="{ title: pageTitle }" />',
		void: true,
		attributes: [
			directiveElementAttr(
				"path",
				"string",
				"View path that should be rendered inline.",
			),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the included view scope.",
			),
		],
	});

	registerDirectiveElementAlias("component", {
		description:
			"Element alias for @component that renders a dependency view and exposes nested slots.",
		example:
			'<kire:component path="layouts.card" locals="{ title: pageTitle }"><kire:slot name="header">Header</kire:slot>Body</kire:component>',
		attributes: [
			directiveElementAttr(
				"path",
				"string",
				"View path that should be rendered as the target component.",
			),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the component props.",
			),
		],
	});

	registerDirectiveElementAlias("layout", {
		description:
			"Element alias for @layout that renders a layout component and captures nested sections.",
		example:
			'<kire:layout path="layouts.app"><kire:section name="content"><p>Hello</p></kire:section></kire:layout>',
		attributes: [
			directiveElementAttr("path", "string", "Layout view path to render."),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the layout props.",
			),
		],
	});

	registerDirectiveElementAlias("extends", {
		description:
			"Element alias for @extends that mirrors layout-style component inheritance.",
		example:
			'<kire:extends path="layouts.app"><kire:section name="content"><p>Hello</p></kire:section></kire:extends>',
		attributes: [
			directiveElementAttr("path", "string", "Parent view path to render."),
			directiveElementAttr(
				"locals",
				"javascript",
				"Extra locals merged into the parent component props.",
			),
		],
	});

	registerDirectiveElementAlias("slot", {
		description:
			"Element alias for @slot that captures named slot content for the parent component.",
		example: '<kire:slot name="header"><h1>Dashboard</h1></kire:slot>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Slot name that will be exposed to the parent component.",
			),
		],
	});

	registerDirectiveElementAlias("section", {
		description:
			"Element alias for @section that behaves like a named slot within a layout or extends block.",
		example: '<kire:section name="content"><p>Hello</p></kire:section>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Section name captured for the target layout.",
			),
		],
	});

	registerDirectiveElementAlias("yield", {
		description:
			"Element alias for @yield that renders a named slot and can fall back to a default expression.",
		example: '<kire:yield name="content" default="\'<p>Empty</p>\'" />',
		void: true,
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Slot name to resolve from the current component props.",
			),
			directiveElementAttr(
				"default",
				"javascript",
				"Fallback expression rendered when the slot is missing.",
			),
		],
	});

	registerDirectiveElementAlias("define", {
		description:
			"Element alias for @define that captures a reusable named fragment.",
		example: '<kire:define name="hero"><h1>Hero</h1></kire:define>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Fragment name stored in the define registry.",
			),
		],
	});

	registerDirectiveElementAlias("defined", {
		description:
			"Element alias for @defined that renders a named fragment or its inline fallback children.",
		example:
			'<kire:defined name="hero"><h1>Fallback</h1></kire:defined>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Fragment name looked up in the define registry.",
			),
		],
	});

	registerDirectiveElementAlias("stack", {
		description:
			"Element alias for @stack that renders the accumulated contents of a named stack.",
		example: '<kire:stack name="scripts" />',
		void: true,
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Stack name to inject at the current output position.",
			),
		],
	});

	registerDirectiveElementAlias("push", {
		description:
			"Element alias for @push that appends the rendered body to a named stack.",
		example:
			'<kire:push name="scripts"><script src="/app.js"></script></kire:push>',
		attributes: [
			directiveElementAttr(
				"name",
				"string",
				"Stack name that should receive the current element body.",
			),
		],
	});

	kire.element({
		name: "kire:else",
		relatedTo: ["kire:if", "kire:elseif"],
		description:
			"Fallback branch for a preceding <kire:if> or <kire:elseif> block.",
		example: "<kire:else>Fallback content</kire:else>",
		onCall: (api) => {
			api.write(`} else {`);
			api.renderChildren();
		},
	});

	kire.element({
		name: "kire:elseif",
		relatedTo: ["kire:if", "kire:elseif"],
		description:
			"Conditional branch evaluated after a previous <kire:if> or <kire:elseif>.",
		example: '<kire:elseif cond="status === 2">Two</kire:elseif>',
		attributes: [
			{
				name: "cond",
				type: "javascript",
				description: "Expression that must evaluate truthy for this branch.",
			},
		],
		onCall: (api) => {
			const cond = api.getAttribute("cond");
			api.write(`} else if (${cond}) {`);
			api.renderChildren();
			if (api.node.related) api.renderChildren(api.node.related);
		},
	});

	kire.element({
		name: "kire:if",
		description:
			"Conditional block element alternative to the @if directive syntax.",
		example: '<kire:if cond="user">Hello</kire:if>',
		attributes: [
			{
				name: "cond",
				type: "javascript",
				description: "Expression that controls whether the children are rendered.",
			},
		],
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
		description:
			"Loop element that iterates arrays or objects and exposes item aliases to its children.",
		example:
			'<kire:for items="items" as="item" index="i">{{ item }}</kire:for>',
		attributes: [
			{
				name: "items",
				type: "javascript",
				description: "Collection expression to iterate.",
			},
			{
				name: "each",
				type: "javascript",
				description: "Alias of items for compatibility with loop-style APIs.",
			},
			{
				name: "as",
				type: "string",
				description: "Variable name used for the current item.",
			},
			{
				name: "index",
				type: "string",
				description: "Variable name used for the current index or key.",
			},
		],
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
		description:
			"Empty-state branch used together with loop-oriented Kire elements.",
		example: "<kire:empty>No items</kire:empty>",
		onCall: (api) => {
			api.renderChildren();
		},
	});

	kire.element({
		name: "kire:switch",
		description:
			"Switch container for related <kire:case> and <kire:default> branches.",
		example:
			'<kire:switch value="status"><kire:case value="1">Draft</kire:case></kire:switch>',
		attributes: [
			{
				name: "value",
				type: "javascript",
				description: "Expression evaluated once and compared by nested cases.",
			},
		],
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
		description:
			"Case branch that matches the nearest parent <kire:switch> value.",
		example: '<kire:case value="1">Draft</kire:case>',
		attributes: [
			{
				name: "value",
				type: "javascript",
				description: "Case expression compared against the parent switch value.",
			},
		],
		onCall: (api) => {
			api.write(`case ${api.getAttribute("value")}: {`);
			api.renderChildren();
			api.write(`  break; }`);
		},
	});

	kire.element({
		name: "kire:default",
		description:
			"Fallback branch rendered when no sibling <kire:case> matches.",
		example: "<kire:default>Unknown</kire:default>",
		onCall: (api) => {
			api.write(`default: {`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	kire.element({
		name: /^x-/,
		description:
			"Generic component element namespace. Use x-* tags to render registered Kire components and x-slot to define named slots.",
		example:
			`<x-card title="Dashboard">\n  <x-slot:name>Header</x-slot:name>\n  <p>Body</p>\n</x-card>`,
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
