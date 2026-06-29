/** Documentation content settings: where content lives and how sections order. */
export const docs = {
	/** Markdown content root, relative to the docs package. */
	contentDir: "resources/content",
	/** Section display order in the sidebar (unlisted sections sort last). */
	sectionOrder: ["Kire Essentials", "Kire Internals", "Kire Reference", "Packages"],
	/** UI theme defaults (DaisyUI theme names). */
	theme: { light: "winter", dark: "night" },
} as const;

export type DocsConfig = typeof docs;
