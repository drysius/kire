import { describe, expect, test } from "bun:test";
import {
	docsNavGroups,
	docsPages,
	getDocByHref,
	getDocNeighbors,
	packageNavGroups,
	searchDocs,
} from "../lib/docs-index";

describe("docs index", () => {
	test("loads pages from markdown frontmatter", () => {
		expect(docsPages.length).toBeGreaterThan(0);
		expect(docsPages.every((page) => page.href.startsWith("/docs/"))).toBe(
			true,
		);
		expect(docsPages.every((page) => page.title.length > 0)).toBe(true);
	});

	test("groups sections for sidebar navigation", () => {
		expect(docsNavGroups.length).toBeGreaterThan(0);
		expect(packageNavGroups.length).toBeGreaterThan(0);
		expect(
			docsNavGroups.some((group) => group.title === "Kire Essentials"),
		).toBe(true);
		expect(packageNavGroups.some((group) => group.title === "Packages")).toBe(
			true,
		);
	});

	test("search returns package references", () => {
		const results = searchDocs("wire");
		expect(results.length).toBeGreaterThan(0);
		expect(results.some((page) => page.href === "/docs/packages/wire")).toBe(
			true,
		);
	});

	test("previous and next docs are resolved in order", () => {
		const current = getDocByHref("/docs/packages/wire");
		expect(current).not.toBeNull();

		const neighbors = getDocNeighbors("/docs/packages/wire");
		expect(neighbors.previous?.href).toBe("/docs/packages/core");
		expect(neighbors.next?.href).toBe("/docs/packages/assets");
	});
});
