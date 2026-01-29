import { expect, test } from "bun:test";
import { Kire } from "kire";
import KireComponents from "../src/index";

test("Kire Components - Should render <x-name> as view", async () => {
	const kire = new Kire({ silent: true });

	// Mock resolver
	kire.$resolver = async (path) => {
		if (path === "components/alert.kire") {
			return `<div class="alert">{{ it.message }}</div>`;
		}
		throw new Error(`File not found: ${path}`);
	};

	// Load plugin
	kire.plugin(KireComponents, { path: "components" });

	const template = `<x-alert message="Hello World"></x-alert>`;
	const result = await kire.render(template);

	expect(result).toBe(`<div class="alert">Hello World</div>`);
});

test("Kire Components - Should support self-closing tags", async () => {
	const kire = new Kire({ silent: true });

	kire.$resolver = async (path) => {
		if (path === "components/alert.kire") {
			return `<div class="alert">{{ it.message }}</div>`;
		}
		throw new Error(`File not found: ${path}`);
	};

	kire.plugin(KireComponents, { path: "components" });

	const template = `<x-alert message="Hello Self" />`;
	const result = await kire.render(template);

	expect(result).toBe(`<div class="alert">Hello Self</div>`);
});

test("Kire Components - Should render nested <x-ui.button>", async () => {
	const kire = new Kire({ silent: true });

	kire.$resolver = async (path) => {
		if (path === "components/ui/button.kire") {
			return `<button>{{ it.label }}</button>`;
		}
		throw new Error(`File not found: ${path}`);
	};

	kire.plugin(KireComponents, { path: "components" });

	const template = `<x-ui.button label="Click Me"></x-ui.button>`;
	const result = await kire.render(template);

	expect(result).toBe(`<button>Click Me</button>`);
});
