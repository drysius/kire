import type { Kire } from "../kire";
import type { KireTplFunction } from "../types";
import { decodeBase64 } from "./base64";
import { resolveSourceLocation } from "./source-map";

const SOURCE_MAP_PREFIX =
	"//# sourceMappingURL=data:application/json;charset=utf-8;base64,";
const STACK_FRAME_REGEX = /^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/;

type TemplateMeta = KireTplFunction["meta"];

function normalizePath(path: string): string {
	return String(path || "").replace(/\\/g, "/");
}

function escapeForHtml(value: string): string {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function getTemplateMap(template?: TemplateMeta | null) {
	if (!template) return null;
	if (template.map) return template.map;

	if (template.code) {
		const mapUrlIndex = template.code.lastIndexOf(SOURCE_MAP_PREFIX);
		if (mapUrlIndex !== -1) {
			try {
				const base64 = template.code
					.slice(mapUrlIndex + SOURCE_MAP_PREFIX.length)
					.trim();
				template.map = JSON.parse(decodeBase64(base64));
				return template.map;
			} catch {}
		}
	}

	return null;
}

function getTemplateSourceLines(template?: TemplateMeta | null): string[] {
	return typeof template?.source === "string"
		? template.source.split("\n")
		: [];
}

function getTemplateCodeLines(template?: TemplateMeta | null): string[] {
	return typeof template?.code === "string" ? template.code.split("\n") : [];
}

function isTemplateFrame(file: string, templatePath: string): boolean {
	return (
		file.includes(templatePath) ||
		file.includes("template.kire") ||
		/anonymous|eval|AsyncFunction/.test(file)
	);
}

function findNearestKireLineComment(
	template: TemplateMeta,
	generatedLine: number,
): number | null {
	const generatedLines = getTemplateCodeLines(template);
	if (generatedLines.length === 0) return null;

	let anchor = Math.min(generatedLines.length - 1, generatedLine - 1);
	while (anchor >= 0) {
		const value = generatedLines[anchor]?.trim() || "";
		if (value && !value.startsWith("// kire-line:")) {
			break;
		}
		anchor -= 1;
	}
	if (anchor < 0) return null;

	const end = Math.max(0, anchor - 12);

	for (let i = anchor; i >= end; i--) {
		const match = generatedLines[i]?.trim().match(/^\/\/ kire-line:\s*(\d+)$/);
		if (match) return Number.parseInt(match[1]!, 10);
	}

	return null;
}

function resolveTemplateFrameLocation(
	template: TemplateMeta,
	file: string,
	line: number,
	column: number,
): { source: string; line: number; column: number } | null {
	const templatePath = normalizePath(template.path);
	const sourceLines = getTemplateSourceLines(template);
	const normalizedFile = normalizePath(file);

	if (!isTemplateFrame(normalizedFile, templatePath)) {
		return null;
	}

	const directTemplateFrame = normalizedFile.includes(templatePath);
	if (directTemplateFrame && line >= 1 && line <= sourceLines.length) {
		return {
			source: template.path,
			line,
			column,
		};
	}

	const fromComment = findNearestKireLineComment(template, line);
	if (fromComment) {
		return {
			source: template.path,
			line: fromComment,
			column,
		};
	}

	const map = getTemplateMap(template);
	if (map) {
		const resolved = resolveSourceLocation(map, line, column);
		if (resolved) {
			return {
				source: resolved.source || template.path,
				line: resolved.line,
				column: resolved.column,
			};
		}
	}

	if (directTemplateFrame) {
		return {
			source: template.path,
			line,
			column,
		};
	}

	return null;
}

function resolveFirstTemplateLocation(stack: string, template: TemplateMeta) {
	const lines = String(stack || "").split("\n");
	for (const line of lines) {
		const match = line.match(STACK_FRAME_REGEX);
		if (!match) continue;
		const resolved = resolveTemplateFrameLocation(
			template,
			match[2]!,
			Number.parseInt(match[3]!, 10),
			Number.parseInt(match[4]!, 10),
		);
		if (resolved) return resolved;
	}
	return null;
}

function previewCodeBlock(value: string, maxLength = 240): string {
	const compact = value.replace(/\r/g, "").trim();
	if (!compact) return "";
	if (compact.length <= maxLength) return compact;
	return `${compact.slice(0, maxLength).trimEnd()}...`;
}

function renderAstValue(label: string, value: string): string {
	return `<div class="ast-info"><span>${escapeForHtml(label)}</span><code>${escapeForHtml(value)}</code></div>`;
}

function renderAstNode(node: any, depth = 0, key = "0"): string {
	if (!node || typeof node !== "object") return "";

	const type = typeof node.type === "string" ? node.type : "unknown";
	const location =
		node.loc && typeof node.loc.line === "number"
			? `L${node.loc.line}:C${node.loc.column || 1}`
			: "";

	let title = type;
	if (type === "directive" && node.name) title = `@${node.name}`;
	else if (type === "element" && node.tagName) title = `<${node.tagName}>`;
	else if (type === "interpolation") title = "{{ ... }}";
	else if (type === "js") title = "<?js ?>";

	const info: string[] = [];
	if (Array.isArray(node.args) && node.args.length > 0) {
		info.push(
			renderAstValue(
				"Args",
				node.args.map((value: unknown) => String(value)).join(", "),
			),
		);
	}

	if (node.attributes && typeof node.attributes === "object") {
		const attrs = Object.entries(node.attributes as Record<string, string>);
		if (attrs.length > 0) {
			info.push(
				renderAstValue(
					"Attributes",
					attrs.map(([name, value]) => `${name}="${value}"`).join(" "),
				),
			);
		}
	}

	if (node.raw === true) info.push(renderAstValue("Raw", "true"));
	if (node.void === true) info.push(renderAstValue("Void", "true"));
	if (typeof node.wildcard === "string" && node.wildcard) {
		info.push(renderAstValue("Wildcard", node.wildcard));
	}

	const content =
		typeof node.content === "string" ? previewCodeBlock(node.content) : "";
	const contentBlock = content
		? `<pre class="ast-code">${escapeForHtml(content)}</pre>`
		: "";

	const children = Array.isArray(node.children) ? node.children : [];
	const related = Array.isArray(node.related) ? node.related : [];

	return `<details class="ast-node" ${depth < 2 ? "open" : ""}>
		<summary>
			<span class="ast-kind">${escapeForHtml(type)}</span>
			<span class="ast-title">${escapeForHtml(title)}</span>
			${location ? `<span class="ast-loc">${escapeForHtml(location)}</span>` : ""}
		</summary>
		<div class="ast-node-body">
			${info.length > 0 ? `<div class="ast-info-grid">${info.join("")}</div>` : ""}
			${contentBlock}
			${
				children.length > 0
					? `<div class="ast-group"><div class="ast-group-title">Children (${children.length})</div><div class="ast-children">${children
							.map((child: any, index: number) =>
								renderAstNode(child, depth + 1, `${key}.c${index}`),
							)
							.join("")}</div></div>`
					: ""
			}
			${
				related.length > 0
					? `<div class="ast-group"><div class="ast-group-title">Related (${related.length})</div><div class="ast-children">${related
							.map((child: any, index: number) =>
								renderAstNode(child, depth + 1, `${key}.r${index}`),
							)
							.join("")}</div></div>`
					: ""
			}
		</div>
	</details>`;
}

function collectAstStats(nodes: any[]) {
	const counts: Record<string, number> = Object.create(null);
	let total = 0;

	const walk = (list: any[]) => {
		for (const node of list) {
			if (!node || typeof node !== "object") continue;
			total += 1;
			const type = typeof node.type === "string" ? node.type : "unknown";
			counts[type] = (counts[type] || 0) + 1;
			if (Array.isArray(node.children)) walk(node.children);
			if (Array.isArray(node.related)) walk(node.related);
		}
	};

	walk(nodes);
	return { total, counts };
}

function renderAstVisual(ast: any[]): string {
	if (!Array.isArray(ast) || ast.length === 0) {
		return `<div class="ast-empty">No AST data available for this view.</div>`;
	}

	const stats = collectAstStats(ast);
	const badges = [
		`<span class="ast-stat">nodes ${stats.total}</span>`,
		...Object.entries(stats.counts).map(
			([type, count]) =>
				`<span class="ast-stat">${escapeForHtml(type)} ${count}</span>`,
		),
	];

	return `<div class="ast-overview">
		<div class="ast-stats">${badges.join("")}</div>
		<div class="ast-tree">${ast
			.map((node, index) => renderAstNode(node, 0, String(index)))
			.join("")}</div>
	</div>`;
}

export class KireError extends Error {
	public originalError: Error;
	public template?: KireTplFunction["meta"];

	constructor(
		message: string | Error,
		template?: KireTplFunction | KireTplFunction["meta"],
	) {
		const originalError =
			message instanceof Error ? message : new Error(message);
		super(originalError.message);
		this.name = "KireError";
		this.originalError = originalError;
		this.template = template && "meta" in template ? template.meta : template;
		this.stack = this.formatStack(originalError.stack || "");
	}

	private formatStack(stack: string): string {
		const lines = stack.split("\n");
		const messageLine = lines[0] || `${this.name}: ${this.message}`;
		const mappedLines = [];
		for (let i = 1; i < lines.length; i++) {
			mappedLines.push(this.mapStackLine(lines[i]!));
		}
		let finalMessage = messageLine;
		if (finalMessage.startsWith("Error:")) {
			finalMessage = `KireError:${finalMessage.slice(6)}`;
		} else if (!finalMessage.includes("KireError")) {
			finalMessage = `KireError: ${finalMessage}`;
		}
		return `${finalMessage}\n${mappedLines.join("\n")}`;
	}

	private mapStackLine(line: string): string {
		const match = line.match(STACK_FRAME_REGEX);
		if (!match || !this.template) return line;

		const [, fn, file, rawLine, rawColumn] = match;
		const resolved = resolveTemplateFrameLocation(
			this.template,
			file!,
			Number.parseInt(rawLine!, 10),
			Number.parseInt(rawColumn!, 10),
		);
		if (!resolved) return line;

		return `    at ${fn ? `${fn} ` : ""}(${resolved.source}:${resolved.line}:${resolved.column})`;
	}
}

export function renderErrorHtml(e: any, kire?: Kire<any>, ctx?: any): string {
	const isProduction =
		(kire as any)?.$production ?? (kire as any)?.production ?? false;
	if (isProduction) {
		return `<html><body style="background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><h1 style="font-size:1.5rem;margin-top:1rem;letter-spacing:0.05em">INTERNAL SERVER ERROR</h1></body></html>`;
	}

	const template =
		(e instanceof KireError && e.template) ||
		(ctx?.$template ? ctx.$template.meta : undefined);

	let snippet = "";
	let location = "";
	let astJson = "null";
	let astVisual = `<div class="ast-empty">No AST data available for this view.</div>`;

	if (template && typeof e?.stack === "string") {
		const resolvedLocation = resolveFirstTemplateLocation(e.stack, template);
		const sourceLines = getTemplateSourceLines(template);

		if (resolvedLocation && sourceLines.length > 0) {
			location = `${resolvedLocation.source}:${resolvedLocation.line}`;
			const sourceLine = resolvedLocation.line - 1;
			const start = Math.max(0, sourceLine - 5);
			const end = Math.min(sourceLines.length, sourceLine + 6);
			snippet = sourceLines
				.slice(start, end)
				.map((content: string, index: number) => {
					const current = start + index + 1;
					return `<div class="line ${current === resolvedLocation.line ? "active" : ""}"><span>${current}</span><pre>${escapeForHtml(content)}</pre></div>`;
				})
				.join("");
		}

		if (kire && template.source) {
			try {
				const ast = kire.parse(template.source);
				astJson = JSON.stringify(ast, null, 2);
				astVisual = renderAstVisual(ast);
			} catch {}
		}
	}

	const escapedAstJson = escapeForHtml(astJson);
	const stack = String(e?.stack || "")
		.split("\n")
		.filter((stackLine: string) => !stackLine.includes("new AsyncFunction"))
		.map((stackLine: string) => `<div>${escapeForHtml(stackLine)}</div>`)
		.join("");

	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Kire Error</title><style>
		:root { --bg: #000; --card: #09090b; --card-2: #111115; --text: #fff; --muted: #71717a; --danger: #ef4444; --accent: #38bdf8; --border: #27272a; --surface: #141418; }
		body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 4rem 2rem; line-height: 1.5; }
		.container { max-width: 1080px; margin: 0 auto; }
		.header { border-bottom: 1px solid var(--border); padding-bottom: 2rem; margin-bottom: 3rem; }
		.err-code { color: var(--danger); font-weight: 700; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; }
		.err-msg { font-size: 2.25rem; font-weight: 800; margin: .5rem 0; letter-spacing: -0.02em; }
		.err-loc { color: var(--accent); font-family: monospace; font-size: .9rem; }
		.section { margin-bottom: 3rem; }
		.section-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; flex-wrap:wrap; }
		.section-title { font-size: .75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing:.08em; }
		.snippet { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; font-family: monospace; font-size: .85rem; }
		.line { display: flex; gap: 1rem; padding: 0 1rem; color: #52525b; }
		.line.active { background: #18181b; color: #fff; border-left: 3px solid var(--danger); padding-left: calc(1rem - 3px); }
		.line span { width: 30px; text-align: right; opacity: .35; user-select: none; padding: .35rem 0; }
		.line pre { margin: 0; padding: .35rem 0; white-space: pre-wrap; overflow-wrap: anywhere; }
		.box { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; overflow: auto; font-size: .78rem; color: #d4d4d8; }
		.stack { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; font-family: monospace; font-size: .8rem; color: #a1a1aa; white-space: pre-wrap; }
		.stack div { padding: .2rem 0; border-bottom: 1px solid #18181b; }
		.stack div:last-child { border-bottom: 0; }
		.tabs { display:flex; gap:.5rem; margin-bottom:1rem; flex-wrap:wrap; }
		.tab-btn, .copy-btn { appearance:none; border:1px solid var(--border); background: var(--card); color: var(--muted); border-radius: 999px; padding: .55rem .9rem; font: inherit; font-size:.78rem; cursor:pointer; transition: all .15s ease; }
		.tab-btn:hover, .copy-btn:hover { color: var(--text); border-color: #3f3f46; }
		.tab-btn.is-active { background: var(--surface); color: var(--text); border-color: #52525b; }
		.tab-panel { display:none; }
		.tab-panel.is-active { display:block; }
		.ast-overview { display:grid; gap:1rem; }
		.ast-stats { display:flex; gap:.5rem; flex-wrap:wrap; }
		.ast-stat { background: var(--surface); border:1px solid var(--border); color:#d4d4d8; border-radius:999px; padding:.35rem .65rem; font-size:.75rem; font-family:monospace; }
		.ast-tree { display:grid; gap:.8rem; }
		.ast-node { background: var(--card); border:1px solid var(--border); border-radius: 12px; overflow:hidden; }
		.ast-node summary { list-style:none; display:flex; align-items:center; gap:.75rem; padding:.9rem 1rem; cursor:pointer; user-select:none; }
		.ast-node summary::-webkit-details-marker { display:none; }
		.ast-kind { min-width:72px; text-transform:uppercase; font-size:.68rem; letter-spacing:.08em; color:var(--accent); font-weight:700; }
		.ast-title { font-family:monospace; font-size:.85rem; color:var(--text); overflow-wrap:anywhere; }
		.ast-loc { margin-left:auto; font-family:monospace; font-size:.72rem; color:var(--muted); }
		.ast-node-body { border-top:1px solid #18181b; padding:1rem; display:grid; gap:1rem; }
		.ast-info-grid { display:grid; gap:.6rem; }
		.ast-info { display:grid; gap:.3rem; }
		.ast-info span { font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
		.ast-info code { font-family:monospace; white-space:pre-wrap; overflow-wrap:anywhere; color:#e4e4e7; }
		.ast-code { margin:0; background: var(--card-2); border:1px solid #1f1f23; border-radius:10px; padding:.85rem 1rem; font-family:monospace; font-size:.78rem; white-space:pre-wrap; overflow-wrap:anywhere; color:#d4d4d8; }
		.ast-group { display:grid; gap:.75rem; }
		.ast-group-title { font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
		.ast-children { display:grid; gap:.75rem; padding-left:.75rem; border-left:1px solid #1f1f23; }
		.ast-empty { background: var(--card); border:1px dashed var(--border); border-radius:12px; padding:1rem; color:var(--muted); font-size:.85rem; }
		.json-pre { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; }
	</style></head><body><div class="container">
		<div class="header">
			<div class="err-code">Error 500</div>
			<h1 class="err-msg">${escapeForHtml(e?.message || e?.toString?.() || "Unknown error")}</h1>
			<div class="err-loc">Detected at ${escapeForHtml(location || "unknown location")}</div>
		</div>
		${snippet ? `<div class="section"><div class="section-title">Source Context</div><div class="snippet">${snippet}</div></div>` : ""}
		<div class="section" data-ast-root>
			<div class="section-head">
				<div class="section-title">View Execution AST</div>
				<button type="button" class="copy-btn" data-copy-target="ast-json-text">Copy JSON</button>
			</div>
			<div class="tabs">
				<button type="button" class="tab-btn is-active" data-tab-button="visual">Visual Tree</button>
				<button type="button" class="tab-btn" data-tab-button="json">JSON</button>
			</div>
			<div class="tab-panel is-active" data-tab-panel="visual">${astVisual}</div>
			<div class="tab-panel" data-tab-panel="json"><div class="box"><pre id="ast-json-text" class="json-pre">${escapedAstJson}</pre></div></div>
		</div>
		<div class="section"><div class="section-title">Stack Trace</div><div class="stack">${stack}</div></div>
	</div><script>
		(() => {
			const root = document.querySelector("[data-ast-root]");
			if (root) {
				const buttons = Array.from(root.querySelectorAll("[data-tab-button]"));
				const panels = Array.from(root.querySelectorAll("[data-tab-panel]"));
				const setActiveTab = (name) => {
					for (const button of buttons) {
						const active = button.getAttribute("data-tab-button") === name;
						button.classList.toggle("is-active", active);
					}
					for (const panel of panels) {
						const active = panel.getAttribute("data-tab-panel") === name;
						panel.classList.toggle("is-active", active);
					}
				};
				for (const button of buttons) {
					button.addEventListener("click", () => {
						setActiveTab(button.getAttribute("data-tab-button"));
					});
				}
			}

			for (const button of document.querySelectorAll("[data-copy-target]")) {
				button.addEventListener("click", async () => {
					const targetId = button.getAttribute("data-copy-target");
					const target = targetId ? document.getElementById(targetId) : null;
					if (!target) return;
					const text = target.textContent || "";
					try {
						if (navigator.clipboard?.writeText) {
							await navigator.clipboard.writeText(text);
						} else {
							const textarea = document.createElement("textarea");
							textarea.value = text;
							document.body.appendChild(textarea);
							textarea.select();
							document.execCommand("copy");
							textarea.remove();
						}
						const previous = button.textContent;
						button.textContent = "Copied";
						setTimeout(() => {
							button.textContent = previous;
						}, 1200);
					} catch {}
				});
			}
		})();
	</script></body></html>`;
}
