import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { docs } from "#app/config";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CONTENT_ROOT = path.resolve(PACKAGE_ROOT, docs.contentDir);

export interface DocPage {
	/** Canonical route, e.g. `/docs/kire/getting-started`. */
	route: string;
	title: string;
	description: string;
	section: string;
	order: number;
	tags: string[];
	/** Absolute path to the markdown file. */
	file: string;
	/** Raw markdown body (frontmatter stripped). */
	body: string;
}

export interface NavGroup {
	section: string;
	items: Array<{ route: string; title: string; description: string }>;
}

// ── Frontmatter ──────────────────────────────────────────────────────────────

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (!match) return { data: {}, body: raw };
	const data: Record<string, unknown> = {};
	for (const line of match[1]!.split(/\r?\n/)) {
		const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line.trim());
		if (!kv) continue;
		const [, key, rawValue] = kv;
		data[key!] = parseValue(rawValue!.trim());
	}
	return { data, body: match[2] ?? "" };
}

function parseValue(value: string): unknown {
	if (value.startsWith("[") && value.endsWith("]")) {
		return value
			.slice(1, -1)
			.split(",")
			.map((v) => v.trim().replace(/^["']|["']$/g, ""))
			.filter(Boolean);
	}
	const unquoted = value.replace(/^["']|["']$/g, "");
	if (/^\d+$/.test(unquoted)) return Number(unquoted);
	return unquoted;
}

// ── Loading (cached after first scan; markdown is build-time content) ─────────

let cache: DocPage[] | null = null;

function walk(dir: string, out: string[]): void {
	for (const entry of readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (entry.endsWith(".md")) out.push(full);
	}
}

export function allPages(): DocPage[] {
	if (cache) return cache;
	const files: string[] = [];
	walk(CONTENT_ROOT, files);

	const pages = files.map((file): DocPage => {
		const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
		const rel = path.relative(CONTENT_ROOT, file).replace(/\\/g, "/").replace(/\.md$/, "");
		return {
			route: String(data.route ?? `/docs/${rel}`),
			title: String(data.title ?? rel),
			description: String(data.description ?? ""),
			section: String(data.section ?? "Documentation"),
			order: Number(data.order ?? 999),
			tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
			file,
			body,
		};
	});

	const sectionRank = (s: string) => {
		const i = docs.sectionOrder.indexOf(s);
		return i === -1 ? docs.sectionOrder.length : i;
	};
	pages.sort(
		(a, b) => sectionRank(a.section) - sectionRank(b.section) || a.order - b.order || a.title.localeCompare(b.title),
	);
	cache = pages;
	return pages;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function findByRoute(route: string): DocPage | undefined {
	const normalized = route.replace(/\/$/, "") || "/";
	return allPages().find((p) => p.route === normalized);
}

export function navGroups(): NavGroup[] {
	const groups = new Map<string, NavGroup>();
	for (const page of allPages()) {
		let group = groups.get(page.section);
		if (!group) groups.set(page.section, (group = { section: page.section, items: [] }));
		group.items.push({ route: page.route, title: page.title, description: page.description });
	}
	// The live playground is a dedicated page (not markdown); surface it in nav.
	groups.get("Kirewire")?.items.push({
		route: "/docs/wire/playground",
		title: "Live Playground",
		description: "Interactive Kirewire components running in the browser.",
	});
	return [...groups.values()];
}

export function neighbors(route: string): { prev?: DocPage; next?: DocPage } {
	const pages = allPages();
	const i = pages.findIndex((p) => p.route === route);
	if (i === -1) return {};
	return { prev: pages[i - 1], next: pages[i + 1] };
}

export function search(query: string, limit = 8): DocPage[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return allPages()
		.map((page) => {
			const haystack = `${page.title} ${page.description} ${page.tags.join(" ")}`.toLowerCase();
			let score = 0;
			if (page.title.toLowerCase().includes(q)) score += 10;
			if (haystack.includes(q)) score += 3;
			for (const tag of page.tags) if (tag.toLowerCase() === q) score += 5;
			return { page, score };
		})
		.filter((r) => r.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((r) => r.page);
}
