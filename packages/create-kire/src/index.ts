#!/usr/bin/env node
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	cancel,
	confirm,
	intro,
	isCancel,
	outro,
	select,
	spinner,
	text,
} from "@clack/prompts";
import color from "picocolors";

const HERE = dirname(fileURLToPath(import.meta.url));
// Templates sit next to the built file (dist/) and in src during dev.
const TEMPLATES_DIR = [
	resolve(HERE, "../templates"),
	resolve(HERE, "./templates"),
	resolve(HERE, "templates"),
].find((p) => existsSync(p));

interface TemplateMeta {
	id: string;
	title: string;
	description: string;
	/** Languages this template ships (subdirs that exist). */
	languages: Array<"ts" | "js">;
	dir: string;
}

function discoverTemplates(): TemplateMeta[] {
	if (!TEMPLATES_DIR) return [];
	const out: TemplateMeta[] = [];
	for (const id of readdirSync(TEMPLATES_DIR)) {
		const dir = join(TEMPLATES_DIR, id);
		const metaPath = join(dir, "meta.json");
		if (!existsSync(metaPath)) continue;
		const meta = JSON.parse(
			readFileSync(metaPath, "utf8"),
		) as Partial<TemplateMeta>;
		const languages: Array<"ts" | "js"> = [];
		if (existsSync(join(dir, "ts"))) languages.push("ts");
		if (existsSync(join(dir, "js"))) languages.push("js");
		out.push({
			id,
			title: meta.title ?? id,
			description: meta.description ?? "",
			languages,
			dir,
		});
	}
	return out.sort((a, b) => a.title.localeCompare(b.title));
}

function abort(): never {
	cancel("Scaffolding cancelled.");
	process.exit(0);
}

interface Flags {
	name?: string;
	template?: string;
	language?: "ts" | "js";
	ai?: string;
}

/** AI assistant → the instructions file it reads. */
const AI_FILES: Record<string, string> = {
	claude: "CLAUDE.md",
	gemini: "GEMINI.md",
	cursor: ".cursorrules",
	codex: "AGENTS.md",
	copilot: ".github/copilot-instructions.md",
};

const AI_OPTIONS = [
	{ value: "claude", label: "Claude Code", hint: "CLAUDE.md" },
	{ value: "codex", label: "Codex / generic", hint: "AGENTS.md" },
	{ value: "cursor", label: "Cursor", hint: ".cursorrules" },
	{ value: "gemini", label: "Gemini", hint: "GEMINI.md" },
	{
		value: "copilot",
		label: "GitHub Copilot",
		hint: ".github/copilot-instructions.md",
	},
	{ value: "none", label: "None", hint: "skip" },
];

/** Parse `name --template <id> --ts|--js|--language <lang>` for non-interactive use. */
function parseFlags(argv: string[]): Flags {
	const flags: Flags = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]!;
		if (a === "--template" || a === "-t") flags.template = argv[++i];
		else if (a.startsWith("--template=")) flags.template = a.slice(11);
		else if (a === "--ts" || a === "--typescript") flags.language = "ts";
		else if (a === "--js" || a === "--javascript") flags.language = "js";
		else if (a === "--ai") flags.ai = argv[++i];
		else if (a.startsWith("--ai=")) flags.ai = a.slice(5);
		else if (a === "--language" || a === "-l") {
			const v = argv[++i];
			if (v === "ts" || v === "js") flags.language = v;
		} else if (!a.startsWith("-") && !flags.name) flags.name = a;
	}
	return flags;
}

