import { kirePlugin, type Kire, type KirePlugin, type KireTplFunction } from "kire";
import { marked } from "marked";

declare module "kire" {
	interface Kire {
		mdrender(content: string, locals?: Record<string, any>): Promise<string>;
		mdview(path: string, locals?: Record<string, any>): Promise<string>;
	}
}

export type MarkdownOptions = {};

export const KireMarkdown = kirePlugin<MarkdownOptions>({}, (kire, _opts) => {
    kire.kireSchema({
        name: "@kirejs/markdown",
        author: "Drysius",
        repository: "https://github.com/drysius/kire",
        version: "0.1.0"
    });

    const _fnCache = kire.cached("@kirejs/markdown");

		kire.mdrender = async (
			content: string,
			locals: Record<string, any> = {},
		) => {
			const html = await marked.parse(content);
			return await kire.render(html, locals) as any;
		};

		kire.mdview = async (path: string, locals: Record<string, any> = {}) => {
			const cacheKey = `file:${path}`;

			if (kire.production && _fnCache[cacheKey]) {
				return kire.run(_fnCache[cacheKey], locals) as any;
			}

			try {
				const resolved = kire.resolvePath(path);
				const content = kire.readFile(resolved);
				const htmlTemplate = await marked.parse(content);
				const entry = kire.compile(htmlTemplate, resolved);

				if (kire.production) _fnCache[cacheKey] = entry.fn;

				return kire.run(entry.fn!, locals) as any;
			} catch (e) {
				console.warn(`[KireMarkdown] Failed to view ${path}:`, e);
				return "";
			}
		};

		kire.$global("$readdir", async (pattern: string) => {
			return [];
		});

		kire.$global("$mdrender", async (source: string) => {
			if (!source) return "";

			if (typeof source === 'string' && (source.endsWith(".md") || source.endsWith(".markdown"))) {
				const html = await kire.mdview(source);
				if (html) return html;
			}

			return await kire.mdrender(source);
		});

		kire.directive({
			name: "markdown",
			params: ["source"],
			description: "Renders Markdown content from a string or file path.",
			example: "@markdown('path/to/file.md')",
			onCall(api) {
				const source = api.getArgument(0) ?? "";

                api.markAsync();
				api.write(`await (async () => {
                    const $source = ${source};
                    if (typeof $source === 'string' && $source.includes("*")) {
                        const $files = await $globals.$readdir($source);
                        for (const $file of $files) {
                            const $html = await $globals.$mdrender($file);
                            $kire_response += $html;
                        }
                    } else {
                        const $html = await $globals.$mdrender($source);
                        $kire_response += $html;
                    }
                })();`);
			},
		});

		kire.directive({
			name: "mdslots",
			params: ["pattern", "name"],
			description:
				"Loads Markdown files matching a glob pattern into a context variable.",
			example: "@mdslots('posts/*.md', 'posts')",
			onCall(api) {
				const pattern = api.getArgument(0);
				const name = api.getArgument(1) || "'$mdslot'";

                api.markAsync();
				api.write(`await (async () => {
					const $files = await $globals.$readdir(${pattern});
					const $slots = {};
					for (const $file of $files) {
						$slots[$file] = await $globals.$mdrender($file);
					}
					$globals[${name}] = $slots;
					$kire_response += "<!-- KIRE_GEN:" + ${pattern} + " -->";
				})();`);
			},
		});
    }
);

export default KireMarkdown;