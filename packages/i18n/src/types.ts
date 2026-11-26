import type { Translations } from "./translator";

export interface I18nOptions {
	/** Active locale. */
	locale: string;
	/** Fallback locale used when a key is missing in the active locale. */
	fallback: string;
	/** Translation trees keyed by locale. */
	translations: Translations;
}
