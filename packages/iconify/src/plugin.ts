import type { KirePlugin } from "kire";
import { fetchIcon, processSvgAttributes } from "./api";
import type { IconifyOptions } from "./types";

export const KireIconify: KirePlugin<IconifyOptions> = {
	name: "@kirejs/iconify",
	options: {},
	load(kire, opts) {
		const apiUrl = opts?.apiUrl || "https://api.iconify.design";
		const defaultClass = opts?.defaultClass || "";

		// Use Kire's built-in caching mechanism
		// This persists across hot reloads in dev or builds if configured
		const iconCache = kire.cached<string>("@kirejs/iconify");

		// Expose fetchIcon helper to the context
		kire.$ctx(
			"fetchIcon",
			async (name: string, params: Record<string, string> = {}) => {
				return fetchIcon(name, apiUrl, params, iconCache);
			},
		);

		// 1. @icon('mdi:home', 'text-red-500', { width: '24' })
		kire.directive({
			name: "icon",
			params: ["name:string", "className:string", "attrs:object"],
			description: "Renders an Iconify icon SVG.",
			example: "@icon('mdi:home', 'text-blue-500', { width: '24' })",
			onCall(ctx) {
				const nameExpr = ctx.param("name");
				const classExpr = ctx.param("className") || '""';
				const attrsExpr = ctx.param("attrs") || "{}";

				// Generate code to run at runtime
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

				// Fetch the icon (cached)
				ctx.raw(
					`  const svg = await $ctx.fetchIcon(${JSON.stringify(nameExpr)}, apiParams);`,
				);
				ctx.raw(`  const cls = ${classExpr};`);

				// Process the SVG string to inject classes/attributes
				// We inline the logic here or we could expose processSvgAttributes helper too.
				// For performance, doing it in JS runtime is fine.
				ctx.raw(`  if (svg.startsWith('<svg')) {`);
				ctx.raw(`     let finalSvg = svg;`);

				// Handle Class
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

				// Handle remaining HTML attributes
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

		// 2. <iconify i="mdi:home" size="24" />
		kire.element({
			name: "iconify",
			description: "Renders an Iconify icon.",
			void: true,
			async onCall(ctx) {
				const attrs = { ...ctx.element.attributes };
				const iconName = attrs.i || attrs.icon;

				if (!iconName) {
					ctx.update('<!-- <iconify> missing "i" or "icon" attribute -->');
					return;
				}

				delete attrs.i;
				delete attrs.icon;

				const className = attrs.class || attrs.className || defaultClass;
				delete attrs.class;
				delete attrs.className;

				// Handle 'size' shortcut
				if (attrs.size) {
					if (!attrs.width) attrs.width = attrs.size;
					if (!attrs.height) attrs.height = attrs.size;
					delete attrs.size;
				}

				// Separate API params from HTML attributes
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

				// Fetch with params
				const svg = await fetchIcon(iconName, apiUrl, apiParams, iconCache);

				// Process attributes
				const finalSvg = processSvgAttributes(svg, className, htmlAttrs);

				ctx.replace(finalSvg);
			},
		});
	},
};
