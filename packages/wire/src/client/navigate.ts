import { morph } from "./morph";
import type { WireRuntime } from "./runtime";

/**
 * SPA-style navigation for `wire:navigate` links. Intercepts clicks on
 * `<a wire:navigate href="…">`, fetches the target page, morphs its `<body>` into
 * the current one (preserving unchanged chrome like the sidebar), updates the
 * URL/title, and re-binds components — no full reload. Back/forward works via
 * `popstate`. Falls back to a normal navigation on any error.
 */
export function setupNavigate(runtime: WireRuntime): void {
	if (typeof document === "undefined") return;

	let token = 0;

	async function go(url: string, push: boolean): Promise<void> {
		const mine = ++token;
		document.dispatchEvent(new CustomEvent("kirewire:navigating", { detail: { url } }));
		try {
			const res = await fetch(url, { headers: { "x-kirewire-navigate": "1" } });
			if (!res.ok) throw new Error(`navigate ${res.status}`);
			const html = await res.text();
			if (mine !== token) return; // a newer navigation superseded this one

			const next = new DOMParser().parseFromString(html, "text/html");
			document.title = next.title;
			runtime.components.clear();
			morph(document.body, next.body.outerHTML);
			if (push) history.pushState({ kirewireNavigate: true }, "", url);
			window.scrollTo(0, 0);
			runtime.start();
			document.dispatchEvent(new CustomEvent("kirewire:navigated", { detail: { url } }));
		} catch {
			window.location.href = url; // hard fallback
		}
	}

	// Event delegation — survives body morphs, no per-link rebinding.
	document.addEventListener("click", (event) => {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
		const link = (event.target as Element).closest?.("a[wire\\:navigate]") as HTMLAnchorElement | null;
		if (!link) return;
		const href = link.getAttribute("href");
		if (!href || href.startsWith("#") || /^[a-z]+:\/\//i.test(href) || link.target === "_blank") {
			return;
		}
		event.preventDefault();
		void go(href, true);
	});

	window.addEventListener("popstate", () => {
		void go(location.pathname + location.search + location.hash, false);
	});
}
