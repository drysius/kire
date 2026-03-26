import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const roots = [
	join(import.meta.dir, "../../core/src"),
	join(import.meta.dir, "../../packages"),
];

function collectSourceFiles(dir: string, out: string[]) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (
			entry.name === "node_modules" ||
			entry.name === "dist" ||
			entry.name === "tests"
		) {
			continue;
		}

		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			collectSourceFiles(full, out);
			continue;
		}

		if (/\.(ts|js)$/.test(entry.name)) {
			out.push(full);
		}
	}
}

function findObjectLiteralBlocks(text: string, marker: string) {
	const blocks: string[] = [];
	let searchIndex = 0;

	while ((searchIndex = text.indexOf(marker, searchIndex)) !== -1) {
		const braceStart = text.indexOf("{", searchIndex + marker.length - 1);
		if (braceStart === -1) break;

		let depth = 0;
		let inQuote: string | null = null;
		let cursor = braceStart;

		for (; cursor < text.length; cursor++) {
			const ch = text[cursor]!;
			const prev = cursor > 0 ? text[cursor - 1] : "";

			if (inQuote) {
				if (ch === inQuote && prev !== "\\") inQuote = null;
				continue;
			}

			if (ch === '"' || ch === "'" || ch === "`") {
				inQuote = ch;
				continue;
			}

			if (ch === "{") depth++;
			else if (ch === "}") {
				depth--;
				if (depth === 0) {
					blocks.push(text.slice(searchIndex, cursor + 1));
					searchIndex = cursor + 1;
					break;
				}
			}
		}

		if (cursor >= text.length) break;
	}

	return blocks;
}

function getMissingSchemaDocs() {
	const files: string[] = [];
	for (const root of roots) collectSourceFiles(root, files);

	const missing: string[] = [];

	for (const file of files) {
		const text = readFileSync(file, "utf8");

		for (const type of ["directive", "element"] as const) {
			const blocks = findObjectLiteralBlocks(text, `kire.${type}({`);
			for (const block of blocks) {
				const nameMatch = block.match(
					/name:\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`|\/([^/]+)\/)/,
				);
				const name =
					nameMatch?.[1] ||
					nameMatch?.[2] ||
					nameMatch?.[3] ||
					(nameMatch?.[4] ? `/${nameMatch[4]}/` : "(unknown)");

				const missingFields: string[] = [];
				if (!/description\s*:/.test(block)) missingFields.push("description");
				if (!/example\s*:/.test(block)) missingFields.push("example");

				if (missingFields.length > 0) {
					missing.push(
						`${file} :: ${type} ${name} :: ${missingFields.join(", ")}`,
					);
				}
			}
		}
	}

	return missing;
}

describe("schema docs coverage", () => {
	it("keeps object-literal directives and elements documented", () => {
		expect(getMissingSchemaDocs()).toEqual([]);
	});
});
