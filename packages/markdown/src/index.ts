import type { Kire, KirePlugin } from "kire";
import { marked } from "marked";

declare module "kire" {
	interface Kire {
		mdrender(content: string, locals?: Record<string, any>): Promise<string>;
		mdview(path: string, locals?: Record<string, any>): Promise<string>;
	}
}

export type MarkdownOptions = {};

export const KireMarkdown: KirePlugin<MarkdownOptions> = {
	name: "@kirejs/markdown",
	options: {},
	load(kire: Kire, _opts) {
		const _fnCache = kire.cached<Function>("@kirejs/markdown");

		// 1. mdrender: Render string content
		kire.mdrender = async (content: string, locals: Record<string, any> = {}) => {
			const html = (await marked.parse(content)) as string;
			return await kire.render(html, locals);
		};

		// 2. mdview: Render file content
		kire.mdview = async (path: string, locals: Record<string, any> = {}) => {
			const cacheKey = `file:${path}`;

			// Check if we have a compiled function cached
			if (kire.production && _fnCache.has(cacheKey)) {
				return kire.run(_fnCache.get(cacheKey)!, locals);
			}

			try {
				const resolved = kire.resolvePath(path, locals, "md");
				const content = await kire.$resolver(resolved);
				
				// Convert MD to HTML
				// We replace {{ var }} with {{ it.var }} ? No, that's unsafe regex.
                // The user must write {{ it.var }} in their markdown if they want locals.
                // Or we can try to support legacy by destructuring locals? No, "locals keys are unknown at compile time".
                
				const htmlTemplate = (await marked.parse(content)) as string;

				// Compile HTML as Kire template
				const fn = await kire.compileFn(htmlTemplate);

				if (kire.production) _fnCache.set(cacheKey, fn);

				return kire.run(fn, locals);
			} catch (e) {
				console.warn(`[KireMarkdown] Failed to view ${path}:`, e);
				return "";
			}
		};

		// Expose helpers
		kire.$ctx("$readdir", async (pattern: string) => {
			if (kire.$readdir) {
				return kire.$readdir(pattern);
			}
			return [];
		});

		kire.$ctx("$mdrender", async (source: string) => {
			if (!source) return "";

			if (source.endsWith(".md") || source.endsWith(".markdown")) {
				const html = await kire.mdview(source);
				if (html) return html;
			}

			return await kire.mdrender(source);
		});

		kire.directive({
			name: "markdown",
			params: ["source:string"],
			description: "Renders Markdown content from a string or file path.",
			example: "@markdown('path/to/file.md')",
			async onCall(ctx) {
				const source = ctx.param(0) ?? "";

				if (source.includes("*")) {
					ctx.raw(`await (async () => {
						const files = await $ctx.$readdir(${JSON.stringify(source)});
						for (const file of files) {
							const html = await $ctx.$mdrender(file);
							$ctx.$add(html);
						}
					})();`);
					return;
				}

				ctx.raw(`await (async () => {
                    const html = await $ctx.$mdrender(${JSON.stringify(source)});
                    $ctx.$add(html);
                })();`);
			},
		});

		kire.directive({
			name: "mdslots",
			params: ["pattern:string", "name:string"],
			description:
				"Loads Markdown files matching a glob pattern into a context variable.",
			example: "@mdslots('posts/*.md', 'posts')",
			async onCall(ctx) {
				const pattern = ctx.param("pattern");
				const name = ctx.param("name") || "$mdslot";

				ctx.raw(`await (async () => {
					const files = await $ctx.$readdir(${JSON.stringify(pattern)});
					const slots = {};
					for (const file of files) {
						slots[file] = await $ctx.$mdrender(file);
					}
					$ctx[${JSON.stringify(name)}] = slots;
					$ctx.$add("<!-- KIRE_GEN:" + ${JSON.stringify(pattern)} + " -->");
				})();`);
			},
		});
	},
};

export default KireMarkdown;
