import { type Kire, kirePlugin } from "kire";
import { marked } from "marked";

declare module "kire" {
	interface Kire {
		mdrender(content: string, locals?: Record<string, any>): Promise<string>;
		mdview(path: string, locals?: Record<string, any>): Promise<string>;
	}
}

export type MarkdownOptions = {
	codeBlockClass?: string;
};

function extractCodeLanguage(preAttrs: string, innerHtml: string): string {
	const preLang = /\bdata-code-lang\s*=\s*["']([^"']+)["']/i.exec(preAttrs);
	if (preLang?.[1]) return String(preLang[1]).trim().toLowerCase();

	const codeClass = /<code\b[^>]*\bclass\s*=\s*["']([^"']*)["']/i.exec(
		innerHtml,
	);
	if (!codeClass?.[1]) return "text";

	const languageClass = codeClass[1]
		.split(/\s+/)
		.map((token) => token.trim())
		.find((token) => token.startsWith("language-"));

	if (!languageClass) return "text";
	return languageClass.slice("language-".length).trim().toLowerCase() || "text";
}

function decorateCodeBlocks(
	html: string,
	options?: { codeBlockClass?: string },
): string {
	const wrapperClass = String(options?.codeBlockClass || "").trim();
	if (!wrapperClass) return html;

	return html.replace(
		/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi,
		(segment, rawPreAttrs, innerHtml) => {
			if (!/<code\b/i.test(innerHtml)) return segment;
			if (/\bdata-kire-code-wrapper\s*=/.test(rawPreAttrs)) return segment;

			const preAttrs = String(rawPreAttrs || "");
			const language = extractCodeLanguage(preAttrs, innerHtml);
			const withLanguage = /\bdata-code-lang\s*=/.test(preAttrs)
				? preAttrs
				: `${preAttrs} data-code-lang="${language}"`;

			return `<div class="${wrapperClass}" data-kire-code-wrapper="1"><pre${withLanguage}>${innerHtml}</pre></div>`;
		},
	);
}

const IGNORED_SCAN_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"coverage",
	"publish",
	"test-results",
	"playwright-report",
]);

function normalizePath(path: string): string {
	return path.replaceAll("\\", "/");
}

function globToRegExp(pattern: string): RegExp {
	const normalized = normalizePath(pattern);
	const tokenized = normalized
		.replaceAll("**", "__GLOBSTAR__")
		.replaceAll("*", "__STAR__");
	const escaped = tokenized.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	const source = escaped
		.replaceAll("__GLOBSTAR__", ".*")
		.replaceAll("__STAR__", "[^/]*");
	return new RegExp(`^${source}$`);
}

function getScanRoot(kire: Kire<any>, pattern: string): string {
	const normalizedPattern = normalizePath(pattern);
	const wildcardIndex = normalizedPattern.search(/\*/);
	const staticPrefix =
		wildcardIndex >= 0
			? normalizedPattern.slice(0, wildcardIndex)
			: normalizedPattern;
	const lastSlash = staticPrefix.lastIndexOf("/");
	const base = lastSlash >= 0 ? staticPrefix.slice(0, lastSlash) : "";
	if (!base) return kire.$root;
	return normalizePath(kire.$platform.resolve(kire.$root, base));
}

function collectFiles(kire: Kire<any>, dir: string, out: string[]) {
	let entries: string[] = [];
	try {
		entries = kire.$platform.readDir(dir);
	} catch {
		return;
	}

	for (const entry of entries) {
		const fullPath = normalizePath(kire.$platform.join(dir, entry));
		try {
			const stats = kire.$platform.stat(fullPath);
			if (stats?.isDirectory?.()) {
				if (IGNORED_SCAN_DIRS.has(entry)) continue;
				collectFiles(kire, fullPath, out);
				continue;
			}
			if (stats?.isFile?.()) out.push(fullPath);
		} catch {}
	}
}

function findMarkdownFiles(kire: Kire<any>, pattern: string): string[] {
	const normalizedPattern = normalizePath(pattern);
	const match = globToRegExp(normalizedPattern);
	const absolutePattern = kire.$platform.isAbsolute(normalizedPattern);
	const scanRoot = getScanRoot(kire, normalizedPattern);

	const files: string[] = [];
	collectFiles(kire, scanRoot, files);

	const results = new Set<string>();
	for (const file of files) {
		if (!(file.endsWith(".md") || file.endsWith(".markdown"))) continue;
		const candidate = absolutePattern
			? file
			: normalizePath(kire.$platform.relative(kire.$root, file));
		if (match.test(candidate)) results.add(candidate);
	}

	for (const rawFile of Object.keys(kire.$files)) {
		const file = normalizePath(rawFile);
		if (!(file.endsWith(".md") || file.endsWith(".markdown"))) continue;

		if (absolutePattern) {
			if (!kire.$platform.isAbsolute(file)) continue;
			if (match.test(file)) results.add(file);
			continue;
		}

		const relative = kire.$platform.isAbsolute(file)
			? normalizePath(kire.$platform.relative(kire.$root, file))
			: file;
		if (match.test(relative)) results.add(relative);
	}

	return [...results].sort();
}

