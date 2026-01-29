import { expect, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire Fork - Context Isolation", () => {
	const kire = new Kire({ silent: true });
	kire.$ctx("globalVar", "original");

	const fork = kire.fork();

	// Verify inheritance at fork time
	expect(fork.$contexts.get("globalVar")).toBe("original");

	// Modify fork context
	fork.$ctx("globalVar", "forked");
	fork.$ctx("forkOnly", true);

	// Verify isolation
	expect(fork.$contexts.get("globalVar")).toBe("forked");
	expect(kire.$contexts.get("globalVar")).toBe("original");
	expect(kire.$contexts.has("forkOnly")).toBe(false);

	// Modify parent context after fork
	kire.$ctx("parentAdded", true);
	// Fork SHOULD see updates to parent context maps (because they are layered)
	expect(fork.$contexts.has("parentAdded")).toBe(true);
});

test("Kire Fork - App Globals Isolation", () => {
	const kire = new Kire({ silent: true });
	kire.$global("appVar", 1);
	const fork = kire.fork();

	fork.$global("appVar", 2);
	expect(fork.$globals.get("appVar")).toBe(2);
	expect(kire.$globals.get("appVar")).toBe(1);
});

test("Kire Fork - Shared Resources", async () => {
	const kire = new Kire({ silent: true });
	const fork = kire.fork();

	// Directives are shared
	kire.directive({
		name: "shared",
		onCall(ctx) {
			ctx.raw('$ctx.$add("Shared")');
		},
	});

	expect(fork.getDirective("shared")).toBeDefined();
	const result = await fork.render("@shared()");
	expect(result).toBe("Shared");

	// Compiled Files Cache is shared
	// We simulate this by checking if compiling on fork adds to parent's $files
	const template = "Hello";
	await fork.compileFn(template);

	// Assuming no resolver logic interferes with key generation for raw strings?
	// compileFn doesn't cache to $files unless view() is called or we manually check internal behavior.
	// But `view` caches.

	// Let's use internal check if possible, or assume behavior based on shared Map reference.
	expect(fork.$files).toBe(kire.$files);
	expect(fork.$cache).toBe(kire.$cache);
});
