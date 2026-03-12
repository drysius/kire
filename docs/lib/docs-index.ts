import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type FrontmatterValue = string | number | boolean | string[];
type FrontmatterMap = Record<string, FrontmatterValue>;

export type DocsPage = {
    id: string;
    href: string;
    title: string;
    section: string;
    summary: string;
    description: string;
    file: string;
    tags: string[];
    order: number;
    slug: string;
    source: string;
};

export type NavItem = {
    id: string;
    title: string;
    href: string;
    description?: string;
    section: string;
};

export type NavGroup = {
    title: string;
    items: NavItem[];
};

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.resolve(docsRoot, "content");
const viewsRoot = path.resolve(docsRoot, "views");

const SECTION_PRIORITY = [
    "Kire Essentials",
    "Kire Internals",
    "Kire Reference",
    "Packages",
];

function normalizePath(value: string): string {
    return value.replaceAll("\\", "/");
}

function normalizeRoute(value: string): string {
    const raw = String(value || "").trim();
    if (!raw) return "/docs";
    if (raw.startsWith("/")) return raw;
    return `/${raw}`;
}

function titleFromSlug(value: string): string {
    return value
        .split(/[/-]/g)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function firstParagraph(markdown: string): string {
    const cleaned = String(markdown || "")
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith("#"))
        .find((line) => !line.startsWith("```") && !line.startsWith("- ") && !line.startsWith(">"));

    if (!cleaned) return "";
    return cleaned.replace(/[`*_]/g, "").slice(0, 240);
}

function parseQuoted(value: string): string {
    const raw = String(value || "").trim();
    if (
        (raw.startsWith("\"") && raw.endsWith("\"")) ||
        (raw.startsWith("'") && raw.endsWith("'"))
    ) {
        return raw.slice(1, -1);
    }
    return raw;
}

function parseArray(value: string): string[] {
    const raw = String(value || "").trim();
    if (!raw.startsWith("[") || !raw.endsWith("]")) return [];

    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];

    return inner
        .split(",")
        .map((part) => parseQuoted(part))
        .map((part) => part.trim())
        .filter(Boolean);
}

function parseFrontmatterBlock(block: string): FrontmatterMap {
    const out: FrontmatterMap = {};
    const lines = String(block || "")
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith("#"));

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const splitAt = line.indexOf(":");
        if (splitAt <= 0) continue;

        const key = line.slice(0, splitAt).trim();
        const rawValue = line.slice(splitAt + 1).trim();
        if (!key) continue;

        if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
            out[key] = parseArray(rawValue);
            continue;
        }

        const normalized = parseQuoted(rawValue);
        if (/^-?\d+$/.test(normalized)) {
            out[key] = Number(normalized);
            continue;
        }

        if (normalized === "true" || normalized === "false") {
            out[key] = normalized === "true";
            continue;
        }

        out[key] = normalized;
    }

    return out;
}

function splitFrontmatter(source: string): { frontmatter: FrontmatterMap; body: string } {
    const normalizedSource = String(source || "").replace(/^\uFEFF/, "");
    const match = normalizedSource.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { frontmatter: {}, body: normalizedSource };

    return {
        frontmatter: parseFrontmatterBlock(match[1] || ""),
        body: normalizedSource.slice(match[0].length),
    };
}

function collectMarkdownFiles(dir: string, out: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]!;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectMarkdownFiles(full, out);
            continue;
        }

        if (!entry.isFile()) continue;
        if (!entry.name.endsWith(".md") && !entry.name.endsWith(".markdown")) continue;
        out.push(full);
    }
}

function isPackagePath(relativeContentPath: string) {
    return normalizePath(relativeContentPath).startsWith("packages/");
}

function defaultSection(relativeContentPath: string): string {
    return isPackagePath(relativeContentPath) ? "Packages" : "Kire Essentials";
}

function defaultRoute(relativeContentPath: string): string {
    const base = normalizePath(relativeContentPath).replace(/\.(md|markdown)$/i, "");
    return normalizeRoute(`/docs/${base}`);
}

function sectionPriority(section: string): number {
    const index = SECTION_PRIORITY.indexOf(section);
    return index >= 0 ? index : SECTION_PRIORITY.length + 1;
}

function sortPages(a: DocsPage, b: DocsPage): number {
    const sectionDelta = sectionPriority(a.section) - sectionPriority(b.section);
    if (sectionDelta !== 0) return sectionDelta;

    const orderDelta = a.order - b.order;
    if (orderDelta !== 0) return orderDelta;

    return a.title.localeCompare(b.title);
}

function buildDocsPages(): DocsPage[] {
    const files: string[] = [];
    collectMarkdownFiles(contentRoot, files);
    files.sort((a, b) => a.localeCompare(b));

    const pages: DocsPage[] = [];
    for (let i = 0; i < files.length; i++) {
        const absolutePath = files[i]!;
        const relativeContent = normalizePath(path.relative(contentRoot, absolutePath));
        const source = fs.readFileSync(absolutePath, "utf8");
        const { frontmatter, body } = splitFrontmatter(source);

        const slug = relativeContent.replace(/\.(md|markdown)$/i, "");
        const title =
            String(frontmatter.title || "").trim() ||
            titleFromSlug(path.basename(slug));
        const description =
            String(frontmatter.description || "").trim() ||
            firstParagraph(body) ||
            `Documentation page for ${title}.`;

        const section = String(frontmatter.section || defaultSection(relativeContent)).trim();
        const tagsRaw = Array.isArray(frontmatter.tags)
            ? frontmatter.tags
            : String(frontmatter.tags || "")
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean);
        const tags = tagsRaw.map((entry) => String(entry).trim()).filter(Boolean);

        const href = normalizeRoute(
            String(frontmatter.route || "").trim() || defaultRoute(relativeContent),
        );
        const id = String(frontmatter.id || slug.replace(/[/.]/g, "-")).trim();
        const order = Number(frontmatter.order || 0);

        pages.push({
            id,
            href,
            title,
            section,
            summary: description,
            description,
            file: normalizePath(path.relative(viewsRoot, absolutePath)),
            tags,
            order: Number.isFinite(order) ? order : 0,
            slug,
            source: absolutePath,
        });
    }

    pages.sort(sortPages);
    return pages;
}

function toNavItem(page: DocsPage): NavItem {
    return {
        id: page.id,
        title: page.title,
        href: page.href,
        description: page.summary,
        section: page.section,
    };
}

function groupBySection(pages: DocsPage[]): NavGroup[] {
    const map = new Map<string, NavItem[]>();
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]!;
        const bucket = map.get(page.section) || [];
        bucket.push(toNavItem(page));
        map.set(page.section, bucket);
    }

    const groups: NavGroup[] = [];
    for (const [title, items] of map.entries()) {
        groups.push({
            title,
            items,
        });
    }

    groups.sort((a, b) => sectionPriority(a.title) - sectionPriority(b.title) || a.title.localeCompare(b.title));
    return groups;
}

function normalizeText(value: string): string {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export const docsPages: DocsPage[] = buildDocsPages();
export const docsByHref = new Map<string, DocsPage>(docsPages.map((item) => [item.href, item]));

export const docsNavGroups: NavGroup[] = groupBySection(docsPages.filter((item) => item.section !== "Packages"));
export const packageNavGroups: NavGroup[] = groupBySection(docsPages.filter((item) => item.section === "Packages"));

export const docsNav: NavItem[] = docsNavGroups.flatMap((group) => group.items);
export const packageNav: NavItem[] = packageNavGroups.flatMap((group) => group.items);

export function getDocByHref(href: string): DocsPage | null {
    return docsByHref.get(String(href || "").trim()) || null;
}

export function getDocNeighbors(href: string): { previous: DocsPage | null; next: DocsPage | null } {
    const index = docsPages.findIndex((item) => item.href === href);
    if (index === -1) return { previous: null, next: null };

    return {
        previous: index > 0 ? docsPages[index - 1]! : null,
        next: index < docsPages.length - 1 ? docsPages[index + 1]! : null,
    };
}

export function searchDocs(query: string): DocsPage[] {
    const normalized = normalizeText(query).trim();
    if (!normalized) return [];

    const tokens = normalized.split(/\s+/g).filter(Boolean);
    const scored: Array<{ page: DocsPage; score: number }> = [];

    for (let i = 0; i < docsPages.length; i++) {
        const page = docsPages[i]!;
        const haystack = normalizeText(
            `${page.title} ${page.summary} ${page.section} ${page.tags.join(" ")} ${page.slug}`,
        );

        let score = 0;
        let allMatch = true;
        for (let t = 0; t < tokens.length; t++) {
            const token = tokens[t]!;
            if (!haystack.includes(token)) {
                allMatch = false;
                break;
            }
            score += 3;
            if (normalizeText(page.title).includes(token)) score += 5;
            if (normalizeText(page.tags.join(" ")).includes(token)) score += 2;
            if (normalizeText(page.section).includes(token)) score += 1;
        }

        if (allMatch) scored.push({ page, score });
    }

    scored.sort((a, b) => b.score - a.score || sortPages(a.page, b.page));
    return scored.map((item) => item.page);
}