async function main(): Promise<void> {
	const flags = parseFlags(process.argv.slice(2));

	console.log();
	intro(color.bgCyan(color.black(" create-kire ")));

	const templates = discoverTemplates();
	if (templates.length === 0) {
		cancel("No templates found in this install of create-kire.");
		process.exit(1);
	}

	const name =
		flags.name ??
		(await text({
			message: "Project name?",
			placeholder: "my-kire-app",
			defaultValue: "my-kire-app",
			validate: (v) =>
				/^[a-z0-9._-]+$/i.test(v || "my-kire-app")
					? undefined
					: "Use letters, numbers, dashes, dots or underscores.",
		}));
	if (isCancel(name)) abort();
	const projectName = String(name || "my-kire-app");

	const templateId =
		flags.template && templates.some((t) => t.id === flags.template)
			? flags.template
			: await select({
					message: "Pick a template",
					options: templates.map((t) => ({
						value: t.id,
						label: t.title,
						hint: t.description,
					})),
				});
	if (isCancel(templateId)) abort();
	const template = templates.find((t) => t.id === templateId)!;

	let language: "ts" | "js" = "ts";
	if (flags.language && template.languages.includes(flags.language)) {
		language = flags.language;
	} else if (template.languages.length > 1) {
		const picked = await select({
			message: "Language",
			options: [
				{ value: "ts", label: "TypeScript" },
				{ value: "js", label: "JavaScript" },
			],
		});
		if (isCancel(picked)) abort();
		language = picked as "ts" | "js";
	} else if (template.languages.length === 1) {
		language = template.languages[0]!;
	}

	const validAi = new Set([...Object.keys(AI_FILES), "none"]);
	const ai =
		flags.ai && validAi.has(flags.ai)
			? flags.ai
			: ((await select({
					message:
						"Which AI assistant do you use? (adds its instructions file)",
					options: AI_OPTIONS,
				})) as string);
	if (isCancel(ai)) abort();

	const target = resolve(process.cwd(), projectName);
	if (existsSync(target) && readdirSync(target).length > 0) {
		const go = await confirm({
			message: `${color.yellow(projectName)} already exists and is not empty. Continue?`,
			initialValue: false,
		});
		if (isCancel(go) || !go) abort();
	}

	const s = spinner();
	s.start("Creating project");
	scaffold(template, language, target, projectName);
	writeAiGuide(target, ai, template, language);
	s.stop("Project created");

	outro(
		`${color.green("Done!")} Next steps:\n\n` +
			`  ${color.cyan(`cd ${projectName}`)}\n` +
			`  ${color.cyan("bun install")}   ${color.dim("# or npm install")}\n` +
			`  ${color.cyan("bun run dev")}   ${color.dim("# or npm run dev")}\n`,
	);
}

function scaffold(
	template: TemplateMeta,
	language: "ts" | "js",
	target: string,
	projectName: string,
): void {
	mkdirSync(target, { recursive: true });

	const sharedDir = join(template.dir, "shared");
	if (existsSync(sharedDir)) cpSync(sharedDir, target, { recursive: true });

	const langDir = join(template.dir, language);
	if (existsSync(langDir)) cpSync(langDir, target, { recursive: true });

	// Templates ship `gitignore` (npm strips real .gitignore); restore it.
	const gi = join(target, "gitignore");
	if (existsSync(gi)) renameSync(gi, join(target, ".gitignore"));

	// Stamp the project name into package.json.
	const pkgPath = join(target, "package.json");
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
		pkg.name = projectName;
		writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);
	}
}

/** Write the chosen AI assistant's instructions file into the scaffolded app. */
function writeAiGuide(
	target: string,
	ai: string,
	template: TemplateMeta,
	language: "ts" | "js",
): void {
	const file = AI_FILES[ai];
	if (!file) return; // "none"

	const langNote =
		language === "ts"
			? 'Components use the `@Component("name")` and `@prop` decorators.'
			: 'Components register with `ownMeta(Counter).name = "name"` (no decorators).';

	const guide = `# AI guide — ${template.title} + Kire app

This project is built with [Kire](https://github.com/drysius/kire): a
compile-to-JS, Blade-style template engine, with **Kirewire** server-driven
reactive components, running on **${template.title}**.

## Layout

- \`views/\` — \`.kire\` templates (Blade-style). \`views/counter.kire\` is reactive.
- \`counter.${language}\` — a Kirewire component.
- the entry file wires the framework to Kire with one call and registers routes.

## Templates (.kire)

- Output: \`{{ expr }}\` (escaped), \`{!! expr !!}\` (raw).
- Control flow: \`@if\`/\`@elseif\`/\`@else\`, \`@unless\`, \`@foreach(items as item)\`,
  \`@forelse\`, \`@for\`, \`@while\`, \`@break\`/\`@continue\`, \`@switch\`.
- Composition: \`@component\`/\`@slot\`/\`@yield\`/\`@section\`, \`@include*\`, \`@props\`,
  \`@stack\`/\`@push\`. Comments: \`{{-- … --}}\`.
- Dotted view paths resolve to subfolders: \`pages.about\` → \`views/pages/about.kire\`.

## Kirewire components

- A class extending \`LiveComponent\`. Public properties are reactive state;
  public methods are actions callable from the browser (\`wire:click="method"\`).
  ${langNote}
- Mount in a view with \`@wire("name")\`; inject the client runtime with
  \`@kirewireScripts\`. Two-way binding via \`wire:model\`.
- Render a view from a component with \`this.view("name", data)\`.

## Commands

- Install: \`npm install\` (or \`bun install\`).
- Dev: \`npm run dev\`.

## Conventions

- Prefer editing \`.kire\` views and components over hand-writing HTML strings.
- Keep secrets out of source; \`Kirewire({ secret })\` should read from the env.
- Alpine.js interop works: use \`x-on:\`/\`@\` directives in views; wrap persistent
  Alpine islands in \`wire:ignore\`.
`;

	const dest = join(target, file);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, guide);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
