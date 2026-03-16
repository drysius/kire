import { beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { syncModelElements } from "../web/utils/model-sync";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost/",
	pretendToBeVisual: true,
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
(global as any).HTMLSelectElement = dom.window.HTMLSelectElement;

describe("Model DOM sync", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	test("clears visual value for defer-bound inputs when server returns empty string", () => {
		document.body.innerHTML = `
            <div id="root" wire:id="sender-1">
                <input id="text" wire:model.defer="text" value="typed value" />
                <textarea id="message" wire:model.defer="message">typed content</textarea>
            </div>
        `;

		const root = document.getElementById("root")!;
		const input = document.getElementById("text") as HTMLInputElement;
		const textarea = document.getElementById("message") as HTMLTextAreaElement;

		input.value = "typed value";
		textarea.value = "typed content";

		syncModelElements(root, { text: "", message: "" });

		expect(input.value).toBe("");
		expect(textarea.value).toBe("");
	});

	test("syncs nested model paths and boolean controls", () => {
		document.body.innerHTML = `
            <div id="root" wire:id="comp-1">
                <input id="name" wire:model.defer="profile.name" value="old" />
                <input id="flag" type="checkbox" wire:model.live="enabled" />
                <input id="role-user" type="radio" value="user" wire:model.live="role" />
                <input id="role-admin" type="radio" value="admin" wire:model.live="role" />
            </div>
        `;

		const root = document.getElementById("root")!;
		const name = document.getElementById("name") as HTMLInputElement;
		const flag = document.getElementById("flag") as HTMLInputElement;
		const roleUser = document.getElementById("role-user") as HTMLInputElement;
		const roleAdmin = document.getElementById("role-admin") as HTMLInputElement;

		syncModelElements(root, {
			profile: { name: "Alice" },
			enabled: true,
			role: "admin",
		});

		expect(name.value).toBe("Alice");
		expect(flag.checked).toBe(true);
		expect(roleUser.checked).toBe(false);
		expect(roleAdmin.checked).toBe(true);
	});

	test("keeps focused text input untouched to preserve in-progress typing", () => {
		document.body.innerHTML = `
            <div id="root" wire:id="comp-2">
                <input id="text" wire:model.live="text" value="draft" />
            </div>
        `;

		const root = document.getElementById("root")!;
		const input = document.getElementById("text") as HTMLInputElement;

		input.focus();
		input.value = "typing-right-now";
		expect(document.activeElement).toBe(input);

		syncModelElements(root, { text: "old-server-value" });
		expect(input.value).toBe("typing-right-now");

		input.blur();
		syncModelElements(root, { text: "after-blur" });
		expect(input.value).toBe("after-blur");
	});
});
