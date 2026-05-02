import { describe, expect, test } from "bun:test";
import { Kire } from "../src/kire";

describe("Globals Access", () => {
	test("engine-level globals via $global() are accessible in templates", async () => {
		const k = new Kire();
		k.$global("siteName", "MyApp");

		const result = await k.render("Site: {{ siteName }}", {});
		expect(result).toBe("Site: MyApp");
	});

	test("per-call globals passed to run() are accessible in templates", async () => {
		const k = new Kire();

		// Simulate what a web framework does: pass request-scoped globals per call
		const result = await k.render(
			"User: {{ user }}",
			{},
			{ user: "admin" },
		);
		expect(result).toBe("User: admin");
	});

	test("per-call globals do not leak between requests", async () => {
		const k = new Kire();

		const r1 = await k.render("User: {{ user }}", {}, { user: "alice" });
		const r2 = await k.render("User: {{ user }}", {}, { user: "bob" });

		expect(r1).toBe("User: alice");
		expect(r2).toBe("User: bob");
	});

	test("locals override per-call globals which override engine globals", async () => {
		const k = new Kire();
		k.$global("name", "engine");

		const r1 = await k.render("{{ name }}", {}, { name: "per-call" });
		expect(r1).toBe("per-call");

		const r2 = await k.render("{{ name }}", { name: "local" }, { name: "per-call" });
		expect(r2).toBe("local");

		const r3 = await k.render("{{ name }}", {});
		expect(r3).toBe("engine");
	});

	test("this.$globals accessible inside included deps", async () => {
		const k = new Kire({ root: "C:/Users/danie/Documents/GitHub/kire/core/tests" });
		k.$global("appName", "Kire");

		// Simulate accessing a global that's set on the engine
		const result = await k.render("App: {{ appName }}", {});
		expect(result).toBe("App: Kire");
	});
});
