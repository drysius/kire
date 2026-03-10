export type Section = "Guides" | "Reference" | "Packages";

export type DocsPage = {
    id: string;
    href: string;
    title: string;
    section: Section;
    summary: string;
    file: string;
    tags: string[];
};

export type NavItem = {
    title: string;
    href: string;
    description?: string;
};

export const docsPages: DocsPage[] = [
    {
        id: "getting-started",
        href: "/docs/getting-started",
        title: "Getting Started",
        section: "Guides",
        summary: "Instalacao, setup inicial, render e view com namespaces.",
        file: "../content/kire/getting-started.md",
        tags: ["install", "setup", "render", "view", "namespace"],
    },
    {
        id: "how-kire-works",
        href: "/docs/how-kire-works",
        title: "How Kire Works",
        section: "Guides",
        summary: "Como o motor compila templates, forks e contexto por request.",
        file: "../content/kire/how-kire-works.md",
        tags: ["compiler", "jit", "fork", "request", "cache"],
    },
    {
        id: "directives-reference",
        href: "/docs/directives-reference",
        title: "Directives Reference",
        section: "Reference",
        summary: "Diretivas principais para controle de fluxo, includes, layouts e slots.",
        file: "../content/kire/directives-reference.md",
        tags: ["if", "for", "include", "layout", "slot", "directive"],
    },
    {
        id: "components-and-slots",
        href: "/docs/components-and-slots",
        title: "Components and Slots",
        section: "Guides",
        summary: "Como criar componentes, passar slots e reutilizar blocos.",
        file: "../content/kire/components-and-slots.md",
        tags: ["component", "slot", "yield", "reuse"],
    },
    {
        id: "creating-plugins",
        href: "/docs/creating-plugins",
        title: "Creating Plugins",
        section: "Guides",
        summary: "Extendendo Kire com plugins, diretivas e elementos customizados.",
        file: "../content/kire/creating-plugins.md",
        tags: ["plugin", "directive", "element", "extension"],
    },
    {
        id: "package-core",
        href: "/docs/packages/core",
        title: "kire (core)",
        section: "Packages",
        summary: "Motor principal de templates e API base.",
        file: "../content/packages/core.md",
        tags: ["core", "engine", "kire"],
    },
    {
        id: "package-wire",
        href: "/docs/packages/wire",
        title: "@kirejs/wire",
        section: "Packages",
        summary: "Componentes server-driven inspirados em Livewire para Kire.",
        file: "../content/packages/wire.md",
        tags: ["wire", "livewire", "component", "sse", "navigate"],
    },
    {
        id: "package-assets",
        href: "/docs/packages/assets",
        title: "@kirejs/assets",
        section: "Packages",
        summary: "Gerenciamento, deduplicacao e entrega de assets.",
        file: "../content/packages/assets.md",
        tags: ["assets", "script", "style", "cache"],
    },
    {
        id: "package-auth",
        href: "/docs/packages/auth",
        title: "@kirejs/auth",
        section: "Packages",
        summary: "Diretivas de autenticacao e autorizacao no template.",
        file: "../content/packages/auth.md",
        tags: ["auth", "guest", "can", "permissions"],
    },
    {
        id: "package-iconify",
        href: "/docs/packages/iconify",
        title: "@kirejs/iconify",
        section: "Packages",
        summary: "Integracao de icones SVG com Iconify.",
        file: "../content/packages/iconify.md",
        tags: ["iconify", "svg", "icons"],
    },
    {
        id: "package-markdown",
        href: "/docs/packages/markdown",
        title: "@kirejs/markdown",
        section: "Packages",
        summary: "Renderizacao de Markdown em templates Kire.",
        file: "../content/packages/markdown.md",
        tags: ["markdown", "mdrender", "mdview"],
    },
    {
        id: "package-tailwind",
        href: "/docs/packages/tailwind",
        title: "@kirejs/tailwind",
        section: "Packages",
        summary: "Compilacao de classes Tailwind e cache no runtime do Kire.",
        file: "../content/packages/tailwind.md",
        tags: ["tailwind", "css", "compile"],
    },
    {
        id: "package-utils",
        href: "/docs/packages/utils",
        title: "@kirejs/utils",
        section: "Packages",
        summary: "Helpers utilitarios no estilo Laravel para templates.",
        file: "../content/packages/utils.md",
        tags: ["utils", "route", "html", "helpers"],
    },
];

export const docsNav: NavItem[] = docsPages
    .filter((item) => item.section !== "Packages")
    .map((item) => ({ title: item.title, href: item.href, description: item.summary }));

export const packageNav: NavItem[] = docsPages
    .filter((item) => item.section === "Packages")
    .map((item) => ({ title: item.title, href: item.href, description: item.summary }));

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function searchDocs(query: string): DocsPage[] {
    const normalized = normalizeText(query).trim();
    if (!normalized) return [];

    const tokens = normalized.split(/\s+/g).filter(Boolean);
    const scored: Array<{ page: DocsPage; score: number }> = [];

    for (let i = 0; i < docsPages.length; i++) {
        const page = docsPages[i]!;
        const haystack = normalizeText(
            `${page.title} ${page.summary} ${page.section} ${page.tags.join(" ")} ${page.id}`,
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
            if (normalizeText(page.title).includes(token)) score += 4;
            if (normalizeText(page.tags.join(" ")).includes(token)) score += 2;
        }

        if (allMatch) scored.push({ page, score });
    }

    scored.sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title));
    return scored.map((item) => item.page);
}
