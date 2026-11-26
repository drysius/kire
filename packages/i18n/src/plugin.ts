import { kirePlugin } from "kire";
import { createTranslator } from "./translator";
import type { I18nOptions } from "./types";

export const KireI18n = kirePlugin<I18nOptions>(
	{
		locale: "en",
		fallback: "en",
		translations: {},
	},
	(kire, options) => {
		kire.kireSchema({
			name: "@kirejs/i18n",
			author: "Drysius",
			repository: "https://github.com/drysius/kire",
			version: "0.1.0",
		});

		const translator = createTranslator({
			locale: options.locale,
			fallback: options.fallback,
			translations: options.translations,
		});

		// Template helpers: __("key", { name }) and trans(...) / trans_choice(...).
		kire.$global("__", translator.trans);
		kire.$global("trans", translator.trans);
		kire.$global("trans_choice", translator.choice);
		kire.$global("$i18n", translator);

		// @lang("key", replacements?) — output a translation (escaped).
		kire.directive({
			name: "lang",
			signature: ["key:string", "replacements:object"],
			children: false,
			description:
				"Outputs a translation for the given key, with optional :placeholder replacements.",
			example: `@lang("messages.welcome", { name: user.name })`,
			onCall: (api) => {
				const key = api.getArgument(0) ?? api.getAttribute("key");
				const repl = api.getArgument(1) ?? api.getAttribute("replacements") ?? "{}";
				if (!key) return;
				api.write(
					`$kire_response += $escape($globals.__(${key}, ${repl}));`,
				);
			},
		});

		// @choice("key", count, replacements?) — pluralized translation.
		kire.directive({
			name: "choice",
			signature: ["key:string", "count:number", "replacements:object"],
			children: false,
			description:
				"Outputs a pluralized translation chosen by `count` (exposes `:count`).",
			example: `@choice("messages.items", cart.length)`,
			onCall: (api) => {
				const key = api.getArgument(0) ?? api.getAttribute("key");
				const count = api.getArgument(1) ?? api.getAttribute("count") ?? "0";
				const repl = api.getArgument(2) ?? api.getAttribute("replacements") ?? "{}";
				if (!key) return;
				api.write(
					`$kire_response += $escape($globals.trans_choice(${key}, ${count}, ${repl}));`,
				);
			},
		});
	},
);
