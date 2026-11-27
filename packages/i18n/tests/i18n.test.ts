import { describe, expect, test } from "bun:test";
import { Kire } from "../../../core/src/kire";
import { KireI18n } from "../src/index";
import { choosePlural, createTranslator } from "../src/translator";

const makeKire = () => {
	const k = new Kire({ production: false });
	k.plugin(KireI18n, {
		locale: "pt",
		fallback: "en",
		translations: {
			pt: {
				messages: {
					welcome: "Olá, :name!",
					items: "{0} nenhum item|{1} um item|[2,*] :count itens",
				},
			},
			en: { messages: { welcome: "Hello, :name!" }, only_en: "English only" },
		},
	});
	return k;
};

describe("@kirejs/i18n — directives", () => {
	test("@lang outputs a translation with replacements", async () => {
		expect(
			(
				await makeKire().render('@lang("messages.welcome", { name: "Ana" })')
			).trim(),
		).toBe("Olá, Ana!");
	});

	test("__() helper works in interpolation", async () => {
		expect(
			(
				await makeKire().render(
					'{{ __("messages.welcome", { name: user }) }}',
					{ user: "Bob" },
				)
			).trim(),
		).toBe("Olá, Bob!");
	});

	test("falls back to the fallback locale, then the key itself", async () => {
		const k = makeKire();
		expect((await k.render('@lang("only_en")')).trim()).toBe("English only");
		expect((await k.render('@lang("nope.key")')).trim()).toBe("nope.key");
	});

	test("@choice pluralizes by count and exposes :count", async () => {
		const k = makeKire();
		expect((await k.render('@choice("messages.items", 0)')).trim()).toBe(
			"nenhum item",
		);
		expect((await k.render('@choice("messages.items", 1)')).trim()).toBe(
			"um item",
		);
		expect((await k.render('@choice("messages.items", 5)')).trim()).toBe(
			"5 itens",
		);
	});

	test("@lang escapes HTML in replacements", async () => {
		expect(
			(
				await makeKire().render('@lang("messages.welcome", { name: raw })', {
					raw: "<b>x</b>",
				})
			).trim(),
		).toBe("Olá, &lt;b&gt;x&lt;/b&gt;!");
	});
});

describe("@kirejs/i18n — translator unit", () => {
	test("choosePlural positional fallback", () => {
		expect(choosePlural("one|many", 1)).toBe("one");
		expect(choosePlural("one|many", 3)).toBe("many");
	});

	test("createTranslator.trans and choice", () => {
		const t = createTranslator({
			locale: "en",
			fallback: "en",
			translations: {
				en: {
					greeting: "Hi :name",
					apples: "{1} :count apple|[2,*] :count apples",
				},
			},
		});
		expect(t.trans("greeting", { name: "Jo" })).toBe("Hi Jo");
		expect(t.choice("apples", 1)).toBe("1 apple");
		expect(t.choice("apples", 4)).toBe("4 apples");
	});
});
