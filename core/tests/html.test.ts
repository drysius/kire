import { expect, test } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Kire } from "../src/index";

test("Kire - HTML Structure and Control Flow", async () => {
	const kire = new Kire({ silent: true });

	const htmlTemplate = `
<div class="user-profile">
    <h1>{{ it.user.name }}</h1>
    @if(it.user.isAdmin)
        <span class="badge">Admin</span>
    @else
        <span class="badge">User</span>
    @end
    <ul>
    @for(item of it.user.items)
        <li>{{ item }}</li>
    @end
    </ul>
</div>`;

	const locals = {
		user: {
			name: "John Doe",
			isAdmin: true,
			items: ["Apple", "Banana"],
		},
	};

	const result = await kire.render(htmlTemplate, locals);

	expect(result).toContain("<h1>John Doe</h1>");
	expect(result).toContain('<span class="badge">Admin</span>');
	expect(result).not.toContain('<span class="badge">User</span>');
	expect(result).toContain("<li>Apple</li>");
	expect(result).toContain("<li>Banana</li>");
});

test("Kire - Nested HTML Components", async () => {
	const testDir = resolve("./test-html-env");
	await mkdir(testDir, { recursive: true });

	const kire = new Kire({ silent: true });
	kire.namespace("ui", testDir);
	kire.$resolver = async (p) => await readFile(p, "utf-8");

	await writeFile(
		join(testDir, "card.kire"),
		`
        <div class="card">
            <div class="card-header">{{ it.title }}</div>
            <div class="card-body">{{ it.slots.default }}</div>
        </div>
    `,
	);

	const tpl = `
        @component('ui.card', { title: 'My Title' })
            <p>Card Content</p>
        @end
    `;

	const result = await kire.render(tpl);
	expect(result).toContain('class="card"');
	expect(result).toContain("My Title");
	expect(result).toContain("Card Content");

	await rm(testDir, { recursive: true, force: true });
});
