/**
 * Auto-boot entry for the Kirewire client. Built as a standalone IIFE bundle
 * (dist/client/auto.js) that can be dropped in with a classic
 * `<script src="/kirewire.js" defer>` tag — it calls `start()` itself, reading
 * the update endpoint from the script tag's `data-kirewire-url` (default
 * `/_wire`). This is what the framework integration packages serve.
 */
import { start } from "./index";

function currentScript(): HTMLScriptElement | null {
	const el = document.currentScript as HTMLScriptElement | null;
	if (el) return el;
	// `defer`/`module` execution may leave currentScript null — find our tag.
	return document.querySelector<HTMLScriptElement>("script[data-kirewire-url]");
}

const url = currentScript()?.dataset.kirewireUrl || "/_wire";
start({ url, navigate: true });
