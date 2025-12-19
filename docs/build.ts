import { Kire } from "kire";
import KireSsg from "@kirejs/ssg";
import KireAssets from "@kirejs/assets";
import KireTailwind from "@kirejs/tailwind";
import KireMarkdown from "@kirejs/markdown";
import KireIconify from "@kirejs/iconify";
import KireNode from "@kirejs/node";

import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// Determine paths relative to this script file
const docsRoot = import.meta.dir; // e.g. /path/to/kire/docs
const projectRoot = resolve(docsRoot, ".."); // e.g. /path/to/kire

console.log("Docs Root:", docsRoot);
console.log("Project Root:", projectRoot);

// Load schemas from workspace
const schemas: any[] = [];

// Helper to load schema
const loadSchema = async (path: string) => {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.warn(`Failed to load schema at ${path}`);
    return null;
  }
};

// 1. Core
const coreSchemaPath = join(projectRoot, "core", "kire-schema.json");
const coreSchema = await loadSchema(coreSchemaPath);
if (coreSchema) schemas.push(coreSchema);
else console.warn("Core schema not found at", coreSchemaPath);

// 2. Packages
// Using Bun.Glob if available
if (typeof Bun !== "undefined") {
  // Glob is relative to cwd if no root specified, or scan(root)
  // We want to scan `packages/*/kire-schema.json` inside `projectRoot`
  const glob = new Bun.Glob("packages/*/kire-schema.json");
  for await (const file of glob.scan(projectRoot)) {
    const fullPath = join(projectRoot, file);
    const schema = await loadSchema(fullPath);
    if (schema) schemas.push(schema);
  }
} else {
  console.warn("Bun is not defined, skipping package scan.");
}

console.log(`Loaded ${schemas.length} schemas.`);

const DOMAIN = "https://kire.js.org";
const kire = new Kire({
  root: resolve(docsRoot, "src"),
});

kire.$ctx("packages", schemas);
kire.$ctx('DOMAIN', DOMAIN);
kire.plugin(KireMarkdown);
kire.plugin(KireIconify);
kire.plugin(KireTailwind);
kire.plugin(KireAssets);
kire.plugin(KireNode);
kire.plugin(KireSsg, {
  routes: "pages",
  public: "public",
  poshandler: async (builder) => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${builder.routes.map((r: string) => `  <url>
    <loc>${DOMAIN}${r}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n')}
</urlset>`;
    await builder.add("sitemap.xml", sitemap);
  }
});

if (process.argv.includes("--dev")) {
  console.log("Starting dev server...");
  await KireSsg.dev({ port: 3000 });
} else {
  console.log("Building docs...");
  await KireSsg.build({ out: resolve(docsRoot, "dist") });
  console.log("Build complete.");
}
