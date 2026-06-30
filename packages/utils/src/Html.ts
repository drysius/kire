import type { RouteManager } from "./Route";

/** Escape a value for safe text/attribute interpolation. */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export class HtmlManager {
	constructor(private route?: RouteManager) {}

	private url(path: string) {
		return this.route ? this.route.to(path) : path;
	}

	attributes(attrs: Record<string, any>): string {
		return Object.entries(attrs)
			.map(([key, value]) => {
				if (value === true) return key;
				if (value === false || value === null || value === undefined) return "";
				return `${key}="${escapeHtml(String(value))}"`;
			})
			.filter(Boolean)
			.join(" ");
	}

	script(src: string, attributes: Record<string, any> = {}) {
		const attrs = this.attributes({ src: this.url(src), ...attributes });
		return `<script ${attrs}></script>`;
	}

	style(href: string, attributes: Record<string, any> = {}) {
		const attrs = this.attributes({
			rel: "stylesheet",
			href: this.url(href),
			...attributes,
		});
		return `<link ${attrs}>`;
	}

	meta(attributes: Record<string, any>) {
		return `<meta ${this.attributes(attributes)}>`;
	}

	favicon(href: string) {
		return `<link rel="shortcut icon" href="${escapeHtml(this.url(href))}">`;
	}

	link(href: string, text: string, attributes: Record<string, any> = {}) {
		return `<a href="${escapeHtml(this.url(href))}" ${this.attributes(attributes)}>${escapeHtml(text)}</a>`;
	}

	image(src: string, alt: string = "", attributes: Record<string, any> = {}) {
		const attrs = this.attributes({ src: this.url(src), alt, ...attributes });
		return `<img ${attrs}>`;
	}

	toHtmlString(html: string) {
		return html;
	}
}
