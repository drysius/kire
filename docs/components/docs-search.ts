import { Component } from "@kirejs/wire";
import { searchDocs, type DocsPage } from "../lib/docs-index";

type DocsResult = Pick<DocsPage, "id" | "href" | "title" | "section" | "summary">;

export default class DocsSearch extends Component {
    public query = "";
    public placeholder = "Search docs, directives, packages...";
    public limit = 8;

    get trimmedQuery(): string {
        return String(this.query || "").trim();
    }

    get hasQuery(): boolean {
        return this.trimmedQuery.length > 0;
    }

    get searchHref(): string {
        if (!this.hasQuery) return "/docs/search";
        return `/docs/search?q=${encodeURIComponent(this.trimmedQuery)}`;
    }

    get results(): DocsResult[] {
        if (!this.hasQuery) return [];

        const maxResults = Number.isFinite(Number(this.limit))
            ? Math.max(1, Math.floor(Number(this.limit)))
            : 8;

        return searchDocs(this.trimmedQuery)
            .slice(0, maxResults)
            .map((item) => ({
                id: item.id,
                href: item.href,
                title: item.title,
                section: item.section,
                summary: item.summary,
            }));
    }

    get hasResults(): boolean {
        return this.results.length > 0;
    }

    async clear() {
        this.query = "";
    }

    render() {
        return this.view("components.docs-search");
    }
}