function resolveMarkdownPath(kire: Kire<any>, path: string): string {
	const normalized = normalizePath(path);
	const direct = kire.$platform.isAbsolute(normalized)
		? normalized
		: normalizePath(kire.$platform.resolve(kire.$root, normalized));
	const legacy = normalizePath(kire.resolvePath(normalized));

	if (kire.$platform.exists(direct) || direct in kire.$files) return direct;
	if (kire.$platform.exists(legacy) || legacy in kire.$files) return legacy;
	return legacy;
}

function protectKireSyntaxInCode(html: string): string {
	const chunks: string[] = [];
	const tokenPrefix = "__KIRE_MD_CHUNK_";

	const encode = (value: string): string =>
		value
			.replaceAll("@", "&#64;")
			.replaceAll("{{", "&#123;&#123;")
			.replaceAll("}}", "&#125;&#125;");

	const stash = (value: string): string => {
		const idx = chunks.push(encode(value)) - 1;
		return `${tokenPrefix}${idx}__`;
	};

	let out = html.replace(/<pre\b[\s\S]*?<\/pre>/gi, (segment) =>
		stash(segment),
	);
	out = out.replace(/<code\b[\s\S]*?<\/code>/gi, (segment) => stash(segment));
	out = out.replace(/@([A-Za-z_][\w.-]*)\/([A-Za-z0-9._-]+)/g, "&#64;$1/$2");
	out = out.replace(
		new RegExp(`${tokenPrefix}(\\d+)__`, "g"),
		(_, rawIdx: string) => {
			const idx = Number(rawIdx);
			return chunks[idx] ?? "";
		},
	);
	return out;
}

export const KireMarkdown = kirePlugin<MarkdownOptions>({}, (kire, opts) => {
	kire.kireSchema({
		name: "@kirejs/markdown",
		author: "Drysius",
		repository: "https://github.com/drysius/kire",
		version: "0.1.0",
	});

	const _fnCache = kire.cached("@kirejs/markdown");

	kire.mdrender = async (content: string, locals: Record<string, any> = {}) => {
		const html = protectKireSyntaxInCode(
			decorateCodeBlocks(await marked.parse(content), opts),
		);
		return (await kire.render(html, locals)) as any;
	};

	kire.mdview = async (path: string, locals: Record<string, any> = {}) => {
		const cacheKey = `file:${path}`;

		if (kire.$production && _fnCache[cacheKey]) {
			return kire.run(_fnCache[cacheKey], locals) as any;
		}

		try {
			const resolved = resolveMarkdownPath(kire, path);
			const content = kire.readFile(resolved);
			const htmlTemplate = protectKireSyntaxInCode(
				decorateCodeBlocks(await marked.parse(content), opts),
			);
			const entry = kire.compile(htmlTemplate, resolved);

			if (kire.$production) _fnCache[cacheKey] = entry.fn;

			return kire.run(entry.fn!, locals) as any;
		} catch (e) {
			if (!kire.$silent) {
				console.warn(`[KireMarkdown] Failed to view ${path}:`, e);
			}
			return "";
		}
	};

	kire.$global("$readdir", async (pattern: string) => {
		const cacheKey = `glob:${pattern}`;
		if (kire.$production && Array.isArray(_fnCache[cacheKey])) {
			return _fnCache[cacheKey];
		}

		const files = findMarkdownFiles(kire, pattern);
		if (kire.$production) _fnCache[cacheKey] = files;
		return files;
	});

	kire.$global("$mdrender", async (source: string) => {
		if (!source) return "";

		if (
			typeof source === "string" &&
			(source.endsWith(".md") || source.endsWith(".markdown"))
		) {
			const html = await kire.mdview(source);
			if (html) return html;
		}

		return await kire.mdrender(source);
	});

	kire.directive({
		name: "markdown",
		signature: ["source"],
		description: "Renders Markdown content from a string or file path.",
		example: "@markdown('path/to/file.md')",
		onCall(api) {
			const source = api.getArgument(0) ?? "";

			api.markAsync();
			api.write(`await (async () => {
                    const $source = ${source};
                    const $isGlobPattern =
                        typeof $source === 'string' &&
                        $source.includes('*') &&
                        !$source.includes('\\n') &&
                        !$source.includes('\\r') &&
                        ($source.includes('/') || $source.includes('\\\\') || $source.endsWith('.md') || $source.endsWith('.markdown'));
                    if ($isGlobPattern) {
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
		signature: ["pattern", "name"],
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
});

export default KireMarkdown;
