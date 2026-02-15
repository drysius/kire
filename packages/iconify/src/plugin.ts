import type { KirePlugin } from "kire";
import { fetchIcon, processSvgAttributes } from "./api";
import type { IconifyOptions } from "./types";
import { NullProtoObj } from "../../../core/src/utils/regex";

export const KireIconify: KirePlugin<IconifyOptions> = {
	name: "@kirejs/iconify",
	options: {},
	load(kire, opts) {
        kire.kireSchema({
            name: "@kirejs/iconify",
            author: "Drysius",
            repository: "https://github.com/drysius/kire",
            version: "0.1.0"
        });

		const apiUrl = opts?.apiUrl || "https://api.iconify.design";
		const defaultClass = opts?.defaultClass || "";

		const iconCache = kire.cached<string>("@kirejs/iconify");

		kire.$ctx(
			"fetchIcon",
			async (name: string, params: Record<string, string> = new NullProtoObj()) => {
				return fetchIcon(name, apiUrl, params, iconCache);
			},
		);

		kire.directive({
			name: "icon",
			params: ["name:string", "className:string", "attrs:object"],
			description: "Renders an Iconify icon SVG.",
			example: "@icon('mdi:home', 'text-blue-500', { width: '24' })",
			onCall(ctx) {
				const nameExpr = ctx.param("name");
				const classExpr = ctx.param("className") || '""';
				const attrsExpr = ctx.param("attrs") || "{}";

				ctx.raw(`await (async () => {`);
				ctx.raw(`  const rawAttrs = ${attrsExpr};`);
				ctx.raw(`  const apiParams = {};`);
				ctx.raw(`  const htmlAttrs = {};`);
				ctx.raw(
					`  const apiKeys = ['width', 'height', 'color', 'flip', 'rotate', 'box'];`,
				);

				ctx.raw(`  for (const [k, v] of Object.entries(rawAttrs)) {`);
				ctx.raw(`    if (apiKeys.includes(k)) apiParams[k] = v;`);
				ctx.raw(`    else htmlAttrs[k] = v;`);
				ctx.raw(`  }`);

				ctx.raw(
					`  const svg = await $ctx.fetchIcon(${JSON.stringify(nameExpr)}, apiParams);`,
				);
				ctx.raw(`  const cls = ${classExpr};`);

				ctx.raw(`  if (svg.startsWith('<svg')) {`);
				ctx.raw(`     let finalSvg = svg;`);

				ctx.raw(`     if (cls) {`);
				ctx.raw(`        if (finalSvg.includes('class="')) {`);
				ctx.raw(
					`           finalSvg = finalSvg.replace('class="', 'class="' + cls + ' ');`,
				);
				ctx.raw(`        } else {`);
				ctx.raw(
					`           finalSvg = finalSvg.replace('<svg', '<svg class="' + cls + '"');`,
				);
				ctx.raw(`        }`);
				ctx.raw(`     }`);

				ctx.raw(`     for (const [key, value] of Object.entries(htmlAttrs)) {`);
				ctx.raw(`        const regex = new RegExp(key + '="[^"]*"', 'g');`);
				ctx.raw(`        if (regex.test(finalSvg)) {`);
				ctx.raw(
					`           finalSvg = finalSvg.replace(regex, key + '="' + value + '"');`,
				);
				ctx.raw(`        } else {`);
				ctx.raw(
					`           finalSvg = finalSvg.replace('<svg', '<svg ' + key + '="' + value + '"');`,
				);
				ctx.raw(`        }`);
				ctx.raw(`     }`);

				ctx.raw(`     $ctx.$add(finalSvg);`);
				ctx.raw(`  } else {`);
				ctx.raw(`     $ctx.$add(svg);`);
				ctx.raw(`  }`);
				ctx.raw(`})();`);
			},
		});

		kire.element({
			name: "iconify",
			description: "Renders an Iconify icon.",
			void: true,
			async run(ctx) {
				const attrs = { ...ctx.element.attributes };
				const iconName = attrs.i || attrs.icon;

				if (!iconName) {
					ctx.replace('<!-- <iconify> missing "i" or "icon" attribute -->');
					return;
				}

				delete attrs.i;
				delete attrs.icon;

				const className = attrs.class || attrs.className || defaultClass;
				delete attrs.class;
				delete attrs.className;

				if (attrs.size) {
					if (!attrs.width) attrs.width = attrs.size;
					if (!attrs.height) attrs.height = attrs.size;
					delete attrs.size;
				}

				const apiKeys = ["width", "height", "color", "flip", "rotate", "box"];
				const apiParams: Record<string, string> = {};
				const htmlAttrs: Record<string, string> = {};

				for (const [k, v] of Object.entries(attrs)) {
					if (apiKeys.includes(k)) {
						apiParams[k] = v;
					} else {
						htmlAttrs[k] = v;
					}
				}

				try {
                    const svg = await fetchIcon(iconName, apiUrl, apiParams, iconCache);
                    const finalSvg = processSvgAttributes(svg, className, htmlAttrs);
                    ctx.replace(finalSvg);
                } catch (e: any) {
                    ctx.replace(`<!-- Iconify error: ${e.message} -->`);
                }
			},
		});
	},
};